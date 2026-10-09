import { useCallback } from "react";
import { useListePaginee } from "./useListePaginee";
import type { Commande } from "../types/api";

export function useCommandesAdmin(statut?: string) {
    const construireUrl = useCallback(
        (page: number) => {
            const params = new URLSearchParams({ page: String(page) });
            if (statut) params.set("statut", statut);
            return `/api/commandes?${params.toString()}`;
        },
        [statut]
    );

    const { elements, ...reste } = useListePaginee<Commande>(construireUrl);
    return { commandes: elements, ...reste };
}