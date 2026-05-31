export default function StarRating({
  value,
  onChange,
  readOnly = false,
  size = "medium",
}) {
  return (
    <div className={`star-rating star-rating-${size}`}>
      {[1, 2, 3, 4, 5].map((star) => {
        const active = star <= value;

        if (readOnly) {
          return (
            <span
              key={star}
              className={active ? "star active-star" : "star"}
              aria-hidden="true"
            >
              ★
            </span>
          );
        }

        return (
          <button
            key={star}
            type="button"
            className={active ? "star-button active-star" : "star-button"}
            onClick={() => onChange(star)}
            aria-label={`Ocijeni sa ${star} zvjezdica`}
          >
            ★
          </button>
        );
      })}
    </div>
  );
}

