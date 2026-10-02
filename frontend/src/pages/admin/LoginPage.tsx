import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ApiError } from "../../lib/api";

export default function LoginPage() {
    const { user, loading, login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [envoiEnCours, setEnvoiEnCours] = useState(false);
    const [erreur, setErreur] = useState<string | null>(null);

    const destination = (location.state as { from?: { pathname: string } })?.from?.pathname ?? "/admin";

    if (!loading && user?.role === "admin") {
        return <Navigate to={destination} replace />;
    }

    const soumettre = async (e: React.FormEvent) => {
        e.preventDefault();
        setEnvoiEnCours(true);
        setErreur(null);

        try {
            const utilisateur = await login(email, password);
            if (utilisateur.role !== "admin") {
                setErreur("Ce compte n'a pas accès à l'administration.");
                return;
            }
            navigate(destination, { replace: true });
        } catch (err) {
            setErreur(
                err instanceof ApiError && err.status === 422
                    ? "Identifiants incorrects."
                    : "Une erreur est survenue, réessaie."
            );
        } finally {
            setEnvoiEnCours(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
            <form onSubmit={soumettre} className="w-full max-w-sm rounded-md border border-neutral-200 bg-white p-6">
                <h1 className="mb-1 text-lg font-bold uppercase tracking-wide">Administration</h1>
                <p className="mb-5 text-sm text-neutral-500">SECK FASHIONS</p>

                {erreur && (
                    <p className="mb-4 rounded-sm bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">{erreur}</p>
                )}

                <label className="mb-3 block">
                    <span className="mb-1 block text-xs font-semibold text-neutral-700">E-mail</span>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full rounded-sm border border-neutral-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
                    />
                </label>

                <label className="mb-5 block">
                    <span className="mb-1 block text-xs font-semibold text-neutral-700">Mot de passe</span>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full rounded-sm border border-neutral-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
                    />
                </label>

                <button
                    type="submit"
                    disabled={envoiEnCours}
                    className="w-full rounded-sm bg-black py-2.5 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300"
                >
                    {envoiEnCours ? "Connexion..." : "Se connecter"}
                </button>
            </form>
        </div>
    );
}