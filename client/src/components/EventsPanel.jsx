import { X, Users, DollarSign } from 'lucide-react';
import { useMetaverseStore } from '../store/useMetaverseStore';
import { ZONE_COLORS } from '../world/colors';

export function EventsPanel() {
  const activePanel = useMetaverseStore(s => s.activePanel);
  const setActivePanel = useMetaverseStore(s => s.setActivePanel);
  const events = useMetaverseStore(s => s.events);

  if (activePanel !== 'events') return null;

  return (
    <div className="panel events-panel">
      <header className="panel-header">
        <div>
          <h2>Venue Events</h2>
          <p className="panel-sub">Live gatherings, markets, and experiences across zones</p>
        </div>
        <button className="icon-btn" onClick={() => setActivePanel(null)}><X size={18} /></button>
      </header>

      <div className="events-list">
        {events.map(evt => (
          <div key={evt.id} className="event-card">
            <div className="event-glow" style={{ background: ZONE_COLORS[evt.zone] || '#00f0ff' }} />
            <h3>{evt.title}</h3>
            <p className="event-zone" style={{ color: ZONE_COLORS[evt.zone] }}>{evt.zone}</p>
            <div className="event-stats">
              <span><Users size={14} /> {evt.attendees.toLocaleString()}</span>
              <span><DollarSign size={14} /> {evt.revenue.toLocaleString()} META</span>
              <span>{evt.date}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
