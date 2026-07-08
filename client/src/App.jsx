import { Navigate, Route, Routes, useLocation } from "react-router-dom";

import BottomNav from "./components/BottomNav";
import Header from "./components/Header";
import { useAuth } from "./context/AuthContext";
import AdminActivityPage from "./pages/AdminActivityPage";
import AdminPage from "./pages/AdminPage";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import ProfilePage from "./pages/ProfilePage";
import RegisterPage from "./pages/RegisterPage";
import TrailDetailsPage from "./pages/TrailDetailsPage";

function ProtectedRoute({ children, role }) {
  const { booting, user } = useAuth();
  const location = useLocation();

  if (booting) {
    return <div className="page-state">Provjera naloga...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (role && user.role !== role) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function PublicOnlyRoute({ children }) {
  const { booting, user } = useAuth();

  if (booting) {
    return <div className="page-state">Provjera naloga...</div>;
  }

  if (user) {
    return <Navigate to="/trails" replace />;
  }

  return children;
}

function RootRedirect() {
  const { booting, user } = useAuth();

  if (booting) {
    return <div className="page-state">Provjera naloga...</div>;
  }

  return <Navigate to={user ? "/trails" : "/login"} replace />;
}

export default function App() {
  const location = useLocation();
  const { user } = useAuth();
  const isAuthRoute =
    location.pathname === "/login" || location.pathname === "/register";

  return (
    <div className={`app-shell ${isAuthRoute ? "app-shell-auth" : "app-shell-private"}`}>
      <div className="app-frame">
        {!isAuthRoute && <Header />}

        <main className={`main-content ${isAuthRoute ? "main-content-auth" : ""}`}>
          <Routes>
            <Route path="/" element={<RootRedirect />} />
            <Route
              path="/login"
              element={
                <PublicOnlyRoute>
                  <LoginPage />
                </PublicOnlyRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicOnlyRoute>
                  <RegisterPage />
                </PublicOnlyRoute>
              }
            />
            <Route
              path="/trails"
              element={
                <ProtectedRoute>
                  <HomePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/trails/:id"
              element={
                <ProtectedRoute>
                  <TrailDetailsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute role="admin">
                  <AdminPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/trails/:trailId/edit"
              element={
                <ProtectedRoute role="admin">
                  <AdminPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/activity"
              element={
                <ProtectedRoute role="admin">
                  <AdminActivityPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/users/:id"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<RootRedirect />} />
          </Routes>
        </main>

        {user && !isAuthRoute && <BottomNav />}
      </div>
    </div>
  );
}
