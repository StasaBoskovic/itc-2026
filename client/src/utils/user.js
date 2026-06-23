export function getUserDisplayName(user) {
  const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(" ");
  return fullName || user?.username || "Korisnik";
}

export function getUserInitials(user) {
  const source = [user?.first_name, user?.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  if (source) {
    return source
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || "")
      .join("");
  }

  return (user?.username || "K")
    .slice(0, 2)
    .toUpperCase();
}

export function getUserMetaLine(user) {
  if (user?.age) {
    return `${user.age} godina`;
  }

  return "Bez dodatih godina";
}

