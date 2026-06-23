import { NavLink } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

function bottomLinkClassName({ isActive }) {
  return isActive ? "bottom-nav-link bottom-nav-link-active" : "bottom-nav-link";
}

export default function BottomNav() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <nav className="bottom-nav" aria-label="Brza navigacija">
      <NavLink to="/trails" className={bottomLinkClassName}>
        <span className="bottom-nav-icon bottom-nav-icon-trails" aria-hidden="true" />
        <span>Staze</span>
      </NavLink>

      {user.role === "admin" && (
        <NavLink to="/admin" className={bottomLinkClassName}>
          <span className="bottom-nav-icon bottom-nav-icon-admin" aria-hidden="true" />
          <span>Dodaj</span>
        </NavLink>
      )}

      <NavLink to="/profile" className={bottomLinkClassName}>
        <span className="bottom-nav-icon bottom-nav-icon-profile" aria-hidden="true" />
        <span>Profil</span>
      </NavLink>
    </nav>
  );
}
