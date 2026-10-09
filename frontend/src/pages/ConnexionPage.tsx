import { useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../lib/api";
import { TextField } from "../components/crud/fields";

export default function ConnexionPage() {
    const { user, loading, login } = useAuth();
    const location = useLocation();
    const retour = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? "/";

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [envoiEnCours, setEnvoiEnCours] = useState(false);
    const [erreur, setErreur] = useState<string | null>(null);

    // Dès que la connexion aboutit, ou si on est déjà connecté, on quitte cette page.
    if (!loading && user) {
        return <Navigate to={user.role === "admin" ? "/admin" : retour} replace />;
    }

    const soumettre = async (e: React.FormEvent) => {
        e.preventDefault();
        setEnvoiEnCours(true);
        setErreur(null);

        try {
            await login(email, password);
        } catch (err) {
            if (err instanceof ApiError && err.status === 422) {
                const message = err.errors?.email?.[0] ?? "";
                setErreur(
                    /too many|trop/i.test(message)
                        ? "Trop de tentatives. Réessaie dans une minute."
                        : "E-mail ou mot de passe incorrect."
                );
            } else {
                setErreur("Une erreur est survenue, réessaie.");
            }
        } finally {
            setEnvoiEnCours(false);
        }
    };

    return (
        <div className="mx-auto max-w-sm px-4 py-10">
            <form onSubmit={soumettre} className="rounded-md border border-neutral-200 bg-white p-6">
                <h1 className="mb-4 text-lg font-bold uppercase tracking-wide">Connexion</h1>

                {erreur && (
                    <p className="mb-4 rounded-sm bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">{erreur}</p>
                )}

                <TextField label="E-mail" type="email" value={email} onChange={setEmail} required />
                <TextField label="Mot de passe" type="password" value={password} onChange={setPassword} required />

                <button
                    type="submit"
                    disabled={envoiEnCours}
                    className="mt-2 w-full rounded-sm bg-black py-2.5 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300"
                >
                    {envoiEnCours ? "Connexion..." : "Se connecter"}
                </button>

                <p className="mt-4 text-center text-xs text-neutral-500">
                    Pas encore de compte ?{" "}
                    <Link to="/inscription" state={location.state} className="font-semibold text-black underline">
                        Créer un compte
                    </Link>
                </p>
            </form>
        </div>
    );
}