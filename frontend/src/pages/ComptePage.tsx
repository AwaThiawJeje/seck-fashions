import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { extraireMessageErreur } from "../lib/crud";
import ConfirmDeleteModal from "../components/crud/ConfirmDeleteModal";
import { TextField } from "../components/crud/fields";
import type { User } from "../types/api";

export default function ComptePage() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [confirmationOuverte, setConfirmationOuverte] = useState(false);
    const [deconnexionEnCours, setDeconnexionEnCours] = useState(false);

    if (!user) return null; // RequireUser garantit qu'on est connecté

    const deconnecter = async () => {
        setDeconnexionEnCours(true);
        try {
            navigate("/", { replace: true }); // d'abord quitter la page, sinon on atterrirait sur la connexion
            await logout();
        } finally {
            setDeconnexionEnCours(false);
        }
    };

    return (
        <div className="mx-auto max-w-lg px-4 py-6">
            <h1 className="mb-1 text-lg font-bold uppercase tracking-wide">Mon compte</h1>
            <p className="mb-4 text-sm text-neutral-500">{user.email}</p>

            <div className="mb-6 flex flex-wrap gap-2">
                <Link
                    to="/mes-commandes"
                    className="rounded-sm bg-black px-4 py-2 text-xs font-bold uppercase tracking-wide text-white hover:bg-neutral-800"
                >
                    Mes commandes
                </Link>
                {user.role === "admin" && (
                    <Link
                        to="/admin"
                        className="rounded-sm border border-black px-4 py-2 text-xs font-bold uppercase tracking-wide text-black hover:bg-neutral-50"
                    >
                        Administration
                    </Link>
                )}
            </div>

            <FormulaireInfos user={user} />
            <FormulaireMotDePasse />

            <button
                type="button"
                onClick={() => setConfirmationOuverte(true)}
                className="text-xs font-semibold text-neutral-500 hover:text-black hover:underline"
            >
                Se déconnecter
            </button>

            <ConfirmDeleteModal
                open={confirmationOuverte}
                onClose={() => setConfirmationOuverte(false)}
                onConfirm={deconnecter}
                envoiEnCours={deconnexionEnCours}
                erreur={null}
                libelleConfirm="Se déconnecter"
                libelleConfirmEnCours="Déconnexion..."
                message="Tu vas être déconnecté. Ton panier et tes favoris restent enregistrés sur ton compte."
            />
        </div>
    );
}

function useNotice() {
    const [notice, setNotice] = useState<string | null>(null);

    useEffect(() => {
        if (!notice) return;
        const timer = setTimeout(() => setNotice(null), 3500);
        return () => clearTimeout(timer);
    }, [notice]);

    return [notice, setNotice] as const;
}

function FormulaireInfos({ user }: { user: User }) {
    const { setUser } = useAuth();
    const [name, setName] = useState(user.name);
    const [telephone, setTelephone] = useState(user.telephone ?? "");
    const [envoiEnCours, setEnvoiEnCours] = useState(false);
    const [erreur, setErreur] = useState<string | null>(null);
    const [notice, setNotice] = useNotice();

    const enregistrer = async (e: React.FormEvent) => {
        e.preventDefault();
        setEnvoiEnCours(true);
        setErreur(null);

        try {
            const misAJour = await api<User>("/api/profil", {
                method: "PATCH",
                body: { name, telephone: telephone || null },
            });
            setUser(misAJour);
            setNotice("Informations enregistrées.");
        } catch (err) {
            setErreur(extraireMessageErreur(err));
        } finally {
            setEnvoiEnCours(false);
        }
    };

    return (
        <form onSubmit={enregistrer} className="mb-4 rounded-md border border-neutral-200 p-4">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide">Mes informations</h2>

            {erreur && (
                <p className="mb-3 rounded-sm bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">{erreur}</p>
            )}
            {notice && (
                <p className="mb-3 rounded-sm bg-green-50 px-3 py-2 text-xs font-semibold text-green-700">{notice}</p>
            )}

            <TextField label="Nom" value={name} onChange={setName} required />
            <TextField label="Téléphone" type="tel" value={telephone} onChange={setTelephone} required />

            <button
                type="submit"
                disabled={envoiEnCours}
                className="rounded-sm bg-black px-4 py-2 text-xs font-bold uppercase tracking-wide text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300"
            >
                {envoiEnCours ? "Enregistrement..." : "Enregistrer"}
            </button>
        </form>
    );
}

function FormulaireMotDePasse() {
    const [actuel, setActuel] = useState("");
    const [nouveau, setNouveau] = useState("");
    const [confirmation, setConfirmation] = useState("");
    const [envoiEnCours, setEnvoiEnCours] = useState(false);
    const [erreur, setErreur] = useState<string | null>(null);
    const [notice, setNotice] = useNotice();

    const modifier = async (e: React.FormEvent) => {
        e.preventDefault();
        setEnvoiEnCours(true);
        setErreur(null);

        try {
            await api("/api/mot-de-passe", {
                method: "PUT",
                body: { mot_de_passe_actuel: actuel, password: nouveau, password_confirmation: confirmation },
            });
            setActuel("");
            setNouveau("");
            setConfirmation("");
            setNotice("Mot de passe modifié.");
        } catch (err) {
            setErreur(extraireMessageErreur(err));
        } finally {
            setEnvoiEnCours(false);
        }
    };

    return (
        <form onSubmit={modifier} className="mb-6 rounded-md border border-neutral-200 p-4">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide">Changer le mot de passe</h2>

            {erreur && (
                <p className="mb-3 rounded-sm bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">{erreur}</p>
            )}
            {notice && (
                <p className="mb-3 rounded-sm bg-green-50 px-3 py-2 text-xs font-semibold text-green-700">{notice}</p>
            )}

            <TextField label="Mot de passe actuel" type="password" value={actuel} onChange={setActuel} required />
            <TextField
                label="Nouveau mot de passe"
                type="password"
                value={nouveau}
                onChange={setNouveau}
                required
                helperText="Au moins 8 caractères."
            />
            <TextField
                label="Confirmer le nouveau mot de passe"
                type="password"
                value={confirmation}
                onChange={setConfirmation}
                required
            />

            <button
                type="submit"
                disabled={envoiEnCours}
                className="rounded-sm bg-black px-4 py-2 text-xs font-bold uppercase tracking-wide text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300"
            >
                {envoiEnCours ? "Modification..." : "Modifier le mot de passe"}
            </button>
        </form>
    );
}