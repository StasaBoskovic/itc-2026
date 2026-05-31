# MonTrails

MonTrails je full-stack aplikacija za predmet Internet tehnologije. Napravljena je sa React + Vite na frontendu i Node.js + Express + PostgreSQL na backendu.

## Sta je uradjeno

- pregled svih staza
- detalji jedne staze
- registracija i prijava korisnika
- admin dodavanje novih staza
- korisnicke ocjene od 1 do 5 zvjezdica
- komentari uz mogucnost dodavanja slika
- lokalni upload slika za galeriju staze i slike komentara

## Struktura

- `client` - React aplikacija
- `server` - Express API i PostgreSQL konekcija

## 1. Kreiranje baze

Prvo u PostgreSQL napravi bazu, na primjer:

```sql
CREATE DATABASE montrails;
```

Zatim importuj tvoj SQL fajl `MonTrail.sql`.

Ako koristis `psql`, primjer komande je:

```bash
psql -U postgres -d montrails -f "C:\putanja\do\MonTrail.sql"
```

Ako koristis pgAdmin:

1. napravi bazu `montrails`
2. otvori Query Tool
3. ucitaj sadrzaj iz `MonTrail.sql`
4. pokreni skriptu

## 2. Server .env

U folderu `server` napravi fajl `.env` na osnovu `server/.env.example`.

Primjer:

```env
PORT=5000
CLIENT_URL=http://localhost:5173
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=tvoja_lozinka
DB_NAME=montrails
DB_SSL=false
JWT_SECRET=neka_duga_tajna_lozinka
```

## 3. Client .env

U folderu `client` napravi fajl `.env` na osnovu `client/.env.example`.

Primjer:

```env
VITE_API_URL=http://localhost:5000/api
VITE_ASSET_URL=http://localhost:5000
```

## 4. Instalacija

U jednom terminalu:

```bash
cd server
npm install
npm run dev
```

U drugom terminalu:

```bash
cd client
npm install
npm run dev
```

Frontend ce biti na `http://localhost:5173`, a backend na `http://localhost:5000`.

## 5. Kako admin nalog radi

Registracija preko forme pravi korisnika sa ulogom `user`.

Da bi neki nalog bio admin, nakon registracije u bazi pokreni:

```sql
UPDATE app_users
SET role_id = (SELECT id FROM roles WHERE role_name = 'admin')
WHERE email = 'tvoj_admin_email@gmail.com';
```

Poslije toga se ponovo prijavi sa tim nalogom i dobices pristup stranici za dodavanje staza.

## 6. Glavni API endpointi

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/meta/difficulties`
- `GET /api/meta/ecological-statuses`
- `GET /api/meta/terrain-types`
- `GET /api/trails`
- `GET /api/trails/:id`
- `POST /api/trails` - admin only
- `POST /api/trails/:id/rating`
- `POST /api/trails/:id/comments`

## Napomena

Slike se cuvaju lokalno u `server/uploads`. Ako budes htio kasnije, mozemo sljedeci korak da uradimo:

- editovanje i brisanje komentara
- editovanje staza
- mapa sa Leaflet ili Google Maps prikazom koordinata
- omiljene staze
- pretraga po gradu, duzini i tezini zajedno
