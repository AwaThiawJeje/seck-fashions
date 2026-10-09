import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import CategorySidebar from "../components/CategorySideBar";
import ProductCard from "../components/ProductCard";
import BoutonVoirPlus from "../components/BoutonVoirPlus";
import { useProduits } from "../hooks/useProduits";
import { useCategories } from "../context/CategoriesContext";

export default function CategoryPage() {
    const { slug = "" } = useParams<{ slug: string }>();
    const [query, setQuery] = useState("");
    const [recherche, setRecherche] = useState("");

    const { categories } = useCategories();

    // Petit délai pour ne pas interroger le serveur à chaque lettre tapée.
    useEffect(() => {
        const timer = setTimeout(() => setRecherche(query.trim()), 300);
        return () => clearTimeout(timer);
    }, [query]);

    const { produits, loading, error, aPlusDeResultats, voirPlus, chargementSuite, erreurSuite } = useProduits({
        categorie: slug,
        recherche: recherche || undefined,
    });

    const categoryLabel = useMemo(() => {
        for (const racine of categories) {
            if (racine.slug === slug) return racine.nom;
            const enfant = racine.enfants?.find((e) => e.slug === slug);
            if (enfant) return enfant.nom;
        }
        return slug;
    }, [categories, slug]);

    return (
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 sm:flex-row">
            <CategorySidebar activeSlug={slug} />

            <div className="flex-1">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <h1 className="text-lg font-bold uppercase tracking-wide">{categoryLabel}</h1>

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

                {loading ? (
                    <p className="py-10 text-center text-sm text-neutral-500">Chargement...</p>
                ) : error ? (
                    <p className="py-10 text-center text-sm text-red-600">{error}</p>
                ) : produits.length === 0 ? (
                    <p className="py-10 text-center text-sm text-neutral-500">
                        {recherche
                            ? "Aucun article ne correspond à ta recherche dans cette catégorie."
                            : "Aucun article dans cette catégorie pour le moment."}
                    </p>
                ) : (
                    <>
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                            {produits.map((produit) => (
                                <ProductCard
                                    key={produit.id}
                                    product={produit}
                                    href={`/produit/${produit.slug}`}
                                />
                            ))}
                        </div>

                        <BoutonVoirPlus
                            visible={aPlusDeResultats}
                            chargement={chargementSuite}
                            erreur={erreurSuite}
                            onClick={voirPlus}
                        />
                    </>
                )}
            </div>
        </div>
    );
}

function SearchIcon({ className = "h-5 w-5" }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={className}>
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
        </svg>
    );
}