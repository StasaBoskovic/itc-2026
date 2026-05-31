import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { api, authConfig } from "../api";
import { useAuth } from "../context/AuthContext";

const initialForm = {
  name: "",
  city: "",
  start_lat: "",
  start_lng: "",
  end_lat: "",
  end_lng: "",
  length_km: "",
  elevation_gain: "",
  highest_point: "",
  difficulty_id: "",
  ecological_status_id: "",
  camping_allowed: false,
  description: "",
};

export default function AdminPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [terrainTypes, setTerrainTypes] = useState([]);
  const [difficulties, setDifficulties] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [selectedTerrainIds, setSelectedTerrainIds] = useState([]);
  const [images, setImages] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadMeta() {
      try {
        const [difficultiesResponse, statusesResponse, terrainResponse] =
          await Promise.all([
            api.get("/meta/difficulties"),
            api.get("/meta/ecological-statuses"),
            api.get("/meta/terrain-types"),
          ]);

        setDifficulties(difficultiesResponse.data);
        setStatuses(statusesResponse.data);
        setTerrainTypes(terrainResponse.data);
      } catch (_error) {
        setError("Ne mogu da ucitam potrebne sifarnike.");
      }
    }

    loadMeta();
  }, []);

  function toggleTerrain(terrainId) {
    setSelectedTerrainIds((current) =>
      current.includes(terrainId)
        ? current.filter((item) => item !== terrainId)
        : [...current, terrainId]
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const formData = new FormData();

      Object.entries(form).forEach(([key, value]) => {
        formData.append(key, value);
      });

      formData.append("terrain_ids", JSON.stringify(selectedTerrainIds));

      images.forEach((image) => {
        formData.append("images", image);
      });

      const { data } = await api.post("/trails", formData, {
        ...authConfig(token),
        headers: {
          ...authConfig(token).headers,
          "Content-Type": "multipart/form-data",
        },
      });

      setSuccess("Staza je uspjesno dodata.");
      setForm(initialForm);
      setSelectedTerrainIds([]);
      setImages([]);
      navigate(`/trails/${data.trailId}`);
    } catch (submissionError) {
      setError(
        submissionError.response?.data?.message ||
          "Dodavanje staze nije uspjelo."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="content-section">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Admin panel</span>
          <h1>Dodavanje nove staze</h1>
        </div>
        <p>Unesi osnovne podatke, tipove terena i galeriju.</p>
      </div>

      <form className="panel form-grid" onSubmit={handleSubmit}>
        <label className="field">
          <span>Naziv staze</span>
          <input
            type="text"
            required
            value={form.name}
            onChange={(event) =>
              setForm((current) => ({ ...current, name: event.target.value }))
            }
          />
        </label>

        <label className="field">
          <span>Grad / regija</span>
          <input
            type="text"
            required
            value={form.city}
            onChange={(event) =>
              setForm((current) => ({ ...current, city: event.target.value }))
            }
          />
        </label>

        <label className="field">
          <span>Pocetna latituda</span>
          <input
            type="number"
            step="0.0000001"
            required
            value={form.start_lat}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                start_lat: event.target.value,
              }))
            }
          />
        </label>

        <label className="field">
          <span>Pocetna longituda</span>
          <input
            type="number"
            step="0.0000001"
            required
            value={form.start_lng}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                start_lng: event.target.value,
              }))
            }
          />
        </label>

        <label className="field">
          <span>Krajnja latituda</span>
          <input
            type="number"
            step="0.0000001"
            required
            value={form.end_lat}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                end_lat: event.target.value,
              }))
            }
          />
        </label>

        <label className="field">
          <span>Krajnja longituda</span>
          <input
            type="number"
            step="0.0000001"
            required
            value={form.end_lng}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                end_lng: event.target.value,
              }))
            }
          />
        </label>

        <label className="field">
          <span>Duzina (km)</span>
          <input
            type="number"
            step="0.01"
            required
            value={form.length_km}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                length_km: event.target.value,
              }))
            }
          />
        </label>

        <label className="field">
          <span>Uspon (m)</span>
          <input
            type="number"
            required
            value={form.elevation_gain}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                elevation_gain: event.target.value,
              }))
            }
          />
        </label>

        <label className="field">
          <span>Najvisa tacka (m)</span>
          <input
            type="number"
            required
            value={form.highest_point}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                highest_point: event.target.value,
              }))
            }
          />
        </label>

        <label className="field">
          <span>Tezina</span>
          <select
            required
            value={form.difficulty_id}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                difficulty_id: event.target.value,
              }))
            }
          >
            <option value="">Izaberi</option>
            {difficulties.map((difficulty) => (
              <option key={difficulty.id} value={difficulty.id}>
                {difficulty.name}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Ekoloski status</span>
          <select
            required
            value={form.ecological_status_id}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                ecological_status_id: event.target.value,
              }))
            }
          >
            <option value="">Izaberi</option>
            {statuses.map((status) => (
              <option key={status.id} value={status.id}>
                {status.status_name}
              </option>
            ))}
          </select>
        </label>

        <label className="field field-full">
          <span>Opis staze</span>
          <textarea
            rows="5"
            value={form.description}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                description: event.target.value,
              }))
            }
          />
        </label>

        <label className="toggle-field">
          <input
            type="checkbox"
            checked={form.camping_allowed}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                camping_allowed: event.target.checked,
              }))
            }
          />
          <span>Kampovanje je dozvoljeno</span>
        </label>

        <label className="field field-full">
          <span>Slike staze</span>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(event) => setImages(Array.from(event.target.files || []))}
          />
          <small>{images.length} izabranih slika</small>
        </label>

        <div className="field field-full">
          <span>Tipovi terena</span>
          <div className="chip-grid">
            {terrainTypes.map((terrain) => (
              <label key={terrain.id} className="chip-toggle">
                <input
                  type="checkbox"
                  checked={selectedTerrainIds.includes(terrain.id)}
                  onChange={() => toggleTerrain(terrain.id)}
                />
                <span>{terrain.name}</span>
              </label>
            ))}
          </div>
        </div>

        {error && <p className="form-error field-full">{error}</p>}
        {success && <p className="form-success field-full">{success}</p>}

        <button type="submit" className="primary-button" disabled={loading}>
          {loading ? "Cuvanje..." : "Sacuvaj stazu"}
        </button>
      </form>
    </section>
  );
}

