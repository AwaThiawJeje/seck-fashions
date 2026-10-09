import ProductCard from "./ProductCard";
import type { Produit } from "../types/api";

export default function RangeeProduits({ titre, produits }: { titre: string; produits: Produit[] }) {
    if (produits.length === 0) return null;

    return (
        <div className="border-t border-neutral-200 pt-6">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-neutral-800">{titre}</h2>
            <div className="flex gap-4 overflow-x-auto pb-2">
                {produits.map((p) => (
                    <div key={p.id} className="w-40 shrink-0 sm:w-48">
                        <ProductCard product={p} href={`/produit/${p.slug}`} />
                    </div>
                ))}
            </div>
        </div>
    );
}
