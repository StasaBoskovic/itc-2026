import { NavLink } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

function linkClassName({ isActive }) {
  return isActive ? "nav-link nav-link-active" : "nav-link";
}

export default function Header() {
  const { logout, user } = useAuth();

  return (
    <header className="site-header">
      <NavLink to="/" className="brand">
        <span className="brand-mark">MT</span>
        <span>
          <strong>MonTrails</strong>
          <small>Staze Crne Gore</small>
        </span>
      </NavLink>

      <nav className="main-nav">
        <NavLink to="/" className={linkClassName}>
          Staze
        </NavLink>

        {user?.role === "admin" && (
          <NavLink to="/admin" className={linkClassName}>
            Dodaj stazu
          </NavLink>
        )}

        {user ? (
          <div className="auth-strip">
            <span className="user-pill">
              {user.username} ({user.role})
            </span>
            <button type="button" className="secondary-button" onClick={logout}>
              Odjava
            </button>
          </div>
        ) : (
          <div className="auth-strip">
            <NavLink to="/login" className={linkClassName}>
              Prijava
            </NavLink>
            <NavLink to="/register" className={linkClassName}>
              Registracija
            </NavLink>
          </div>
        )}
      </nav>
    </header>
  );
}

