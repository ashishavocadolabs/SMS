import { NavLink } from "react-router-dom";
import { useState, type ReactNode } from "react";
import { LogoutIcon } from "./Icons";

export interface SidebarItem {
  label: string;
  to: string;
  icon: ReactNode;
}

interface Props {
  title: string;
  subtitle?: string;
  items: SidebarItem[];
  onLogout: () => void;
}

function ThreeDotsIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="5" r="1.5" fill="currentColor" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      <circle cx="12" cy="19" r="1.5" fill="currentColor" />
    </svg>
  );
}

export function Sidebar({ title, subtitle, items, onLogout }: Props) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={`sidebar${collapsed ? " sidebar--collapsed" : ""}`}>
      <div className="sidebar__header">
        <div className="sidebar__brand">
          <div className="sidebar__avatar">{title.charAt(0).toUpperCase()}</div>
          {!collapsed && (
            <div>
              <h2>{title}</h2>
              {subtitle && <span className="sidebar__subtitle">{subtitle}</span>}
            </div>
          )}
        </div>
        <button
          className="sidebar__toggle"
          onClick={() => setCollapsed((c) => !c)}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ThreeDotsIcon size={18} />
        </button>
      </div>

      <nav className="sidebar__nav">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/student" || item.to === "/teacher"}
            className={({ isActive }) =>
              "sidebar__link" + (isActive ? " sidebar__link--active" : "")
            }
            title={collapsed ? item.label : undefined}
          >
            <span className="sidebar__link-icon">{item.icon}</span>
            {!collapsed && <span className="sidebar__link-label">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <button className="sidebar__logout" onClick={onLogout} title={collapsed ? "Sign Out" : undefined}>
        <span className="sidebar__logout-icon"><LogoutIcon size={16} /></span>
        {!collapsed && <span>Sign Out</span>}
      </button>
    </aside>
  );
}

