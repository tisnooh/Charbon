/** Barre d'onglets iOS — 5 destinations principales. */
import { NavLink } from 'react-router-dom';
import { HomeIcon, ListIcon, RepeatIcon, CheckSquareIcon, UserIcon } from './icons.js';

const TABS = [
  { to: '/', label: 'Aujourd’hui', Icon: HomeIcon, end: true },
  { to: '/tasks', label: 'Tâches', Icon: ListIcon, end: false },
  { to: '/habits', label: 'Habitudes', Icon: RepeatIcon, end: false },
  { to: '/routines', label: 'Routines', Icon: CheckSquareIcon, end: false },
  { to: '/profile', label: 'Profil', Icon: UserIcon, end: false },
] as const;

export function TabBar({ showNotificationsDot = false }: { showNotificationsDot?: boolean }) {
  return (
    <nav className="tabbar" aria-label="Navigation principale">
      <div className="tabbar__inner">
        {TABS.map(({ to, label, Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => `tabbar__item ${isActive ? 'tabbar__item--active' : ''}`}
            aria-label={label}
          >
            <Icon />
            <span>{label}</span>
            {to === '/' && showNotificationsDot && <span className="tabbar__dot" aria-hidden="true" />}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
