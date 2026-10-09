import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import BoutonVoirPlus from "../components/BoutonVoirPlus";
import { useProduits } from "../hooks/useProduits";

export default function SearchPage() {
    const [searchParams] = useSearchParams();
    const q = searchParams.get("q") ?? "";

    const { produits, total, loading, error, aPlusDeResultats, voirPlus, chargementSuite, erreurSuite } =
        useProduits({ recherche: q });

    const titre = useMemo(() => (q ? `Résultats pour "${q}"` : "Recherche"), [q]);

    return (
        <div className="mx-auto max-w-7xl px-4 py-6">
            <div className="mb-4">
                <h1 className="text-lg font-bold uppercase tracking-wide">{titre}</h1>
                {!loading && !error && produits.length > 0 && (
                    <p className="mt-1 text-xs text-neutral-500">
                        {total} article{total > 1 ? "s" : ""}
                    </p>
                )}
            </div>

            {loading ? (
                <p className="py-10 text-center text-sm text-neutral-500">Recherche en cours...</p>
            ) : error ? (
                <p className="py-10 text-center text-sm text-red-600">{error}</p>
            ) : produits.length === 0 ? (
                <p className="py-10 text-center text-sm text-neutral-500">
                    Aucun article ne correspond à "{q}".
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
    );
}