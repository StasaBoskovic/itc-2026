import { resolveAssetUrl } from "../api";
import { getUserDisplayName, getUserInitials } from "../utils/user";

export default function Avatar({ user, size = "medium", className = "" }) {
  const imageUrl = user?.profile_image_url
    ? resolveAssetUrl(user.profile_image_url)
    : null;
  const classes = `avatar avatar-${size} ${className}`.trim();

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={getUserDisplayName(user)}
        className={classes}
      />
    );
  }

  return <span className={`${classes} avatar-fallback`}>{getUserInitials(user)}</span>;
}

