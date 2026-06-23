export function formatReviewCount(value) {
  const count = Number(value || 0);
  const lastDigit = count % 10;
  const lastTwoDigits = count % 100;

  if (count === 1) {
    return "1 recenzija";
  }

  if (
    lastDigit >= 2 &&
    lastDigit <= 4 &&
    (lastTwoDigits < 12 || lastTwoDigits > 14)
  ) {
    return `${count} recenzije`;
  }

  return `${count} recenzija`;
}
