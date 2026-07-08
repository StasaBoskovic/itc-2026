import { NavLink } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import logo from "../assets/montrails-logo.svg";
import Avatar from "./Avatar";
import { getUserDisplayName } from "../utils/user";

function linkClassName({ isActive }) {
  return isActive ? "nav-link nav-link-active" : "nav-link";
}

export default function Header() {
  const { logout, user } = useAuth();
  const homeLink = user ? "/trails" : "/login";

  return (
    <header className="site-header">
      <NavLink to={homeLink} className="brand">
        <span className="brand-mark">
          <img src={logo} alt="MonTrails logo" className="brand-logo" />
        </span>
        <span>
          <strong>MonTrails</strong>
          <small>Staze Crne Gore</small>
        </span>
      </NavLink>

      <div className="header-side">
        <nav className="main-nav">
          {user && (
            <NavLink to="/trails" className={linkClassName}>
              Staze
            </NavLink>
          )}

          {user?.role === "admin" && (
            <>
              <NavLink to="/admin" className={linkClassName}>
                Dodaj stazu
              </NavLink>
              <NavLink to="/admin/activity" className={linkClassName}>
                Aktivnost korisnika
              </NavLink>
            </>
          )}
        </nav>

        {user ? (
          <div className="header-account-panel">
            <button type="button" className="secondary-button header-logout-button" onClick={logout}>
              Odjava
            </button>
            <NavLink to="/profile" className="user-pill user-pill-link">
              <Avatar user={user} size="tiny" />
              <span className="user-pill-copy">
                <strong>{getUserDisplayName(user)}</strong>
                <small>{user.role === "admin" ? "Admin nalog" : "Korisnicki profil"}</small>
              </span>
            </NavLink>
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
      </div>
    </header>
  );
}
