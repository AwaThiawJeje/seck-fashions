import ProductCard from "./ProductCard";
import { useProduits } from "../hooks/useProduits";

export default function ProductGrid() {
    const { produits, loading, error } = useProduits();

    if (loading) return <p className="p-4 text-center text-sm text-neutral-500">Chargement des articles...</p>;
    if (error) return <p className="p-4 text-center text-sm text-red-600">{error}</p>;
    if (produits.length === 0) return <p className="p-4 text-center text-sm text-neutral-500">Aucun article disponible pour le moment.</p>;

    return (
        <div className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-3 lg:grid-cols-4">
            {produits.map((produit) => (
                <ProductCard
                    key={produit.id}
                    product={produit}
                    href={`/produit/${produit.slug}`}
                    onAddToCart={(id) => console.log("Ajouté :", id)}
                />
            ))}
        </div>
    );
}