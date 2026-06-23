import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import AuthShowcase from "../components/AuthShowcase";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      await login(form);
      navigate(location.state?.from?.pathname || "/trails");
    } catch (submissionError) {
      setError(
        submissionError.response?.data?.message || "Prijava nije uspjela."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="auth-page">
      <div className="auth-layout">
        <AuthShowcase
          title="Udji u svoj vodic kroz crnogorske staze."
          description="Prijavi se i otvori mapu utisaka, komentara i fotografija sa najljepsih planinskih i pjesackih ruta."
        />

        <form className="panel auth-form" onSubmit={handleSubmit}>
          <span className="eyebrow">Ulaz u aplikaciju</span>
          <h1>Prijava</h1>
          <p>
            Prijavi se da bi pristupio stazama, komentarima, slikama i
            ocjenama.
          </p>

          <label className="field">
            <span>Email</span>
            <input
              type="email"
              required
              value={form.email}
              onChange={(event) =>
                setForm((current) => ({ ...current, email: event.target.value }))
              }
            />
          </label>

          <label className="field">
            <span>Password</span>
            <input
              type="password"
              required
              value={form.password}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  password: event.target.value,
                }))
              }
            />
          </label>

          {error && <p className="form-error">{error}</p>}

          <button type="submit" className="primary-button" disabled={loading}>
            {loading ? "Prijavljivanje..." : "Prijavi se"}
          </button>

          <p className="auth-switch">
            Nemas nalog? <Link to="/register">Registruj se</Link>
          </p>
        </form>
      </div>
    </section>
  );
}
