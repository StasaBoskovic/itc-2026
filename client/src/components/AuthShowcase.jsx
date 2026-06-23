import logo from "../assets/montrails-logo.svg";

const valuePoints = [
  {
    title: "Sve staze na jednom mjestu",
    description:
      "Pregledaj pjesacke i planinarske staze iz svih krajeva Crne Gore bez lutanja kroz vise sajtova.",
  },
  {
    title: "Utisci stvarnih korisnika",
    description:
      "Ocjene, komentari i fotografije dolaze od obicnih korisnika koji su zaista prosli tim rutama.",
  },
  {
    title: "Inspiracija za novu turu",
    description:
      "Sacuvaj ideje za vikend avanturu i brzo pronadji stazu koja odgovara tvom tempu i iskustvu.",
  },
];

export default function AuthShowcase({ title, description }) {
  return (
    <aside className="auth-showcase">
      <div className="auth-showcase-top">
        <img src={logo} alt="MonTrails logo" className="auth-showcase-logo" />

        <div className="auth-showcase-copy">
          <span className="eyebrow">MonTrails Montenegro</span>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </div>

      <div className="auth-atmosphere-card">
        <span className="auth-atmosphere-label">Priroda. Staze. Utisci.</span>
        <p>
          Digitalni prostor za otkrivanje staza, dijeljenje fotografija i
          planiranje narednog izlaska u prirodu.
        </p>
      </div>

      <div className="auth-postcard">
        <div className="auth-postcard-glow" />
        <div className="auth-postcard-ridge auth-postcard-ridge-back" />
        <div className="auth-postcard-ridge auth-postcard-ridge-front" />
        <div className="auth-postcard-forest" />
        <div className="auth-postcard-trail" />
      </div>

      <div className="auth-value-list">
        {valuePoints.map((point, index) => (
          <div key={point.title} className="auth-value-item">
            <span className="auth-value-badge">0{index + 1}</span>
            <div className="auth-value-copy">
              <h3>{point.title}</h3>
              <p>{point.description}</p>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
