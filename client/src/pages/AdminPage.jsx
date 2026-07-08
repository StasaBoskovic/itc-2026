import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { api, authConfig, resolveAssetUrl } from "../api";
import BackButton from "../components/BackButton";
import FileUploadField from "../components/FileUploadField";
import TrailRouteMap from "../components/TrailRouteMap";
import { useAuth } from "../context/AuthContext";
import { hasRouteMap } from "../utils/trailMap";

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

function toInputValue(value) {
  return value == null ? "" : String(value);
}

export default function AdminPage() {
  const { trailId } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [terrainTypes, setTerrainTypes] = useState([]);
  const [difficulties, setDifficulties] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [selectedTerrainIds, setSelectedTerrainIds] = useState([]);
  const [images, setImages] = useState([]);
  const [routeMap, setRouteMap] = useState(null);
  const [existingGallery, setExistingGallery] = useState([]);
  const [replaceGallery, setReplaceGallery] = useState(false);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [loadingTrail, setLoadingTrail] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const numericTrailId = Number(trailId);
  const isEditing = Boolean(trailId);

  function resetFormState() {
    setForm(initialForm);
    setSelectedTerrainIds([]);
    setImages([]);
    setRouteMap(null);
    setExistingGallery([]);
    setReplaceGallery(false);
  }

  useEffect(() => {
    async function loadMeta() {
      setLoadingMeta(true);

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
      } finally {
        setLoadingMeta(false);
      }
    }

    loadMeta();
  }, []);

  useEffect(() => {
    async function loadTrailForEditing() {
      if (!isEditing) {
        resetFormState();
        return;
      }

      if (!Number.isInteger(numericTrailId)) {
        setError("Neispravan ID staze za izmjenu.");
        return;
      }

      setLoadingTrail(true);
      setError("");
      setSuccess("");

      try {
        const { data } = await api.get(
          `/trails/${numericTrailId}`,
          authConfig(token)
        );

        setForm({
          name: data.name || "",
          city: data.city || "",
          start_lat: toInputValue(data.start_lat),
          start_lng: toInputValue(data.start_lng),
          end_lat: toInputValue(data.end_lat),
          end_lng: toInputValue(data.end_lng),
          length_km: toInputValue(data.length_km),
          elevation_gain: toInputValue(data.elevation_gain),
          highest_point: toInputValue(data.highest_point),
          difficulty_id: toInputValue(data.difficulty_id),
          ecological_status_id: toInputValue(data.ecological_status_id),
          camping_allowed: Boolean(data.camping_allowed),
          description: data.description || "",
        });
        setSelectedTerrainIds((data.terrains || []).map((terrain) => Number(terrain.id)));
        setExistingGallery(data.gallery || []);
        setImages([]);
        setReplaceGallery(false);
        setRouteMap(data.route_map_data || null);
      } catch (loadError) {
        setError(
          loadError.response?.data?.message ||
            "Ne mogu da ucitam podatke o stazi za izmjenu."
        );
      } finally {
        setLoadingTrail(false);
      }
    }

    loadTrailForEditing();
  }, [isEditing, numericTrailId, token]);

  function toggleTerrain(terrainId) {
    setSelectedTerrainIds((current) =>
      current.includes(terrainId)
        ? current.filter((item) => item !== terrainId)
        : [...current, terrainId]
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const formData = new FormData();

      Object.entries(form).forEach(([key, value]) => {
        formData.append(key, value);
      });

      formData.append("terrain_ids", JSON.stringify(selectedTerrainIds));
      formData.append(
        "route_map_data",
        hasRouteMap(routeMap) ? JSON.stringify(routeMap) : ""
      );
      formData.append("replace_gallery", String(replaceGallery));

      images.forEach((image) => {
        formData.append("images", image);
      });

      const requestConfig = {
        ...authConfig(token),
        headers: {
          ...authConfig(token).headers,
          "Content-Type": "multipart/form-data",
        },
      };

      if (isEditing) {
        const { data } = await api.put(
          `/trails/${numericTrailId}`,
          formData,
          requestConfig
        );
        setSuccess(data.message || "Staza je uspjesno izmijenjena.");
        navigate(`/trails/${numericTrailId}`);
        return;
      }

      const { data } = await api.post("/trails", formData, requestConfig);
      setSuccess(data.message || "Staza je uspjesno dodata.");
      resetFormState();
      navigate(`/trails/${data.trailId}`);
    } catch (submissionError) {
      setError(
        submissionError.response?.data?.message ||
          (isEditing
            ? "Izmjena staze nije uspjela."
            : "Dodavanje staze nije uspjelo.")
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (isEditing && loadingTrail) {
    return <div className="page-state">Ucitavanje staze za izmjenu...</div>;
  }

  return (
    <div className="page-stack">
      <section className="content-section">
        <BackButton />

        <div className="section-heading">
          <div>
            <span className="eyebrow">Admin panel</span>
            <h1>{isEditing ? "Izmijeni stazu" : "Dodavanje nove staze"}</h1>
          </div>
          <p>
            {isEditing
              ? "Azuriraj osnovne podatke, teren, slike i skicu rute."
              : "Unesi osnovne podatke, tipove terena i galeriju."}
          </p>
        </div>

        {isEditing && (
          <div className="panel admin-edit-banner">
            <div>
              <span className="eyebrow">Uredjivanje staze</span>
              <h2>{form.name || "Odabrana staza"}</h2>
              <p>
                Ovdje mijenjas samo izabranu stazu. Za novu stazu vrati se na
                stranicu Dodaj stazu.
              </p>
            </div>

            <div className="admin-inline-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => navigate(`/trails/${numericTrailId}`)}
              >
                Pogledaj detalje
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={() => navigate("/trails")}
              >
                Nazad na staze
              </button>
            </div>
          </div>
        )}

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
              disabled={loadingMeta}
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
              disabled={loadingMeta}
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

          {isEditing && existingGallery.length > 0 && (
            <div className="field field-full">
              <span>Postojece slike staze</span>
              <div className="admin-gallery-preview">
                {existingGallery.map((image) => (
                  <img
                    key={image.id}
                    src={resolveAssetUrl(image.image_url)}
                    alt={`Postojeca slika staze ${form.name}`}
                    className="admin-gallery-preview-image"
                  />
                ))}
              </div>
            </div>
          )}

          {isEditing && (
            <label className="toggle-field">
              <input
                type="checkbox"
                checked={replaceGallery}
                onChange={(event) => setReplaceGallery(event.target.checked)}
              />
              <span>Zamijeni postojece slike novim izborom</span>
            </label>
          )}

          <div className="field-full">
            <FileUploadField
              label={isEditing ? "Dodaj nove slike staze" : "Slike staze"}
              accept="image/*"
              multiple
              files={images}
              buttonLabel="Izaberi slike"
              placeholder={
                isEditing
                  ? "Dodaj nove slike, ili ostavi prazno da zadrzis postojecu galeriju."
                  : "Dodaj naslovne i pratece slike staze."
              }
              onChange={(event) => setImages(Array.from(event.target.files || []))}
            />
          </div>

          {isEditing && (
            <p className="field-hint field-full">
              Ako ne izaberes nove slike, ostace trenutna galerija. Ako ukljucis
              zamjenu galerije i sacuvas bez novih slika, postojeca galerija ce
              biti uklonjena.
            </p>
          )}

          <div className="field-full panel">
            <TrailRouteMap
              value={routeMap}
              onChange={setRouteMap}
              editable
              title="Skica rute na mapi Crne Gore"
              description="Uvecaj mapu po potrebi, pa misem ili prstom iscrtaj kako staza ide."
              helperText="Ovo je opciono, ali korisnicima mnogo znaci da vide otprilike kuda ide staza. Zelena tacka je pocetak, narandzasta kraj."
              emptyMessage="Jos nema nacrtane putanje. Ako hoces, iscrtaj rutu prije cuvanja staze."
            />
          </div>

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

          <div className="admin-form-actions field-full">
            <button type="submit" className="primary-button" disabled={submitting}>
              {submitting
                ? "Cuvanje..."
                : isEditing
                  ? "Sacuvaj izmjene"
                  : "Sacuvaj stazu"}
            </button>

            {isEditing && (
              <button
                type="button"
                className="secondary-button"
                onClick={() => navigate("/trails")}
              >
                Otkazi
              </button>
            )}
          </div>
        </form>
      </section>
    </div>
  );
}
