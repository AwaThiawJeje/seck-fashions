import { useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { extraireMessageErreur } from "../lib/crud";
import { TextField } from "../components/crud/fields";

export default function InscriptionPage() {
    const { user, loading, register } = useAuth();
    const location = useLocation();
    const retour = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? "/";

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [telephone, setTelephone] = useState("");
    const [password, setPassword] = useState("");
    const [confirmation, setConfirmation] = useState("");
    const [envoiEnCours, setEnvoiEnCours] = useState(false);
    const [erreur, setErreur] = useState<string | null>(null);

    if (!loading && user) {
        return <Navigate to={user.role === "admin" ? "/admin" : retour} replace />;
    }

    const soumettre = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmation) {
            setErreur("Les deux mots de passe ne correspondent pas.");
            return;
        }

        setEnvoiEnCours(true);
        setErreur(null);

        try {
            await register({ name, email, telephone, password, password_confirmation: confirmation });
        } catch (err) {
            setErreur(extraireMessageErreur(err));
        } finally {
            setEnvoiEnCours(false);
        }
    };

    return (
        <div className="mx-auto max-w-sm px-4 py-10">
            <form onSubmit={soumettre} className="rounded-md border border-neutral-200 bg-white p-6">
                <h1 className="mb-1 text-lg font-bold uppercase tracking-wide">Créer un compte</h1>
                <p className="mb-4 text-xs text-neutral-500">
                    Retrouve ton panier et tes favoris sur tous tes appareils, et suis tes commandes.
                </p>

                {erreur && (
                    <p className="mb-4 rounded-sm bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">{erreur}</p>
                )}

                <TextField label="Nom" value={name} onChange={setName} required />
                <TextField label="E-mail" type="email" value={email} onChange={setEmail} required />
                <TextField label="Téléphone" type="tel" value={telephone} onChange={setTelephone} required />
                <TextField
                    label="Mot de passe"
                    type="password"
                    value={password}
                    onChange={setPassword}
                    required
                    helperText="Au moins 8 caractères."
                />
                <TextField
                    label="Confirmer le mot de passe"
                    type="password"
                    value={confirmation}
                    onChange={setConfirmation}
                    required
                />

                <button
                    type="submit"
                    disabled={envoiEnCours}
                    className="mt-2 w-full rounded-sm bg-black py-2.5 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300"
                >
                    {envoiEnCours ? "Création..." : "Créer mon compte"}
                </button>

                <p className="mt-4 text-center text-xs text-neutral-500">
                    Déjà un compte ?{" "}
                    <Link to="/connexion" state={location.state} className="font-semibold text-black underline">
                        Se connecter
                    </Link>
                </p>
            </form>
        </div>
    );
}