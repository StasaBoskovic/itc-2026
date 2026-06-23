import { getUserDisplayName, getUserMetaLine } from "../utils/user";
import Avatar from "./Avatar";

export default function UserProfilePreview({ user }) {
  return (
    <div className="profile-preview-card">
      <div className="profile-preview-head">
        <Avatar user={user} size="small" />

        <div className="profile-preview-copy">
          <strong>{getUserDisplayName(user)}</strong>
          <span>@{user.username}</span>
        </div>
      </div>

      <div className="profile-preview-meta">
        <span>{getUserMetaLine(user)}</span>
        <span>Pogledaj profil i omiljene staze</span>
      </div>

      {user.bio && <p>{user.bio}</p>}
    </div>
  );
}

