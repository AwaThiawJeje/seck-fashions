import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import CategorySidebar from "../components/CategorySideBar";
import ProductCard from "../components/ProductCard";
import { products } from "../data/products";
import { categories } from "../data/categories";

export default function CategoryPage() {
    const { slug = "" } = useParams<{ slug: string }>();
    const [query, setQuery] = useState("");

    const categoryLabel = categories.find((c) => c.slug === slug)?.label ?? slug;

    // 1. Filtre d'abord par catégorie
    const categoryProducts = useMemo(
        () => products.filter((p) => p.category === slug),
        [slug],
    );

    // 2. Puis recherche uniquement dans ce sous-ensemble — jamais dans tout le catalogue
    const visibleProducts = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return categoryProducts;
        return categoryProducts.filter((p) => p.name.toLowerCase().includes(q));
    }, [categoryProducts, query]);

    return (
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 sm:flex-row">
            <CategorySidebar activeSlug={slug} />

            <div className="flex-1">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <h1 className="text-lg font-bold uppercase tracking-wide">
                        {categoryLabel}
                    </h1>

                    <div className="flex items-center gap-2 rounded-md border border-neutral-300 bg-white pl-3 pr-1 py-1 sm:w-72">
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder={`Rechercher dans ${categoryLabel.toLowerCase()}`}
                            aria-label={`Rechercher dans ${categoryLabel}`}
                            className="w-full bg-transparent text-sm text-black placeholder:text-neutral-500 focus:outline-none"
                        />
                        <SearchIcon className="h-4 w-4 shrink-0 text-neutral-400" />
                    </div>
                </div>

                {visibleProducts.length === 0 ? (
                    <p className="py-10 text-center text-sm text-neutral-500">
                        Aucun article ne correspond à ta recherche dans cette catégorie.
                    </p>
                ) : (
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                        {visibleProducts.map((product) => (
                            <ProductCard
                                key={product.id}
                                product={product}
                                href={`/produit/${product.id}`}
                                onAddToCart={(id) => console.log("Ajouté :", id)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function SearchIcon({ className = "h-5 w-5" }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" className={className}>
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
        </svg>
    );
}