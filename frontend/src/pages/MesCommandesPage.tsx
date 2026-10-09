import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useListePaginee } from "../hooks/useListePaginee";
import BoutonVoirPlus from "../components/BoutonVoirPlus";
import Modal from "../components/Modal";
import Etoiles from "../components/Etoiles";
import { api } from "../lib/api";
import { extraireMessageErreur } from "../lib/crud";
import type { Avis, Commande, StatutCommande } from "../types/api";

const STATUTS: Record<StatutCommande, { label: string; classe: string }> = {
    en_attente: { label: "En attente de confirmation", classe: "bg-orange-100 text-orange-700" },
    confirmee: { label: "Confirmée", classe: "bg-blue-100 text-blue-700" },
    expediee: { label: "En livraison", classe: "bg-purple-100 text-purple-700" },
    livree: { label: "Livrée", classe: "bg-green-100 text-green-700" },
    annulee: { label: "Annulée", classe: "bg-neutral-200 text-neutral-600" },
};

function formatPrice(value: string) {
    return `${Number(value).toLocaleString("fr-FR")} FCFA`;
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

// Défini hors du composant : l'adresse reste la même d'un affichage à l'autre.
const construireUrl = (page: number) => `/api/mes-commandes?page=${page}`;

export default function MesCommandesPage() {
    const { elements: commandes, loading, error, aPlusDeResultats, voirPlus, chargementSuite, erreurSuite } =
        useListePaginee<Commande>(construireUrl);

    const [mesAvis, setMesAvis] = useState<Record<number, Avis>>({});
    const [produitEnAvis, setProduitEnAvis] = useState<{ id: number; nom: string } | null>(null);

    const rechargerMesAvis = () => {
        api<Avis[]>("/api/mes-avis")
            .then((liste) => setMesAvis(Object.fromEntries(liste.map((a) => [a.produit_id, a]))))
            .catch(() => setMesAvis({}));
    };

    useEffect(() => {
        rechargerMesAvis();
    }, []);

    return (
        <div className="mx-auto max-w-2xl px-4 py-6">
            <h1 className="mb-4 text-lg font-bold uppercase tracking-wide">Mes commandes</h1>

            {loading ? (
                <p className="py-10 text-center text-sm text-neutral-500">Chargement...</p>
            ) : error ? (
                <p className="py-10 text-center text-sm text-red-600">{error}</p>
            ) : commandes.length === 0 ? (
                <div className="py-16 text-center">
                    <p className="mb-3 text-sm text-neutral-500">Tu n'as pas encore passé de commande.</p>
                    <Link to="/" className="text-sm font-semibold text-black underline">
                        Découvrir le catalogue
                    </Link>
                </div>
            ) : (
                <>
                    <div className="flex flex-col gap-3">
                        {commandes.map((commande) => {
                            const statut = STATUTS[commande.statut];
                            return (
                                <div key={commande.id} className="rounded-md border border-neutral-200 p-4">
                                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                                        <div>
                                            <span className="text-sm font-bold text-black">Commande N° {commande.numero}</span>
                                            <span className="ml-2 text-xs text-neutral-400">
                                                {formatDate(commande.created_at)}
                                            </span>
                                        </div>
                                        <span
                                            className={`rounded-sm px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${statut.classe}`}
                                        >
                                            {statut.label}
                                        </span>
                                    </div>

                                    <div className="mb-2 flex flex-col gap-1">
                                        {commande.lignes?.map((ligne) => {
                                            const monAvis = ligne.produit_id ? mesAvis[ligne.produit_id] : undefined;
                                            return (
                                                <div key={ligne.id} className="flex flex-col gap-1 border-b border-neutral-50 py-1 last:border-0">
                                                    <div className="flex items-center justify-between gap-2 text-sm">
                                                        <span className="min-w-0 flex-1 text-neutral-700">
                                                            {ligne.nom_produit} × {ligne.quantite}
                                                        </span>
                                                        <span className="shrink-0 text-neutral-500">
                                                            {formatPrice(ligne.sous_total)}
                                                        </span>
                                                    </div>
                                                    {commande.statut === "livree" && ligne.produit_id && (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setProduitEnAvis({ id: ligne.produit_id!, nom: ligne.nom_produit })
                                                            }
                                                            className="self-start text-xs font-semibold text-black underline hover:text-neutral-600"
                                                        >
                                                            {monAvis ? "Modifier mon avis" : "Laisser un avis"}
                                                        </button>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div className="flex items-center justify-between border-t border-neutral-100 pt-2 text-sm font-bold">
                                        <span>Total</span>
                                        <span>{formatPrice(commande.total)}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <BoutonVoirPlus
                        visible={aPlusDeResultats}
                        chargement={chargementSuite}
                        erreur={erreurSuite}
                        onClick={voirPlus}
                    />
                </>
            )}

            {produitEnAvis && (
                <FormulaireAvis
                    produit={produitEnAvis}
                    avisExistant={mesAvis[produitEnAvis.id]}
                    onClose={() => setProduitEnAvis(null)}
                    onSuccess={() => {
                        setProduitEnAvis(null);
                        rechargerMesAvis();
                    }}
                />
            )}
        </div>
    );
}

function FormulaireAvis({
    produit,
    avisExistant,
    onClose,
    onSuccess,
}: {
    produit: { id: number; nom: string };
    avisExistant?: Avis;
    onClose: () => void;
    onSuccess: () => void;
}) {
    const [note, setNote] = useState(avisExistant?.note ?? 5);
    const [commentaire, setCommentaire] = useState(avisExistant?.commentaire ?? "");
    const [envoiEnCours, setEnvoiEnCours] = useState(false);
    const [erreur, setErreur] = useState<string | null>(null);

    const soumettre = async (e: React.FormEvent) => {
        e.preventDefault();
        setEnvoiEnCours(true);
        setErreur(null);

        try {
            await api(`/api/produits/${produit.id}/avis`, {
                method: "POST",
                body: { note, commentaire: commentaire.trim() || null },
            });
            onSuccess();
        } catch (err) {
            setErreur(extraireMessageErreur(err));
        } finally {
            setEnvoiEnCours(false);
        }
    };

    return (
        <Modal open onClose={onClose}>
            <form onSubmit={soumettre} className="flex flex-col gap-3">
                <h2 className="text-sm font-bold uppercase tracking-wide">Avis — {produit.nom}</h2>

                <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-neutral-600">Ta note</span>
                    <Etoiles valeur={note} taille="lg" interactif onChange={setNote} />
                </div>

                <div className="flex flex-col gap-1">
                    <label htmlFor="commentaire-avis" className="text-xs font-semibold text-neutral-600">
                        Ton commentaire (optionnel)
                    </label>
                    <textarea
                        id="commentaire-avis"
                        value={commentaire}
                        onChange={(e) => setCommentaire(e.target.value)}
                        maxLength={1000}
                        rows={4}
                        className="rounded-sm border border-neutral-300 px-2 py-1.5 text-sm"
                        placeholder="Qu'as-tu pensé de ce produit ?"
                    />
                </div>

                <p className="text-xs text-neutral-400">
                    Ton avis sera visible sur le site après validation par l'équipe.
                </p>

                {erreur && <p className="text-xs font-semibold text-red-600">{erreur}</p>}

                <div className="flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-sm border border-neutral-300 px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
                    >
                        Annuler
                    </button>
                    <button
                        type="submit"
                        disabled={envoiEnCours}
                        className="rounded-sm bg-black px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300"
                    >
                        {envoiEnCours ? "Envoi..." : "Publier mon avis"}
                    </button>
                </div>
            </form>
        </Modal>
    );
}