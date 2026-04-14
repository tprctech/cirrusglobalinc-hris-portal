from app.db.models import Notification


def create_notification(
    db,
    user_id: int,
    notification_type: str,
    title: str,
    message: str,
    link: str | None = None,
):
    notif = Notification(
        user_id=user_id,
        type=notification_type,
        title=title,
        message=message,
        link=link,
    )
    db.add(notif)
