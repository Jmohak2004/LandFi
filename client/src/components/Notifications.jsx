import { useMetaverseStore } from '../store/useMetaverseStore';

export function Notifications() {
  const notifications = useMetaverseStore(s => s.notifications);
  if (!notifications.length) return null;

  return (
    <div className="notifications">
      {notifications.map(n => (
        <div key={n.id} className={`notification ${n.type}`}>
          {n.message}
        </div>
      ))}
    </div>
  );
}
