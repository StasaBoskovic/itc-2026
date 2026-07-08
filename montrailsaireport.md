# AI REPORT - MonTrails

Q: Zdravo, treba mi pomoc oko projekta. Pravim web aplikaciju za planinarske i pjesacke staze koja se zove MonTrails. Treba da ima registraciju, prijavu, pregled svih staza, detalje jedne staze, ocjene, komentare sa slikama, omiljene staze i admin panel za dodavanje novih staza. Sta mi preporucujes da koristim?
A: Za MonTrails je odlican izbor PERN stack, jer ti tacno odgovara onome sto aplikacija radi:
- PostgreSQL za bazu
- Express za REST API
- React za frontend
- Node.js za runtime
- Multer za upload slika
- JWT za autentifikaciju
A: Razlog je sto ti cijela aplikacija ostaje u JavaScript ekosistemu, lako spajas frontend i backend, a PostgreSQL je odlican za strukturirane podatke kao sto su korisnici, staze, ocjene, komentari, galerija i omiljene staze.

Q: OK, kako da krenem sa backend-om? Sa cime da napravim server?
A: Za ovaj projekat je Express.js sasvim pravi izbor. U MonTrails backendu je dobro odvojiti Express setup od samog pokretanja servera.
- `server/src/app.js` neka sadrzi middleware i rute
- `server/src/server.js` neka pokrece aplikaciju i provjerava bazu
- rute razdvoji na `authRoutes`, `trailRoutes`, `metaRoutes` i `userRoutes`
A: Ovako ti server ostaje cist, pregledan i lak za odrzavanje. Uz to koristi `nodemon` u development modu da se server automatski restartuje kad mijenjas kod.

