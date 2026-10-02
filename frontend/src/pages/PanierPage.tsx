import { useState } from "react";
import { Link } from "react-router-dom";
import { usePanier, type LignePanier } from "../context/PanierContext";
import { useFavoris } from "../context/FavorisContext";
import { useParametres } from "../hooks/useParametres";
import { api, ApiError } from "../lib/api";
import { construireLienWhatsapp, construireMessageCommande } from "../lib/whatsapp";
import Modal from "../components/Modal";
import type { Commande } from "../types/api";
import whatsappIcon from "../assets/whatsapp-icon.png";

function formatPrice(value: number) {
    return `${value.toLocaleString("fr-FR")} FCFA`;
}

export default function PanierPage() {
    const { lignes, loading, total, modifierQuantite, retirerLigne, viderPanier } = usePanier();
    const { parametres, loading: parametresLoading } = useParametres();
    const [envoiEnCours, setEnvoiEnCours] = useState(false);
    const [erreur, setErreur] = useState<string | null>(null);

    const commanderSurWhatsapp = async () => {
        if (envoiEnCours || lignes.length === 0) return;

        if (!parametres?.whatsapp_numero) {
            setErreur("Le numéro WhatsApp n'est pas disponible pour le moment, réessaie plus tard.");
            return;
        }

        setEnvoiEnCours(true);
        setErreur(null);

        try {
            const commande = await api<Commande>("/api/commandes", {
                method: "POST",
                body: {
                    methode_paiement: "paiement_livraison",
                    articles: lignes.map((l) => ({
                        produit_id: l.produitId,
                        declinaison_id: l.declinaisonId,
                        quantite: l.quantite,
                    })),
                },
            });

            const message = construireMessageCommande(commande);
            window.open(construireLienWhatsapp(parametres.whatsapp_numero, message), "_blank");
            viderPanier();
        } catch (err) {
            setErreur(err instanceof ApiError ? err.message : "Une erreur est survenue, réessaie.");
        } finally {
            setEnvoiEnCours(false);
        }
    };

    if (loading) {
        return <p className="py-16 text-center text-sm text-neutral-500">Chargement...</p>;
    }

    if (lignes.length === 0) {
        return (
            <div className="mx-auto max-w-3xl px-4 py-16 text-center">
                <h1 className="mb-3 text-lg font-bold uppercase tracking-wide">Mon panier</h1>
                <p className="mb-4 text-sm text-neutral-500">Ton panier est vide.</p>
                <Link to="/" className="text-sm font-semibold text-black underline">
                    Découvrir le catalogue
                </Link>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-5xl px-4 py-6">
            <h1 className="mb-4 text-lg font-bold uppercase tracking-wide">
                Mon panier ({lignes.length} article{lignes.length > 1 ? "s" : ""})
            </h1>

            <div className="flex flex-col gap-8 md:flex-row">
                <div className="flex flex-1 flex-col gap-3">
                    {lignes.map((ligne) => (
                        <LigneCarte
                            key={`${ligne.produitId}-${ligne.declinaisonId ?? "sans-declinaison"}`}
                            ligne={ligne}
                            onModifierQuantite={(q) => modifierQuantite(ligne.produitId, ligne.declinaisonId, q)}
                            onRetirer={() => retirerLigne(ligne.produitId, ligne.declinaisonId)}
                        />
                    ))}
                </div>

                <div className="h-fit w-full shrink-0 rounded-md border border-neutral-200 p-4 md:w-72">
                    <div className="mb-3 flex items-center justify-between text-sm">
                        <span className="text-neutral-600">Sous-total</span>
                        <span className="font-semibold text-black">{formatPrice(total)}</span>
                    </div>
                    <p className="mb-4 text-xs text-neutral-400">
                        La livraison et le mode de paiement se règlent directement avec nous sur WhatsApp.
                    </p>

                    {erreur && <p className="mb-3 text-xs font-semibold text-red-600">{erreur}</p>}

                    <button
                        type="button"
                        onClick={commanderSurWhatsapp}
                        disabled={envoiEnCours || parametresLoading}
                        className="flex w-full items-center justify-center gap-2 rounded-sm bg-green-600 py-3 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-neutral-300"
                    >
                        <img src={whatsappIcon} alt="WhatsApp" className="h-4 w-4" />
                        {envoiEnCours ? "Envoi en cours..." : "Commander sur WhatsApp"}
                    </button>
                </div>
            </div>
        </div>
    );
}

function LigneCarte({
    ligne,
    onModifierQuantite,
    onRetirer,
}: {
    ligne: LignePanier;
    onModifierQuantite: (quantite: number) => void;
    onRetirer: () => void;
}) {
    const image = ligne.produit.images?.[0]?.url;
    const { estFavori, toggleFavori } = useFavoris();
    const [confirmationOuverte, setConfirmationOuverte] = useState(false);

    const gererMiseEnFavoris = () => {
        if (!estFavori(ligne.produit.id)) {
            toggleFavori(ligne.produit);
        }
        onRetirer();
        setConfirmationOuverte(false);
    };

    const gererRetraitDefinitif = () => {
        onRetirer();
        setConfirmationOuverte(false);
    };

    return (
        <div className="flex gap-3 rounded-md border border-neutral-200 p-3">
            <Link to={`/produit/${ligne.produit.slug}`} className="h-20 w-20 shrink-0 overflow-hidden rounded-sm bg-neutral-100">
                {image && <img src={image} alt={ligne.produit.nom} className="h-full w-full object-cover" />}
            </Link>

            <div className="flex flex-1 flex-col gap-1">
                <Link
                    to={`/produit/${ligne.produit.slug}`}
                    className="line-clamp-2 text-sm font-semibold uppercase tracking-wide text-neutral-800 hover:underline"
                >
                    {ligne.produit.nom}
                </Link>

                {ligne.declinaisonValeur && (
                    <span className="text-xs text-neutral-500">Taille / Pointure : {ligne.declinaisonValeur}</span>
                )}

                <div className="mt-1 flex flex-wrap items-end justify-between gap-2">
                    <div className="flex flex-col items-start gap-1.5">
                        <div className="flex items-center rounded-sm border border-neutral-300">
                            <button
                                type="button"
                                onClick={() => onModifierQuantite(ligne.quantite - 1)}
                                disabled={ligne.quantite <= 1}
                                className="px-2.5 py-1 text-base text-black transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:text-neutral-300 disabled:hover:bg-transparent"
                            >
                                −
                            </button>
                            <span className="w-7 text-center text-sm">{ligne.quantite}</span>
                            <button
                                type="button"
                                onClick={() => onModifierQuantite(ligne.quantite + 1)}
                                disabled={ligne.quantite >= ligne.stockMax}
                                className="px-2.5 py-1 text-base text-black transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:text-neutral-300 disabled:hover:bg-transparent"
                            >
                                +
                            </button>
                        </div>

                        <button
                            type="button"
                            onClick={() => setConfirmationOuverte(true)}
                            aria-label="Retirer cet article"
                            className="flex items-center gap-1 text-red-400 transition-colors hover:text-red-600"
                        >
                            <TrashIcon className="h-4 w-4" />
                        </button>
                    </div>

                    <span className="text-sm font-bold text-black">{formatPrice(ligne.sousTotal)}</span>
                </div>
            </div>

            <Modal open={confirmationOuverte} onClose={() => setConfirmationOuverte(false)}>
                <p className="mb-4 text-sm text-neutral-800">
                    Retirer <span className="font-semibold">{ligne.produit.nom}</span> du panier ?
                </p>
                <div className="flex flex-col gap-2">
                    <button
                        type="button"
                        onClick={gererMiseEnFavoris}
                        className="w-full rounded-sm border border-orange-300 bg-orange-50 px-3 py-2 text-xs font-semibold text-orange-700 transition-colors hover:bg-orange-100"
                    >
                        Mettre en favoris pour plus tard
                    </button>
                    <button
                        type="button"
                        onClick={gererRetraitDefinitif}
                        className="w-full rounded-sm border border-black bg-white px-3 py-2 text-xs font-semibold text-black transition-colors hover:bg-neutral-50"
                    >
                        Retirer définitivement
                    </button>
                    <button
                        type="button"
                        onClick={() => setConfirmationOuverte(false)}
                        className="mt-1 text-xs text-neutral-400 hover:text-neutral-600"
                    >
                        Annuler
                    </button>
                </div>
            </Modal>
        </div>
    );
}

function TrashIcon({ className = "h-5 w-5" }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
            strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M3 6h18" />
            <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6" />
            <path d="M14 11v6" />
        </svg>
    );
}
