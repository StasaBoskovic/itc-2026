import { Navigate, Route, Routes, useLocation } from "react-router-dom";

import Header from "./components/Header";
import { useAuth } from "./context/AuthContext";
import AdminPage from "./pages/AdminPage";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
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

export default function App() {
  return (
    <div className="app-shell">
      <Header />

      <main className="main-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/trails/:id" element={<TrailDetailsPage />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute role="admin">
                <AdminPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
    </div>
  );
}

