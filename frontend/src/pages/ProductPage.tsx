import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useProduit } from "../hooks/useProduit";
import { useFavoris } from "../context/FavorisContext";
import { usePanier } from "../context/PanierContext";
import { useParametres } from "../hooks/useParametres";
import { api, ApiError } from "../lib/api";
import { construireLienWhatsapp, construireMessageCommande } from "../lib/whatsapp";
import type { Commande } from "../types/api";
import whatsappIcon from "../assets/whatsapp-icon.png";

const CRITICAL_STOCK_THRESHOLD = 8;

function formatPrice(value: string) {
    return `${Number(value).toLocaleString("fr-FR")} FCFA`;
}

export default function ProductPage() {
    const { slug = "" } = useParams<{ slug: string }>();
    const { produit, loading, error } = useProduit(slug);
    const { estFavori, toggleFavori } = useFavoris();
    const { ajouterLigne } = usePanier();
    const { parametres } = useParametres();

    const [imgIndex, setImgIndex] = useState(0);
    const [valeurChoisie, setValeurChoisie] = useState<string | null>(null);
    const [quantite, setQuantite] = useState(1);
    const [venantAjoute, setVenantAjoute] = useState(false);
    const [envoiWhatsappEnCours, setEnvoiWhatsappEnCours] = useState(false);
    const [erreurWhatsapp, setErreurWhatsapp] = useState<string | null>(null);

    useEffect(() => {
        setQuantite(1);
    }, [valeurChoisie]);

    useEffect(() => {
        if (!venantAjoute) return;
        const timer = setTimeout(() => setVenantAjoute(false), 1500);
        return () => clearTimeout(timer);
    }, [venantAjoute]);

    if (loading) {
        return <p className="py-16 text-center text-sm text-neutral-500">Chargement...</p>;
    }
    if (error || !produit) {
        return <p className="py-16 text-center text-sm text-red-600">{error ?? "Produit introuvable."}</p>;
    }

    const favori = estFavori(produit.id);
    const imageUrls = produit.images?.map((img) => img.url) ?? [];
    const aDesDeclinaisons = !!produit.declinaisons && produit.declinaisons.length > 0;
    const declinaisonChoisie = produit.declinaisons?.find((d) => d.valeur === valeurChoisie) ?? null;

    const stockPertinent = aDesDeclinaisons
        ? (declinaisonChoisie?.quantite ?? null)
        : produit.quantite;

    const peutCommander =
        produit.disponible &&
        (!aDesDeclinaisons || declinaisonChoisie !== null) &&
        (stockPertinent ?? 0) > 0;

    const messageStock = (() => {
        if (aDesDeclinaisons && !declinaisonChoisie) return null;
        if (stockPertinent === 0) {
            return {
                texte: "Épuisé",
                classe: "inline-block w-fit rounded-sm bg-neutral-300 px-3 py-1 text-white",
            };
        }
        if (stockPertinent !== null && stockPertinent <= CRITICAL_STOCK_THRESHOLD) {
            return { texte: `Plus que ${stockPertinent} en stock`, classe: "text-red-400" };
        }
        return { texte: "Quelques articles restants", classe: "text-orange-400" };
    })();

    const quantiteMax = stockPertinent ?? 1;

    const ajouterAuPanier = () => {
        if (!peutCommander) return;
        ajouterLigne(produit, declinaisonChoisie?.id ?? null, quantite);
        setVenantAjoute(true);
    };

    const commanderCeProduitSurWhatsapp = async () => {
        if (!peutCommander || envoiWhatsappEnCours) return;

        if (!parametres?.whatsapp_numero) {
            setErreurWhatsapp("Le numéro WhatsApp n'est pas disponible pour le moment, réessaie plus tard.");
            return;
        }

        setEnvoiWhatsappEnCours(true);
        setErreurWhatsapp(null);

        try {
            const commande = await api<Commande>("/api/commandes", {
                method: "POST",
                body: {
                    methode_paiement: "paiement_livraison",
                    articles: [
                        {
                            produit_id: produit.id,
                            declinaison_id: declinaisonChoisie?.id ?? null,
                            quantite,
                        },
                    ],
                },
            });

            const message = construireMessageCommande(commande);
            window.open(construireLienWhatsapp(parametres.whatsapp_numero, message), "_blank");
        } catch (err) {
            setErreurWhatsapp(err instanceof ApiError ? err.message : "Une erreur est survenue, réessaie.");
        } finally {
            setEnvoiWhatsappEnCours(false);
        }
    };

    return (
        <div className="mx-auto max-w-6xl px-4 py-6">
            <nav className="mb-4 flex flex-wrap items-center gap-1 text-xs text-neutral-500">
                <Link to="/" className="hover:text-black hover:underline">Accueil</Link>
                {produit.categorie?.parente && (
                    <>
                        <span>/</span>
                        <Link to={`/categories/${produit.categorie.parente.slug}`} className="hover:text-black hover:underline">
                            {produit.categorie.parente.nom}
                        </Link>
                    </>
                )}
                {produit.categorie && (
                    <>
                        <span>/</span>
                        <Link to={`/categories/${produit.categorie.slug}`} className="hover:text-black hover:underline">
                            {produit.categorie.nom}
                        </Link>
                    </>
                )}
                <span>/</span>
                <span className="text-neutral-800">{produit.nom}</span>
            </nav>

            <div className="grid gap-8 md:grid-cols-2">
                <div>
                    <div className="relative aspect-square w-full overflow-hidden rounded-md border border-neutral-200 bg-neutral-100">
                        {imageUrls.length > 0 ? (
                            <img
                                src={imageUrls[imgIndex]}
                                alt={produit.nom}
                                className={`h-full w-full object-cover ${!produit.disponible ? "grayscale" : ""}`}
                            />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center">
                                <ImagePlaceholderIcon />
                            </div>
                        )}

                        {produit.en_promotion && (
                            <span className="absolute left-2 top-2 rounded bg-orange-100 px-2 py-1 text-[10px] font-bold text-orange-600">
                                -{produit.pourcentage_reduction}%
                            </span>
                        )}
                    </div>

                    {imageUrls.length > 1 && (
                        <div className="mt-2 flex gap-2 overflow-x-auto">
                            {imageUrls.map((url, i) => (
                                <button
                                    key={url}
                                    type="button"
                                    onClick={() => setImgIndex(i)}
                                    className={`h-16 w-16 shrink-0 overflow-hidden rounded-sm border-2 ${
                                        i === imgIndex ? "border-black" : "border-transparent"
                                    }`}
                                >
                                    <img src={url} alt="" className="h-full w-full object-cover" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-4">
                    <h1 className="text-xl font-bold uppercase tracking-wide">{produit.nom}</h1>

                    <div className="flex flex-wrap items-baseline gap-2">
                        {produit.en_promotion ? (
                            <>
                                <span className="text-2xl font-bold text-black">{formatPrice(produit.prix_promo!)}</span>
                                <span className="text-sm text-neutral-400 line-through">{formatPrice(produit.prix)}</span>
                                <span className="rounded bg-orange-100 px-1.5 py-0.5 text-xs font-bold text-orange-600">
                                    -{produit.pourcentage_reduction}%
                                </span>
                            </>
                        ) : (
                            <span className="text-2xl font-bold text-black">{formatPrice(produit.prix)}</span>
                        )}
                    </div>

                    {messageStock && (
                        <p className={`text-sm font-semibold ${messageStock.classe}`}>{messageStock.texte}</p>
                    )}

                    {aDesDeclinaisons && (
                        <div>
                            <p className="mb-2 text-sm font-semibold text-neutral-800">Taille / Pointure</p>
                            <div className="flex flex-wrap gap-2">
                                {produit.declinaisons!.map((d) => {
                                    const epuise = d.quantite === 0;
                                    const selectionne = d.valeur === valeurChoisie;
                                    return (
                                        <button
                                            key={d.id}
                                            type="button"
                                            disabled={epuise}
                                            onClick={() => setValeurChoisie(d.valeur)}
                                            className={`min-w-11 rounded-sm border px-3 py-2 text-sm font-medium transition-colors ${
                                                epuise
                                                    ? "cursor-not-allowed border-neutral-200 text-neutral-300 line-through"
                                                    : selectionne
                                                        ? "border-black bg-black text-white"
                                                        : "border-neutral-300 text-neutral-800 hover:border-black"
                                            }`}
                                        >
                                            {d.valeur}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <div className="flex items-center gap-3">
                        <p className="text-sm font-semibold text-neutral-800">Quantité</p>
                        <div className="flex items-center rounded-sm border border-neutral-300">
                            <button
                                type="button"
                                onClick={() => setQuantite((q) => Math.max(1, q - 1))}
                                disabled={quantite <= 1}
                                className="px-3 py-1 text-lg text-black transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:text-neutral-300 disabled:hover:bg-transparent"
                            >
                                −
                            </button>
                            <span className="w-8 text-center text-sm">{quantite}</span>
                            <button
                                type="button"
                                onClick={() => setQuantite((q) => Math.min(quantiteMax, q + 1))}
                                disabled={quantite >= quantiteMax}
                                className="px-3 py-1 text-lg text-black transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:text-neutral-300 disabled:hover:bg-transparent"
                            >
                                +
                            </button>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={ajouterAuPanier}
                            disabled={!peutCommander}
                            className={`flex flex-1 items-center justify-center gap-2 rounded-sm py-3 text-sm font-bold uppercase tracking-wide transition-colors disabled:cursor-not-allowed disabled:bg-neutral-300 disabled:text-white ${
                                venantAjoute ? "bg-green-600 text-white" : "bg-black text-white hover:bg-neutral-800"
                            }`}
                        >
                            {venantAjoute ? <CheckIcon /> : <CartIcon />}
                            {!produit.disponible || stockPertinent === 0
                                ? "Indisponible"
                                : aDesDeclinaisons && !declinaisonChoisie
                                    ? "Sélectionnez votre taille"
                                    : venantAjoute
                                        ? "Ajouté au panier"
                                        : "Ajouter au panier"}
                        </button>

                        <button
                            type="button"
                            onClick={commanderCeProduitSurWhatsapp}
                            disabled={!peutCommander || envoiWhatsappEnCours}
                            aria-label="Commander ce produit sur WhatsApp"
                            title="Commander ce produit sur WhatsApp"
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm border border-green-600 text-green-600 transition-colors hover:bg-green-50 disabled:cursor-not-allowed disabled:border-neutral-300 disabled:text-neutral-300"
                        >
                            <img src={whatsappIcon} alt="WhatsApp" className="h-5 w-5" />
                        </button>

                        <button
                            type="button"
                            onClick={() => toggleFavori(produit)}
                            aria-label={favori ? "Retirer des favoris" : "Ajouter aux favoris"}
                            aria-pressed={favori}
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm border border-neutral-300 text-black hover:border-black"
                        >
                            <HeartIcon filled={favori} />
                        </button>
                    </div>

                    {erreurWhatsapp && <p className="text-xs font-semibold text-red-600">{erreurWhatsapp}</p>}

                    {produit.description && (
                        <div className="border-t border-neutral-200 pt-4">
                            <p className="mb-1 text-sm font-semibold text-neutral-800">Description</p>
                            <p className="whitespace-pre-line text-sm text-neutral-600">{produit.description}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function ImagePlaceholderIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
            strokeLinecap="round" strokeLinejoin="round" className="h-14 w-14 text-neutral-300">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="M21 15l-5-5L5 21" />
        </svg>
    );
}

function HeartIcon({ filled }: { filled: boolean }) {
    return (
        <svg viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor"
            strokeWidth="1.8" strokeLinejoin="round" className="h-5 w-5">
            <path d="M12 20s-7.5-4.6-7.5-9.4A4.1 4.1 0 0 1 12 7.8a4.1 4.1 0 0 1 7.5 2.8C19.5 15.4 12 20 12 20Z" />
        </svg>
    );
}

function CartIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
            strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
            <path d="M3 5h2.2l1.6 9.4a1.6 1.6 0 0 0 1.6 1.3h7.9a1.6 1.6 0 0 0 1.6-1.2L19.4 8H6.2" />
            <circle cx="9.5" cy="19.5" r="1.3" />
            <circle cx="16.5" cy="19.5" r="1.3" />
        </svg>
    );
}

function CheckIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
            <path d="M20 6 9 17l-5-5" />
        </svg>
    );
}
