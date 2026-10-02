import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api";
import type { Commande, Page } from "../types/api";

export function useCommandesAdmin(statut?: string) {
    const [commandes, setCommandes] = useState<Commande[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const charger = useCallback(() => {
        setLoading(true);
        setError(null);
        const params = statut ? `?statut=${statut}` : "";
        api<Page<Commande>>(`/api/commandes${params}`)
            .then((page) => setCommandes(page.data))
            .catch((err) => setError(err instanceof Error ? err.message : "Erreur de chargement."))
            .finally(() => setLoading(false));
    }, [statut]);

    useEffect(() => {
        charger();
    }, [charger]);

    return { commandes, loading, error, refetch: charger };
}