import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "recherches_recentes";
const MAX_ENTRIES = 8;

export function useRecentSearches() {
    const [recherches, setRecherches] = useState<string[]>([]);

    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) setRecherches(JSON.parse(stored));
        } catch {
            // localStorage indisponible ou corrompu : on repart d'une liste vide
        }
    }, []);

    const ajouter = useCallback((terme: string) => {
        const t = terme.trim();
        if (!t) return;
        setRecherches((prev) => {
            const sansDoublon = prev.filter((r) => r.toLowerCase() !== t.toLowerCase());
            const next = [t, ...sansDoublon].slice(0, MAX_ENTRIES);
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
            } catch {
                // stockage plein ou désactivé : on garde juste l'état en mémoire
            }
            return next;
        });
    }, []);

    const effacer = useCallback(() => {
        setRecherches([]);
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch {
            // rien à faire si le stockage n'est pas disponible
        }
    }, []);

    return { recherches, ajouter, effacer };
}