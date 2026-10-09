import { useCallback, useEffect } from "react";
import { useListePaginee } from "./useListePaginee";
import { echo } from "../lib/echo";
import type { Produit } from "../types/api";

type Filtres = {
    categorie?: string;
    recherche?: string;
    valeur?: string;
    tout?: boolean; // réservé à l'admin : montre aussi les produits masqués/épuisés
    etat?: "en_stock" | "epuise" | "masque"; // réservé à l'admin, avec "tout"
};

export function useProduits(filtres: Filtres = {}) {
    const { categorie, recherche, valeur, tout, etat } = filtres;

    const construireUrl = useCallback(
        (page: number) => {
            const params = new URLSearchParams();
            if (categorie) params.set("categorie", categorie);
            if (recherche) params.set("recherche", recherche);
            if (valeur) params.set("valeur", valeur);
            if (tout) params.set("tout", "1");
            if (etat) params.set("etat", etat);
            params.set("page", String(page));
            return `/api/produits?${params.toString()}`;
        },
        [categorie, recherche, valeur, tout, etat]
    );

    const { elements, refetch, ...reste } = useListePaginee<Produit>(construireUrl);

    // Mise à jour en temps réel (Reverb) : un produit créé/modifié/supprimé ailleurs
    // (admin, autre onglet) recharge discrètement la liste affichée, sans spinner.
    useEffect(() => {
        const channel = echo.channel("produits");
        channel.listen(".produit.maj", refetch);
        channel.listen(".produit.supprime", refetch);

        return () => {
            channel.stopListening(".produit.maj");
            channel.stopListening(".produit.supprime");
        };
    }, [refetch]);

    return { produits: elements, refetch, ...reste };
}