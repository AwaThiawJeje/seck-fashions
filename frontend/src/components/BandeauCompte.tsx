import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function BandeauCompte({ texte }: { texte: string }) {
    const { user, loading } = useAuth();
    if (loading || user) return null;

    return (
        <p className="mb-4 rounded-md bg-neutral-50 px-3 py-2 text-xs text-neutral-600">
            {texte}{" "}
            <Link to="/connexion" className="font-semibold text-black underline">
                Se connecter
            </Link>
            {" ou "}
            <Link to="/inscription" className="font-semibold text-black underline">
                créer un compte
            </Link>
        </p>
    );
}