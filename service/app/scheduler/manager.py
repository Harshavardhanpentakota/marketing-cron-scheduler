import logging
from datetime import datetime, timezone
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.date import DateTrigger
from croniter import croniter
from app.database import SessionLocal
from app.models.alert import Alert, ScheduleType
from app.scheduler.runner import execute_alert

logger = logging.getLogger("scheduler.manager")

class SchedulerManager:
    def __init__(self):
        self.scheduler = AsyncIOScheduler()

    def start(self):
        if not self.scheduler.running:
            self.scheduler.start()
            logger.info("APScheduler engine started.")

    def shutdown(self):
        if self.scheduler.running:
            self.scheduler.shutdown()
            logger.info("APScheduler engine shutdown.")

    def add_alert_job(self, alert: Alert) -> None:
        """Schedules or updates an alert in APScheduler."""
        job_id = alert.id
        
        # Remove existing if present
        if self.scheduler.get_job(job_id):
            self.scheduler.remove_job(job_id)

        if not alert.is_active:
            logger.info(f"Alert {alert.id} is inactive; not scheduling job.")
            return

        now_utc = datetime.now(timezone.utc)

        if alert.schedule_type == ScheduleType.STATIC:
            if not alert.run_at:
                logger.warning(f"Static alert {alert.id} has no run_at datetime.")
                return

            run_date = alert.run_at
            if run_date.tzinfo is None:
                run_date = run_date.replace(tzinfo=timezone.utc)

            if run_date <= now_utc:
                logger.warning(f"Static alert {alert.id} run_at {run_date} is in the past. Not scheduling.")
                return

            trigger = DateTrigger(run_date=run_date)
            self.scheduler.add_job(
                execute_alert,
                trigger=trigger,
                args=[alert.id],
                id=job_id,
                name=f"Static: {alert.subject}",
                replace_existing=True
            )
            logger.info(f"Scheduled STATIC alert {alert.id} to run at {run_date}")

        elif alert.schedule_type == ScheduleType.CRON:
            if not alert.cron_expression:
                logger.warning(f"Cron alert {alert.id} has no cron_expression.")
                return

            try:
                trigger = CronTrigger.from_crontab(alert.cron_expression, timezone="UTC")
                self.scheduler.add_job(
                    execute_alert,
                    trigger=trigger,
                    args=[alert.id],
                    id=job_id,
                    name=f"Cron: {alert.subject} ({alert.cron_expression})",
                    replace_existing=True
                )
                logger.info(f"Scheduled CRON alert {alert.id} with expression '{alert.cron_expression}'")
            except Exception as e:
                logger.error(f"Failed to create CronTrigger for alert {alert.id}: {e}")

    def remove_alert_job(self, alert_id: str) -> None:
        """Removes a job from the scheduler if registered."""
        if self.scheduler.get_job(alert_id):
            self.scheduler.remove_job(alert_id)
            logger.info(f"Removed job {alert_id} from scheduler.")

    def resync_jobs(self) -> None:
        """On startup, synchronizes all active alerts from database into scheduler."""
        logger.info("Resyncing all active alerts from database...")
        db = SessionLocal()
        try:
            active_alerts = db.query(Alert).filter(Alert.is_active == True).all()
            now_utc = datetime.now(timezone.utc)
            scheduled_count = 0

            for alert in active_alerts:
                if alert.schedule_type == ScheduleType.STATIC:
                    run_date = alert.run_at
                    if run_date and run_date.tzinfo is None:
                        run_date = run_date.replace(tzinfo=timezone.utc)
                    if run_date and run_date > now_utc:
                        self.add_alert_job(alert)
                        scheduled_count += 1
                    else:
                        # Static alert already passed
                        alert.is_active = False
                elif alert.schedule_type == ScheduleType.CRON:
                    self.add_alert_job(alert)
                    # compute next run at
                    try:
                        itr = croniter(alert.cron_expression, now_utc)
                        alert.next_run_at = itr.get_next(datetime)
                    except Exception:
                        pass
                    scheduled_count += 1

            db.commit()
            logger.info(f"Successfully resynced {scheduled_count} jobs into APScheduler.")
        except Exception as e:
            logger.exception(f"Error during job resync: {e}")
        finally:
            db.close()

scheduler_manager = SchedulerManager()
