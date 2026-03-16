import { NavLink } from "react-router-dom";

interface Props {
  title: string;
  items: Array<{ label: string; to: string }>;
  onLogout: () => void;
}

export function Sidebar({ title, items, onLogout }: Props) {
  return (
    <aside className="sidebar">
      <div className="sidebar__header">
        <h2>{title}</h2>
      </div>

      <nav className="sidebar__nav">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              "sidebar__link" + (isActive ? " sidebar__link--active" : "")
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <button className="sidebar__logout" onClick={onLogout}>
        Logout
      </button>
    </aside>
  );
}