Q: Kako da povezem aplikaciju sa PostgreSQL bazom?
A: Koristi paket `pg` i `Pool` objekat, ne pojedinacne konekcije. To je tacno ono sto treba aplikaciji kao sto je MonTrails, gdje vise ruta paralelno cita i upisuje podatke.
A: Dobra praksa je da konekciju drzis u posebnom fajlu kao sto je `server/src/db.js`, a kredencijale u `.env` fajlu:
- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`
A: Kod pokretanja servera je korisno i da odmah uradis provjeru baze, na primjer `SELECT 1`, kao i inicijalizaciju seme preko helper funkcije prije nego sto server pocne da prima zahtjeve.

Q: Kako da uradim registraciju i prijavu korisnika? Bitno mi je da je sigurno.
A: Za MonTrails su ti najbitnija dva paketa:
- `bcryptjs` za hashiranje lozinki
- `jsonwebtoken` za JWT tokene
A: Tok rada treba da bude ovakav:
- korisnik se registruje
- lozinka se hashira prije upisa u bazu
- novi nalog automatski dobija ulogu `user`
- pri prijavi backend provjerava lozinku i vraca JWT token
- frontend taj token salje kroz `Authorization: Bearer ...`
A: Posebno je bitno da registracija nikad ne dozvoli da korisnik sam bira `admin` rolu. U tvojoj aplikaciji admin nalog treba da se dodjeljuje interno, a ne preko javne forme.

Q: Kako da frontend moze da pristupi backend-u i uploadovanim slikama kad su na razlicitim portovima?
A: Tu su ti bitne dvije stvari:
- `cors` da frontend sa porta 5173 moze legalno da gadja backend na 5000
- `express.static` da slike iz `server/uploads` budu dostupne kroz `/uploads`
A: Na frontendu drzi:
- `VITE_API_URL` za API pozive
- `VITE_ASSET_URL` za slike
A: To je dobro rjesenje jer API i fajlovi nijesu ista stvar. API ide na `/api`, a slike se otvaraju preko pune asset adrese.

Q: Sad frontend. Sta da koristim za UI i navigaciju?
A: React sa Vite-om i `react-router-dom` je idealan za MonTrails. Vite ti daje brz development, a router ti omogucava jasne stranice:
- `/login`
- `/register`
- `/trails`
- `/trails/:id`
- `/admin`
- `/profile`
A: Dodatni plus je sto mozes lako da napravis `ProtectedRoute` i `PublicOnlyRoute`, pa da neprijavljen korisnik ne moze na staze, a prijavljen korisnik ne ostaje na login stranici.

Q: Kako da pozivam backend iz React-a?
A: Koristi `axios` i centralni API helper, na primjer `client/src/api.js`. Tu podesis `baseURL`, helper za `Authorization` header i funkciju koja pretvara relativne putanje slika u pune URL-ove.
A: U MonTrails ti je prakticno da imas helper tipa `authConfig(token)` jer ga onda ponovo koristis za:
- ucitavanje detalja staze
- dodavanje ocjene
- cuvanje komentara
- dodavanje u omiljene
- admin akcije
A: To drzi frontend urednim i smanjuje sansu da zaboravis token na nekom zasticenom zahtjevu.

Q: Kako da stilizujem aplikaciju i da radi i na telefonu?
A: Za MonTrails ne moras uvoditi Tailwind ako ti trenutni pristup vec odgovara. Posto aplikacija vec ima svoj `index.css`, sasvim je legitimno da dizajn vodis kroz klasicni CSS i namjenske komponente.
A: Fokusiraj se na stvari koje su stvarno bitne za ovu aplikaciju:
- pregledne kartice za staze
- dobar raspored detalja staze
- responzivnu galeriju
- `BottomNav` za lakse koriscenje na telefonu
- dovoljno velike CTA dugmice za ocjene, komentare i favorite
A: Drugim rijecima, korisnije ti je da UI bude jasan i mobilan nego da uvodis novi CSS framework samo radi trenda.

Q: Kako da admin forma ne hardkoduje tezine, tipove terena i ekoloske statuse?
A: Najcistije je da to izvuces u sifarnike i posebne meta rute:
- `GET /api/meta/difficulties`
- `GET /api/meta/ecological-statuses`
- `GET /api/meta/terrain-types`
A: Onda admin forma pri ucitavanju moze sa `Promise.all` da povuce sve tri liste i da ih prikaze kroz `select` i `checkbox` kontrole.
A: Prednost je velika: ako kasnije promijenis neku tezinu ili dodas novi tip terena, ne diras frontend kod nego samo podatke u bazi.

Q: Treba mi admin panel za dodavanje i izmjenu staza. Kako to da organizujem?
A: Dobar pristup je jedan `AdminPage` koji zna da radi i create i edit mod:
- `POST /api/trails` za novu stazu
- `PUT /api/trails/:id` za izmjenu postojece
A: Na frontendu koristi `FormData`, jer istovremeno saljes tekstualna polja i slike. U toj formi treba da imas:
- naziv staze
- grad ili regiju
- pocetne i krajnje koordinate
- duzinu, uspon i najvisu tacku
- tezinu i ekoloski status
- opis
- tipove terena
- galeriju slika
- opcioni `route_map_data`
A: Ako radis izmjenu, korisna je i opcija `replace_gallery` da admin kontrolise da li zadrzava staru galeriju ili je u potpunosti mijenja novom.

Q: Kako da cuvam vise tipova terena, vise slika i skicu rute za jednu stazu?
A: Tu imas tri razlicita tipa podataka, i svaki zasluzuje svoj model:
- osnovni podaci idu u tabelu `trails`
- veza staza-tereni ide kroz spojnu tabelu `trail_terrain`
- slike idu u `trail_gallery`
A: Za skicu rute je dobro da koristis JSON polje, npr. `route_map_data`, jer ruta prirodno izgleda kao lista poteza i tacaka, a ne kao klasicna relacijska tabela.
A: Bitno je da backend validira taj JSON prije cuvanja:
- da postoji format koji ocekujes
- da broj poteza nije prevelik
- da broj tacaka nije nenormalan
- da koordinate ostanu u granicama mape
A: Tako sprjecavas da ti neko posalje pokvaren ili prevelik payload i srusi cuvanje staze.

Q: Kako da uradim listu staza sa pretragom i filterima?
A: Na MonTrails pocni sa jednostavnim query parametrima, jer su sasvim dovoljni:
- `search`
- `city`
- `difficultyId`
A: U backendu gradis niz uslova i niz vrijednosti, pa na kraju sastavis parametrizovani SQL upit. Za tekstualnu pretragu koristi `ILIKE` da pretraga bude case-insensitive.
A: Ovakav pristup je dobar jer je:
- siguran od SQL injection napada
- lak za prosirenje
- dovoljno fleksibilan za pretragu po nazivu i gradu

Q: Kako da prikazem detalje jedne staze sa svim povezanim podacima?
A: Najbolje je da `GET /api/trails/:id` vrati jedan obogateni odgovor, a ne da frontend salje pet razlicitih zahtjeva. U tom odgovoru treba da dobijes:
- osnovne podatke o stazi
- prosjecnu ocjenu i broj ocjena
- galeriju slika
- tipove terena
- komentare sa slikama
- `userRating` ako je korisnik vec ocjenjivao
- `is_favorite` ako je staza u omiljenim
A: Backend to moze elegantno da sastavi preko vise upita i `Promise.all`, pa frontend dobija sve sto mu treba za `TrailDetailsPage` u jednom potezu.

Q: Sta ako korisnik vise puta ocijeni istu stazu? Da li pravim dva endpoint-a?
A: Ne moras. Za ocjene ti je idealan `UPSERT` pristup:
- jedan red po kombinaciji `user_id + trail_id`
- `INSERT ... ON CONFLICT ... DO UPDATE`
A: Time korisnik moze da promijeni svoju ocjenu, a ti ne dobijas duplikate. Poslije toga backend samo ponovo izracuna prosjecnu ocjenu staze.
A: Dodatni detalj koji je jako dobar u MonTrails je da prosjek racunas samo iz ocjena korisnika sa ulogom `user`, a ne iz admin naloga.

Q: Kako da sacuvam omiljene staze bez dupliranja?
A: I tu je rjesenje vrlo slicno:
- tabela `favorite_trails`
- jedinstvena kombinacija `user_id + trail_id`
- `INSERT ... ON CONFLICT DO NOTHING`
A: Kad korisnik uklanja stazu iz omiljenih, dovoljan je obican `DELETE`. Na taj nacin imas cist i predvidiv sistem:
- jedan klik dodaje
- drugi klik uklanja
- nema duplih redova

Q: Kako da dozvolim komentare sa slikama, ali samo obicnim korisnicima?
A: Tu ti trebaju dvije stvari:
- role middleware kao `requireStandardUser`
- upload middleware kao `commentImagesUpload`
A: Tok rada moze da bude ovakav:
- korisnik posalje tekst komentara i do 5 slika
- backend prvo provjeri da staza postoji
- u transakciji upise komentar
- zatim upise i redove u `comment_images`
A: Ovaj pristup je bitan jer komentar i slike cine jednu cjelinu. Ako pukne upis slike, ne zelis polovicno sacuvan podatak.

Q: Treba mi i korisnicki profil. Sta ima smisla da cuvam?
A: Za MonTrails je sasvim dovoljno da profil ima:
- `username`
- `first_name`
- `last_name`
- `age`
- `bio`
- `profile_image_url`
A: Bitno je da dio podataka bude javan kroz `GET /api/users/:id`, a dio izmjenjiv samo za prijavljenog korisnika kroz `PUT /api/users/me`.
A: Dobra praksa je i da opciona tekstualna polja normalizujes, a godine validiras da budu cijeli broj u smislenom rasponu.

Q: Kako da admin vidi sta korisnici rade u aplikaciji?
A: To mozes elegantno da rijesis kroz admin overview modul. U MonTrails vec ima smisla pratiti:
- prijave korisnika
- komentare
- slike uz komentare
- ocjene
- broj aktivnih korisnika
A: Prakticno rjesenje je tabela poput `user_login_activity`, a zatim jedan pregledni endpoint koji vraca:
- zbirne brojeve
- posljednje prijave
- posljednje komentare
- posljednje slike
- posljednje ocjene
A: Tako admin dobija osjecaj da li je aplikacija ziva i kako ljudi stvarno koriste staze.

Q: Kako da obrisem stazu a da ne ostanu komentari, ocjene, veze i slike?
A: Ovo je mjesto gdje je transakcija obavezna. Kad admin brise stazu, backend treba redom da obrise:
- slike komentara vezane za tu stazu
- komentare
- ocjene
- omiljene veze
- veze sa terenima
- galeriju staze
- na kraju samu stazu
A: Sve to treba ici unutar `BEGIN / COMMIT / ROLLBACK`, a tek poslije uspjesnog `COMMIT` treba fizicki brisati fajlove sa diska.
A: Tako izbjegavas dvije lose situacije:
- baza obrisana, fajlovi ostali
- fajlovi obrisani, baza nije uspjela da se ocisti do kraja

Q: Da li je sigurno da u registraciji posaljem `role: "admin"`? Frontend mi to ne dozvoljava, ali...
A: Nije sigurno nikako. Frontend nije sigurnosna granica. Svako moze da zaobidje formu i posalje rucno napravljen HTTP zahtjev.
A: Ispravan backend za MonTrails treba da:
- cita samo polja koja mu zaista trebaju
- ignorise osjetljiva polja iz `req.body`
- pri registraciji uvijek dodijeli rolu `user`
A: Admin nalozi se ne prave preko javne registracije, nego interno: rucnom izmjenom baze, seed skriptom ili kroz posebno zasticenu admin funkcionalnost.

Q: Zasto u kodu provjeravas da li fajl stvarno pripada `/uploads` folderu prije brisanja? Zasto ne mogu samo da pozovem `fs.unlink` nad bilo cim sto stigne?
A: Zato sto bi to otvorilo ozbiljan sigurnosni problem. Ako slijepo vjerujes putanji koja stigne iz baze ili zahtjeva, napadac bi mogao da te navede da obrises fajl van uploads foldera.
A: Ispravan postupak je:
- prihvati samo asset URL koji pocinje sa `/uploads/`
- pretvori ga u apsolutnu putanju preko `path.resolve`
- provjeri da rezultat i dalje ostaje unutar stvarnog `uploadsRoot`
- tek onda uradi brisanje
A: To je zastita od path traversal napada i bas je dobar sigurnosni detalj za aplikaciju koja radi sa lokalnim fajlovima.

Q: Hvala puno! Da rezimiramo - sta sve koristim u MonTrails?
A: Evo finalne liste glavnih alata i paketa za tvoju aplikaciju:
- Backend: `express`, `pg`, `bcryptjs`, `jsonwebtoken`, `cors`, `dotenv`, `multer`, `nodemon`
- Frontend: `react`, `react-dom`, `react-router-dom`, `axios`, `vite`
- Baza i alati: PostgreSQL, pgAdmin, VS Code, Git
A: Arhitektura aplikacije je vrlo logicna:
- korisnici se registruju i prijavljuju
- obicni korisnici pregledaju staze, ocjenjuju ih, komentarisu i cuvaju omiljene
- admin dodaje i uredjuje staze, galeriju i skicu rute
- backend kontrolise role, validaciju, bazu i lokalne uploadove
A: To znaci da je report sada stvarno prilagodjen tvojoj MonTrails aplikaciji, a ne nekom generickom studentskom projektu.
