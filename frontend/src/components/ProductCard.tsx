import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Produit } from "../types/api";
import { useFavoris } from "../context/FavorisContext";
import { usePanier } from "../context/PanierContext";
import Modal from "./Modal";

type ProductCardProps = {
    product: Produit;
    href?: string;
    /** Demande confirmation avant de retirer ce produit des favoris (utilisé sur la page Favoris). */
    confirmerRetraitFavori?: boolean;
};

function formatPrice(value: string) {
    return `${Number(value).toLocaleString("fr-FR")} FCFA`;
}

function getStockTotal(product: Produit): number {
    if (product.declinaisons && product.declinaisons.length > 0) {
        return product.declinaisons.reduce((sum, d) => sum + d.quantite, 0);
    }
    return product.quantite;
}

function isOutOfStock(product: Produit): boolean {
    if (!product.disponible) return true;
    return getStockTotal(product) === 0;
}

export default function ProductCard({ product, href = "#", confirmerRetraitFavori = false }: ProductCardProps) {
    const { estFavori, toggleFavori } = useFavoris();
    const { ajouterLigne } = usePanier();
    const navigate = useNavigate();
    const [imgIndex, setImgIndex] = useState(0);
    const isOut = isOutOfStock(product);
    const favori = estFavori(product.id);
    const aDesDeclinaisons = !!product.declinaisons && product.declinaisons.length > 0;
    const [venantAjoute, setVenantAjoute] = useState(false);
    const [confirmationOuverte, setConfirmationOuverte] = useState(false);

    useEffect(() => {
        if (!venantAjoute) return;
        const timer = setTimeout(() => setVenantAjoute(false), 1500);
        return () => clearTimeout(timer);
    }, [venantAjoute]);

    const imageUrls = product.images && product.images.length > 0
        ? product.images.map((img) => img.url)
        : [];
    const hasMultipleImages = imageUrls.length > 1;

    const goTo = (index: number) => {
        const total = imageUrls.length;
        setImgIndex(((index % total) + total) % total);
    };

    const gererAjoutPanier = (e: React.MouseEvent) => {
        e.preventDefault();
        if (isOut) return;

        if (aDesDeclinaisons) {
            navigate(href);
            return;
        }

        ajouterLigne(product, null, 1);
        setVenantAjoute(true);
    };

    return (
        <div className="group relative flex w-full flex-col overflow-hidden rounded-md border border-neutral-200 bg-white transition-colors hover:border-black">
            <a href={href} className="relative block aspect-square w-full overflow-hidden bg-neutral-100">
                {imageUrls.length > 0 ? (
                    <img
                        src={imageUrls[imgIndex]}
                        alt={product.nom}
                        className={`h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 ${
                            isOut ? "grayscale" : ""
                        }`}
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center">
                        <ImagePlaceholderIcon />
                    </div>
                )}

                {hasMultipleImages && (
                    <>
                        <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); goTo(imgIndex - 1); }}
                            aria-label="Photo précédente"
                            className="absolute left-1 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-black opacity-0 transition-opacity hover:bg-white group-hover:opacity-100"
                        >
                            <ChevronIcon direction="left" />
                        </button>
                        <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); goTo(imgIndex + 1); }}
                            aria-label="Photo suivante"
                            className="absolute right-1 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-black opacity-0 transition-opacity hover:bg-white group-hover:opacity-100"
                        >
                            <ChevronIcon direction="right" />
                        </button>

                        <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1">
                            {imageUrls.map((_, i) => (
                                <span
                                    key={i}
                                    className={`h-1.5 w-1.5 rounded-full ${i === imgIndex ? "bg-white" : "bg-white/50"}`}
                                />
                            ))}
                        </div>
                    </>
                )}

                {product.en_promotion && (
                    <div className="absolute left-2 top-2">
                        <span className="rounded bg-orange-100 px-2 py-1 text-[10px] font-bold text-orange-600">
                            -{product.pourcentage_reduction}%
                        </span>
                    </div>
                )}

                {isOut && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                        <span className="rounded-sm bg-black px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
                            Épuisé
                        </span>
                    </div>
                )}

                <button
                    type="button"
                    onClick={(e) => {
                        e.preventDefault();
                        if (favori && confirmerRetraitFavori) {
                            setConfirmationOuverte(true);
                        } else {
                            toggleFavori(product);
                        }
                    }}
                    aria-label={favori ? "Retirer des favoris" : "Ajouter aux favoris"}
                    aria-pressed={favori}
                    className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-sm bg-white/90 text-black shadow-sm transition-colors hover:bg-white"
                >
                    <HeartIcon filled={favori} />
                </button>
            </a>

            <Modal open={confirmationOuverte} onClose={() => setConfirmationOuverte(false)}>
                <p className="mb-4 text-sm text-neutral-800">
                    Retirer <span className="font-semibold">{product.nom}</span> de tes favoris ?
                </p>
                <div className="flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={() => {
                            toggleFavori(product);
                            setConfirmationOuverte(false);
                        }}
                        className="rounded-sm border border-black bg-white px-3 py-1.5 text-xs font-semibold text-black transition-colors hover:bg-neutral-50"
                    >
                        Retirer
                    </button>
                    <button
                        type="button"
                        onClick={() => setConfirmationOuverte(false)}
                        className="rounded-sm border border-orange-300 bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-700 transition-colors hover:bg-orange-100"
                    >
                        Annuler
                    </button>
                </div>
            </Modal>

            <div className="flex flex-1 flex-col gap-1.5 p-3">
                <a href={href} className="line-clamp-2 text-xs font-semibold uppercase tracking-wide text-neutral-800 hover:underline">
                    {product.nom}
                </a>

                <div className="flex items-baseline gap-2">
                    {product.en_promotion ? (
                        <>
                            <span className="text-base font-bold text-black">{formatPrice(product.prix_promo!)}</span>
                            <span className="text-xs text-neutral-400 line-through">{formatPrice(product.prix)}</span>
                        </>
                    ) : (
                        <span className="text-base font-bold text-black">{formatPrice(product.prix)}</span>
                    )}
                </div>

                <button
                    type="button"
                    onClick={gererAjoutPanier}
                    disabled={isOut}
                    className={`mt-1.5 flex items-center justify-center gap-1.5 rounded-sm py-2 text-xs font-bold uppercase tracking-wide transition-colors disabled:cursor-not-allowed disabled:bg-neutral-300 disabled:text-white ${
                        venantAjoute ? "bg-green-600 text-white" : "bg-black text-white hover:bg-neutral-800"
                    }`}
                >
                    {venantAjoute ? <CheckIcon /> : <CartIcon />}
                    {isOut ? "Indisponible" : venantAjoute ? "Ajouté" : aDesDeclinaisons ? "Choisir une taille" : "Ajouter au panier"}
                </button>
            </div>
        </div>
    );
}

function ImagePlaceholderIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
            strokeLinecap="round" strokeLinejoin="round" className="h-10 w-10 text-neutral-300">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="M21 15l-5-5L5 21" />
        </svg>
    );
}

function HeartIcon({ filled }: { filled: boolean }) {
    return (
        <svg viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor"
            strokeWidth="1.8" strokeLinejoin="round" className="h-4 w-4">
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

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
            strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
            <path d={direction === "left" ? "M15 18l-6-6 6-6" : "M9 6l6 6-6 6"} />
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