import ProductCard from "./ProductCard";
import { products } from "../data/products";

export default function ProductGrid() {
    return (
        <div className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
                <ProductCard
                    key={product.id}
                    product={product}
                    href={`/produit/${product.id}`}
                    onAddToCart={(id) => console.log("Ajouté :", id)}
                />
            ))}
        </div>
    );
}