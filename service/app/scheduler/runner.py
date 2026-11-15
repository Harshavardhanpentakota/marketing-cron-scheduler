import time
import logging
from datetime import datetime, timezone
from croniter import croniter
from app.database import SessionLocal
from app.models.alert import Alert, ScheduleType
from app.models.log import AlertLog, LogStatus
from app.dispatchers.whatsapp import send_whatsapp_message
from app.dispatchers.email import send_email_message

logger = logging.getLogger("scheduler.runner")

def render_template(text: str, alert: Alert) -> str:
    """Replaces placeholders like {client_name}, {business_name} with actual alert data."""
    now = datetime.now(timezone.utc)
    replacements = {
        "{client_name}": alert.client_name,
        "{business_name}": alert.business_name,
        "{subject}": alert.subject,
        "{date}": now.strftime("%Y-%m-%d"),
        "{time}": now.strftime("%H:%M:%S UTC"),
    }
    rendered = text
    for key, val in replacements.items():
        rendered = rendered.replace(key, str(val))
    return rendered

async def execute_alert(alert_id: str) -> None:
    """
    Executes a scheduled or manual trigger for the specified alert_id.
    Dispatches to WhatsApp and/or Email according to alert configuration,
    and stores an execution record in AlertLog.
    """
    start_time = time.time()
    db = SessionLocal()
    try:
        alert = db.query(Alert).filter(Alert.id == alert_id).first()
        if not alert:
            logger.warning(f"execute_alert: Alert {alert_id} not found in database.")
            return

        if not alert.is_active:
            logger.info(f"execute_alert: Alert {alert_id} is inactive. Skipping.")
            return

        logger.info(f"▶ Executing Alert {alert.id}: '{alert.subject}' for {alert.client_name} ({alert.business_name})")

        rendered_subject = render_template(alert.subject, alert)
        rendered_body = render_template(alert.body, alert)

        has_phone = bool(alert.phone_number and alert.phone_number.strip())
        has_email = bool(alert.email and alert.email.strip())

        channels_attempted = []
        whatsapp_status = None
        whatsapp_response = None
        email_status = None
        email_response = None

        # Dispatch WhatsApp if phone is present
        if has_phone:
            channels_attempted.append("whatsapp")
            wa_ok, wa_resp = await send_whatsapp_message(
                to_number=alert.phone_number,
                message=f"*{rendered_subject}*\n\n{rendered_body}",
                business_name=alert.business_name
            )
            whatsapp_status = "SUCCESS" if wa_ok else "FAILED"
            whatsapp_response = wa_resp

        # Dispatch Email if email is present
        if has_email:
            channels_attempted.append("email")
            em_ok, em_resp = await send_email_message(
                to_email=alert.email,
                subject=rendered_subject,
                body=rendered_body,
                business_name=alert.business_name
            )
            email_status = "SUCCESS" if em_ok else "FAILED"
            email_response = em_resp

        # Determine overall log status
        success_count = sum(1 for s in [whatsapp_status, email_status] if s == "SUCCESS")
        total_channels = len(channels_attempted)

        if total_channels == 0:
            final_status = LogStatus.FAILED
        elif success_count == total_channels:
            final_status = LogStatus.SUCCESS
        elif success_count > 0:
            final_status = LogStatus.PARTIAL
        else:
            final_status = LogStatus.FAILED

        elapsed_ms = int((time.time() - start_time) * 1000)

        # Create AlertLog entry
        log_entry = AlertLog(
            alert_id=alert.id,
            executed_at=datetime.now(timezone.utc),
            status=final_status,
            channels_attempted=",".join(channels_attempted),
            whatsapp_status=whatsapp_status,
            whatsapp_response=whatsapp_response,
            email_status=email_status,
            email_response=email_response,
            rendered_subject=rendered_subject,
            rendered_body=rendered_body,
            duration_ms=elapsed_ms
        )
        db.add(log_entry)

        # Update Alert state
        now_utc = datetime.now(timezone.utc)
        alert.last_run_at = now_utc

        if alert.schedule_type == ScheduleType.STATIC:
            # One-time static alert: mark as completed / inactive
            alert.is_active = False
            alert.next_run_at = None
            logger.info(f"✓ Static alert {alert.id} completed. Marked inactive.")
        elif alert.schedule_type == ScheduleType.CRON and alert.cron_expression:
            try:
                itr = croniter(alert.cron_expression, now_utc)
                alert.next_run_at = itr.get_next(datetime)
            except Exception as e:
                logger.error(f"Error calculating next run for cron alert {alert.id}: {e}")

        db.commit()
        logger.info(f"✓ Alert {alert.id} execution recorded with status={final_status.value} ({elapsed_ms}ms)")

    except Exception as e:
        db.rollback()
        logger.exception(f"Unhandled error executing alert {alert_id}: {e}")
    finally:
        db.close()
