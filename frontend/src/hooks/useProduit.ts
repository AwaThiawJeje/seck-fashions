import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { Produit } from "../types/api";

export function useProduit(slug: string) {
    const [produit, setProduit] = useState<Produit | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!slug) return;
        setLoading(true);
        setError(null);
        api<Produit>(`/api/produits/${slug}`)
            .then(setProduit)
            .catch((err) => setError(err instanceof Error ? err.message : "Erreur de chargement."))
            .finally(() => setLoading(false));
    }, [slug]);

    return { produit, loading, error };
}