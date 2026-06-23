import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { api, authConfig } from "../api";
import Avatar from "../components/Avatar";
import BackButton from "../components/BackButton";
import FileUploadField from "../components/FileUploadField";
import TrailCard from "../components/TrailCard";
import { useAuth } from "../context/AuthContext";
import { getUserDisplayName } from "../utils/user";

const initialForm = {
  first_name: "",
  last_name: "",
  age: "",
  bio: "",
};

export default function ProfilePage() {
  const { id } = useParams();
  const { syncUser, token, user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [profileImage, setProfileImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const targetUserId = id ? Number(id) : user?.id;
  const isOwnProfile = Boolean(user && targetUserId === user.id);

  useEffect(() => {
    async function loadProfile() {
      if (!targetUserId) {
        return;
      }

      setLoading(true);
      setError("");

      try {
        const { data } = await api.get(`/users/${targetUserId}`, authConfig(token));
        setProfile(data);
        setForm({
          first_name: data.first_name || "",
          last_name: data.last_name || "",
          age: data.age || "",
          bio: data.bio || "",
        });
      } catch (loadError) {
        setError(loadError.response?.data?.message || "Ne mogu da ucitam profil.");
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [targetUserId, token]);

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("first_name", form.first_name);
      formData.append("last_name", form.last_name);
      formData.append("age", form.age);
      formData.append("bio", form.bio);

      if (profileImage) {
        formData.append("profile_image", profileImage);
      }

      const requestConfig = authConfig(token);
      const { data } = await api.put("/users/me", formData, {
        ...requestConfig,
        headers: {
          ...requestConfig.headers,
          "Content-Type": "multipart/form-data",
        },
      });

      syncUser(data.user);
      setProfile((current) => (current ? { ...current, ...data.user } : current));
      setProfileImage(null);
      setMessage(data.message);
    } catch (saveError) {
      setError(saveError.response?.data?.message || "Profil nije sacuvan.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="page-state">Ucitavanje profila...</div>;
  }

  if (error && !profile) {
    return <div className="page-state error-state">{error}</div>;
  }

  if (!profile) {
    return <div className="page-state error-state">Profil nije pronadjen.</div>;
  }

  const supportsFavorites = profile.supports_favorites;

  return (
    <div className="page-stack">
      <BackButton />

      <section className="profile-hero panel">
        <div className="profile-identity">
          <Avatar user={profile} size="xlarge" />

          <div className="profile-identity-copy">
            <span className="eyebrow">
              {isOwnProfile ? "Moj profil" : "Profil korisnika"}
            </span>
            <h1>{getUserDisplayName(profile)}</h1>
            <p>@{profile.username}</p>
            {profile.bio && <p>{profile.bio}</p>}
          </div>
        </div>

        <div className="profile-stat-grid">
          <div className="hero-stat-card">
            <strong>{profile.age || "--"}</strong>
            <span>godine</span>
          </div>
          <div className="hero-stat-card">
            <strong>{profile.comment_count || 0}</strong>
            <span>komentara</span>
          </div>
          <div className="hero-stat-card">
            <strong>{supportsFavorites ? profile.favorite_count || 0 : "Admin"}</strong>
            <span>{supportsFavorites ? "omiljenih staza" : "uloga"}</span>
          </div>
          <div className="hero-stat-card">
            <strong>{profile.added_trails_count || 0}</strong>
            <span>dodatih staza</span>
          </div>
        </div>
      </section>

      {isOwnProfile && (
        <section className="content-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Uredi profil</span>
              <h2>Tvoji podaci</h2>
            </div>
          </div>

          <form className="panel form-grid" onSubmit={handleSubmit}>
            <label className="field">
              <span>Ime</span>
              <input
                type="text"
                value={form.first_name}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    first_name: event.target.value,
                  }))
                }
              />
            </label>

            <label className="field">
              <span>Prezime</span>
              <input
                type="text"
                value={form.last_name}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    last_name: event.target.value,
                  }))
                }
              />
            </label>

            <label className="field">
              <span>Godine</span>
              <input
                type="number"
                min="0"
                max="120"
                value={form.age}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    age: event.target.value,
                  }))
                }
              />
            </label>

            <FileUploadField
              label="Profilna slika"
              accept="image/*"
              files={profileImage}
              buttonLabel="Izaberi sliku"
              placeholder="Dodaj novu profilnu sliku."
              onChange={(event) =>
                setProfileImage(event.target.files?.[0] || null)
              }
            />

            <label className="field field-full">
              <span>Kratki opis</span>
              <textarea
                rows="4"
                value={form.bio}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    bio: event.target.value,
                  }))
                }
                placeholder="Nesto o tebi, planinarenju ili stazama koje volis."
              />
            </label>

            {error && <p className="form-error field-full">{error}</p>}
            {message && <p className="form-success field-full">{message}</p>}

            <button type="submit" className="primary-button" disabled={saving}>
              {saving ? "Cuvanje..." : "Sacuvaj profil"}
            </button>
          </form>
        </section>
      )}

      {supportsFavorites && (
        <section className="content-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Omiljene staze</span>
              <h2>
                {isOwnProfile
                  ? "Tvoje omiljene staze"
                  : "Omiljene staze korisnika"}
              </h2>
            </div>
            <p>{profile.favorites?.length || 0} sacuvanih staza</p>
          </div>

          {profile.favorites?.length ? (
            <div className="trail-grid">
              {profile.favorites.map((trail) => (
                <TrailCard key={trail.id} trail={trail} />
              ))}
            </div>
          ) : (
            <div className="page-state">
              {isOwnProfile
                ? "Jos nisi dodao nijednu stazu u omiljene."
                : "Ovaj korisnik jos nema omiljenih staza."}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
