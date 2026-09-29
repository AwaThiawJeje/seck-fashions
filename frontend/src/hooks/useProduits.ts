import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { Page, Produit } from "../types/api";

type Filtres = {
    categorie?: string;
    recherche?: string;
    valeur?: string;
};

export function useProduits(filtres: Filtres = {}) {
    const [produits, setProduits] = useState<Produit[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const params = new URLSearchParams();
        if (filtres.categorie) params.set("categorie", filtres.categorie);
        if (filtres.recherche) params.set("recherche", filtres.recherche);
        if (filtres.valeur) params.set("valeur", filtres.valeur);

        setLoading(true);
        setError(null);

        api<Page<Produit>>(`/api/produits?${params.toString()}`)
            .then((page) => setProduits(page.data))
            .catch((err) => setError(err instanceof Error ? err.message : "Erreur de chargement."))
            .finally(() => setLoading(false));
    }, [filtres.categorie, filtres.recherche, filtres.valeur]);

    return { produits, loading, error };
}