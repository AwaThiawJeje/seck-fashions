import { useState } from "react";
import type { Product } from "../data/products";

type ProductCardProps = {
    product: Product;
    isFavorite?: boolean;
    onToggleFavorite?: (id: string) => void;
    onAddToCart?: (id: string) => void;
    href?: string;
};

const LOW_STOCK_THRESHOLD = 10;
const CRITICAL_STOCK_THRESHOLD = 3;

function formatPrice(value: number) {
    return `${value.toLocaleString("fr-FR")} FCFA`;
}

function getStockStatus(product: Product): "out" | "critical" | "low" | "normal" {
    if (!product.available || product.quantity === 0) return "out";
    if (product.quantity !== undefined) {
        if (product.quantity <= CRITICAL_STOCK_THRESHOLD) return "critical";
        if (product.quantity <= LOW_STOCK_THRESHOLD) return "low";
    }
    return "normal";
}

export default function ProductCard({
    product,
    isFavorite = false,
    onToggleFavorite,
    onAddToCart,
    href = "#",
}: ProductCardProps) {
    const [favorite, setFavorite] = useState(isFavorite);
    const [imgIndex, setImgIndex] = useState(0);
    const status = getStockStatus(product);
    const isOut = status === "out";
    const hasMultipleImages = product.images.length > 1;

    const toggleFavorite = () => {
        setFavorite((v) => !v);
        onToggleFavorite?.(product.id);
    };

    const goTo = (index: number) => {
        const total = product.images.length;
        setImgIndex(((index % total) + total) % total);
    };

    return (
        <div className="group relative flex w-full flex-col overflow-hidden rounded-md border border-neutral-200 bg-white transition-colors hover:border-black">
            {/* Image + carrousel */}
            <a href={href} className="relative block aspect-square w-full overflow-hidden bg-neutral-100">
                <img
                    src={product.images[imgIndex]}
                    alt={product.name}
                    className={`h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 ${
                        isOut ? "grayscale" : ""
                    }`}
                />

                {/* Flèches de navigation — visibles seulement si plusieurs photos */}
                {hasMultipleImages && (
                    <>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                goTo(imgIndex - 1);
                            }}
                            aria-label="Photo précédente"
                            className="absolute left-1 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-black opacity-0 transition-opacity hover:bg-white group-hover:opacity-100"
                        >
                            <ChevronIcon direction="left" />
                        </button>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                goTo(imgIndex + 1);
                            }}
                            aria-label="Photo suivante"
                            className="absolute right-1 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-black opacity-0 transition-opacity hover:bg-white group-hover:opacity-100"
                        >
                            <ChevronIcon direction="right" />
                        </button>

                        {/* Points indicateurs */}
                        <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1">
                            {product.images.map((_, i) => (
                                <span
                                    key={i}
                                    className={`h-1.5 w-1.5 rounded-full ${
                                        i === imgIndex ? "bg-white" : "bg-white/50"
                                    }`}
                                />
                            ))}
                        </div>
                    </>
                )}

                {/* Badge stock */}
                {status === "critical" && (
                    <span className="absolute left-2 top-2 rounded-sm bg-amber-500 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-black">
                        Bientôt en rupture
                    </span>
                )}
                {status === "low" && (
                    <span className="absolute left-2 top-2 rounded-sm bg-neutral-800 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
                        Quelques articles restants
                    </span>
                )}
                {isOut && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                        <span className="rounded-sm bg-black px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
                            Épuisé
                        </span>
                    </div>
                )}

                {/* Favori */}
                <button
                    type="button"
                    onClick={(e) => {
                        e.preventDefault();
                        toggleFavorite();
                    }}
                    aria-label={favorite ? "Retirer des favoris" : "Ajouter aux favoris"}
                    aria-pressed={favorite}
                    className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-sm bg-white/90 text-black shadow-sm transition-colors hover:bg-white"
                >
                    <HeartIcon filled={favorite} />
                </button>
            </a>

            {/* Infos produit */}
            <div className="flex flex-1 flex-col gap-1.5 p-3">
                
                <a    href={href}
                    className="line-clamp-2 text-xs font-semibold uppercase tracking-wide text-neutral-800 hover:underline"
                >
                    {product.name}
                </a>

                <span className="text-base font-bold text-black">
                    {formatPrice(product.price)}
                </span>

                <button
                    type="button"
                    onClick={() => onAddToCart?.(product.id)}
                    disabled={isOut}
                    className="mt-1.5 flex items-center justify-center gap-1.5 rounded-sm bg-black py-2 text-xs font-bold uppercase tracking-wide text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300 disabled:text-neutral-500"
                >
                    <CartIcon />
                    {isOut ? "Indisponible" : "Ajouter au panier"}
                </button>
            </div>
        </div>
    );
}

/* ---------- Icônes ---------- */

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