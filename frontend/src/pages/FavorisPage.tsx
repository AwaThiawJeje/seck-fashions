import { Link } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import { useFavoris } from "../context/FavorisContext";

export default function FavorisPage() {
    const { favoris, loading } = useFavoris();

    return (
        <div className="mx-auto max-w-7xl px-4 py-6">
            <h1 className="mb-4 text-lg font-bold uppercase tracking-wide">Mes favoris</h1>

            {loading ? (
                <p className="py-10 text-center text-sm text-neutral-500">Chargement...</p>
            ) : favoris.length === 0 ? (
                <div className="py-16 text-center">
                    <p className="mb-3 text-sm text-neutral-500">Tu n'as pas encore de favoris.</p>
                    <Link to="/" className="text-sm font-semibold text-black underline">
                        Découvrir le catalogue
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                    {favoris.map((produit) => (
                        <ProductCard
                            key={produit.id}
                            product={produit}
                            href={`/produit/${produit.slug}`}
                            confirmerRetraitFavori
                        />
                    ))}
                </div>
            )}
        </div>
    );
}