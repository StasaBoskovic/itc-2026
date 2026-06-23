import { useDeferredValue, useEffect, useState } from "react";

import { api } from "../api";
import TrailCard from "../components/TrailCard";

export default function HomePage() {
  const [trails, setTrails] = useState([]);
  const [difficulties, setDifficulties] = useState([]);
  const [search, setSearch] = useState("");
  const [difficultyId, setDifficultyId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const deferredSearch = useDeferredValue(search);

  useEffect(() => {
    async function loadDifficulties() {
      try {
        const { data } = await api.get("/meta/difficulties");
        setDifficulties(data);
      } catch (_error) {
        setDifficulties([]);
      }
    }

    loadDifficulties();
  }, []);

  useEffect(() => {
    async function loadTrails() {
      setLoading(true);
      setError("");

      try {
        const { data } = await api.get("/trails", {
          params: {
            search: deferredSearch || undefined,
            difficultyId: difficultyId || undefined,
          },
        });
        setTrails(data);
      } catch (_error) {
        setError("Ne mogu da ucitam staze.");
      } finally {
        setLoading(false);
      }
    }

    loadTrails();
  }, [deferredSearch, difficultyId]);

  return (
    <div className="page-stack">
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">MonTrails Montenegro</span>
          <h1>Pronadji zelene horizonte, staze i vrhove Crne Gore.</h1>
          <p>
            Jedno mjesto za pregled staza, tezine, uspona, komentara, slika i
            utisaka planinara iz cijele Crne Gore.
          </p>

          <div className="hero-stat-grid">
            <div className="hero-stat-card">
              <strong>{loading ? "--" : trails.length}</strong>
              <span>staza u prikazu</span>
            </div>
            <div className="hero-stat-card">
              <strong>{difficulties.length}</strong>
              <span>nivoa tezine</span>
            </div>
            <div className="hero-stat-card">
              <strong>1-5</strong>
              <span>zvjezdica utiska</span>
            </div>
          </div>
        </div>

        <div className="hero-panel">
          <span className="eyebrow">Pametna pretraga</span>
          <h2>Nadji stazu po gradu, nazivu i tezini.</h2>
          <label className="field">
            <span>Naziv ili grad</span>
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="npr. Durmitor, Lovcen, Kotor"
            />
          </label>

          <label className="field">
            <span>Tezina</span>
            <select
              value={difficultyId}
              onChange={(event) => setDifficultyId(event.target.value)}
            >
              <option value="">Sve staze</option>
              {difficulties.map((difficulty) => (
                <option key={difficulty.id} value={difficulty.id}>
                  {difficulty.name}
                </option>
              ))}
            </select>
          </label>

          <div className="search-note">
            Idealno za brzo trazenje novih staza prije vikend ture ili kratke
            setnje u prirodi.
          </div>
        </div>
      </section>

      <section className="content-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Aktuelno</span>
            <h2>Staze u bazi</h2>
          </div>
          <p>{trails.length} pronadjenih staza</p>
        </div>

        {loading && <div className="page-state">Ucitavanje staza...</div>}
        {error && <div className="page-state error-state">{error}</div>}

        {!loading && !error && trails.length === 0 && (
          <div className="page-state">
            Trenutno nema staza koje odgovaraju pretrazi.
          </div>
        )}

        <div className="trail-grid">
          {trails.map((trail) => (
            <TrailCard key={trail.id} trail={trail} />
          ))}
        </div>
      </section>
    </div>
  );
}
