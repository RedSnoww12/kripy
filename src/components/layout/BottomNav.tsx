import { NavLink } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/', label: 'Accueil', icon: 'home', end: true },
  { to: '/stats', label: 'Stats', icon: 'monitoring', end: false },
  { to: '/meals', label: 'Repas', icon: 'restaurant', end: false },
  { to: '/recipes', label: 'Recettes', icon: 'menu_book', end: false },
  { to: '/sport', label: 'Sport', icon: 'fitness_center', end: false },
  { to: '/settings', label: 'Réglages', icon: 'settings', end: false },
] as const;

export default function BottomNav() {
  return (
    <nav className="nav">
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) => (isActive ? 'active' : '')}
        >
          <span className="material-symbols-outlined">{item.icon}</span>
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
