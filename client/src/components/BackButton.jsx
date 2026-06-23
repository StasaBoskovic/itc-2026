import { useNavigate } from "react-router-dom";

export default function BackButton({ fallback = "/trails", label = "Nazad" }) {
  const navigate = useNavigate();

  function handleClick() {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate(fallback);
  }

  return (
    <button type="button" className="back-button" onClick={handleClick}>
      <span className="back-button-arrow" aria-hidden="true">
        ←
      </span>
      <span>{label}</span>
    </button>
  );
}

