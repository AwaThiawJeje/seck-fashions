import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api";
import type { Page, Produit } from "../types/api";

type Filtres = {
    categorie?: string;
    recherche?: string;
    valeur?: string;
    tout?: boolean; // réservé à l'admin : montre aussi les produits masqués/épuisés
};

export function useProduits(filtres: Filtres = {}) {
    const [produits, setProduits] = useState<Produit[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const charger = useCallback(() => {
        const params = new URLSearchParams();
        if (filtres.categorie) params.set("categorie", filtres.categorie);
        if (filtres.recherche) params.set("recherche", filtres.recherche);
        if (filtres.valeur) params.set("valeur", filtres.valeur);
        if (filtres.tout) params.set("tout", "1");

        setLoading(true);
        setError(null);

        api<Page<Produit>>(`/api/produits?${params.toString()}`)
            .then((page) => setProduits(page.data))
            .catch((err) => setError(err instanceof Error ? err.message : "Erreur de chargement."))
            .finally(() => setLoading(false));
    }, [filtres.categorie, filtres.recherche, filtres.valeur, filtres.tout]);

    useEffect(() => {
        charger();
    }, [charger]);

    return { produits, loading, error, refetch: charger };
}