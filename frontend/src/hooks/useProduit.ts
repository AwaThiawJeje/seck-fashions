import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { echo } from "../lib/echo";
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

    // Mise à jour en temps réel : si CE produit est modifié ailleurs (prix, stock...),
    // on rafraîchit sa fiche sans que le client ait besoin de recharger la page.
    // On compare par id (pas par slug, qui peut lui-même changer si le nom change).
    useEffect(() => {
        const channel = echo.channel("produits");

        const surMaj = (donnees: Produit) => {
            setProduit((actuel) => (actuel && actuel.id === donnees.id ? donnees : actuel));
        };
        const surSuppression = (donnees: { id: number }) => {
            setProduit((actuel) => (actuel && actuel.id === donnees.id ? null : actuel));
        };

        channel.listen(".produit.maj", surMaj);
        channel.listen(".produit.supprime", surSuppression);

        return () => {
            channel.stopListening(".produit.maj");
            channel.stopListening(".produit.supprime");
        };
    }, []);

    return { produit, loading, error };
}