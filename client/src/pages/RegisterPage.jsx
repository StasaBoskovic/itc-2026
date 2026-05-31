import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: "",
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
      await register(form);
      navigate("/");
    } catch (submissionError) {
      setError(
        submissionError.response?.data?.message ||
          "Registracija nije uspjela."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="auth-page">
      <form className="panel auth-form" onSubmit={handleSubmit}>
        <span className="eyebrow">Novi nalog</span>
        <h1>Registracija</h1>
        <p>Kreiraj nalog da bi mogao da komentarises i ocjenjujes staze.</p>

        <label className="field">
          <span>Username</span>
          <input
            type="text"
            required
            value={form.username}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                username: event.target.value,
              }))
            }
          />
        </label>

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
            minLength="6"
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
          {loading ? "Kreiranje..." : "Registruj se"}
        </button>

        <p className="auth-switch">
          Vec imas nalog? <Link to="/login">Prijavi se</Link>
        </p>
      </form>
    </section>
  );
}

