import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function RequireAdmin() {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return <p className="py-16 text-center text-sm text-neutral-500">Chargement...</p>;
    }

    if (!user || user.role !== "admin") {
        return <Navigate to="/admin/connexion" state={{ from: location }} replace />;
    }

    return <Outlet />;
}