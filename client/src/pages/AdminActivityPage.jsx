import AdminActivityOverview from "../components/AdminActivityOverview";
import BackButton from "../components/BackButton";
import { useAuth } from "../context/AuthContext";

export default function AdminActivityPage() {
  const { token } = useAuth();

  return (
    <div className="page-stack">
      <BackButton />
      <AdminActivityOverview token={token} />
    </div>
  );
}
