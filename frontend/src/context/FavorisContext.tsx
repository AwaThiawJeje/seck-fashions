import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { api } from "../lib/api";
import { useAuth } from "./AuthContext";
import type { Favori, Page, Produit } from "../types/api";

const STORAGE_KEY = "favoris_invite";

function lireLocalStorage(): number[] {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
}

function ecrireLocalStorage(ids: number[]) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    } catch {
        // stockage indisponible : les favoris restent en mémoire pour cette session seulement
    }
}

type FavorisContextValue = {
    favoris: Produit[];
    loading: boolean;
    estFavori: (produitId: number) => boolean;
    toggleFavori: (produit: Produit) => Promise<void>;
};

const FavorisContext = createContext<FavorisContextValue | null>(null);

export function FavorisProvider({ children }: { children: ReactNode }) {
    const { user, loading: authLoading } = useAuth();
    const [favoris, setFavoris] = useState<Produit[]>([]);
    const [loading, setLoading] = useState(true);

    const charger = useCallback(() => {
        if (authLoading) return;
        setLoading(true);

        if (user) {
            api<Favori[]>("/api/favoris")
                .then((data) => setFavoris(data.map((f) => f.produit)))
                .catch(() => setFavoris([]))
                .finally(() => setLoading(false));
        } else {
            const ids = lireLocalStorage();
            if (ids.length === 0) {
                setFavoris([]);
                setLoading(false);
                return;
            }
            api<Page<Produit>>(`/api/produits?ids=${ids.join(",")}`)
                .then((page) => setFavoris(page.data))
                .catch(() => setFavoris([]))
                .finally(() => setLoading(false));
        }
    }, [user, authLoading]);

    useEffect(() => {
        charger();
    }, [charger]);

    const estFavori = useCallback(
        (produitId: number) => favoris.some((f) => f.id === produitId),
        [favoris],
    );

    const toggleFavori = useCallback(
        async (produit: Produit) => {
            const dejaFavori = favoris.some((f) => f.id === produit.id);

            if (user) {
                // Mise à jour optimiste : l'UI change tout de suite, on resynchronise seulement si l'appel échoue
                if (dejaFavori) {
                    setFavoris((prev) => prev.filter((f) => f.id !== produit.id));
                    try {
                        await api(`/api/favoris/${produit.slug}`, { method: "DELETE" });
                    } catch {
                        charger();
                    }
                } else {
                    setFavoris((prev) => [...prev, produit]);
                    try {
                        await api("/api/favoris", { method: "POST", body: { produit_id: produit.id } });
                    } catch {
                        charger();
                    }
                }
            } else {
                const ids = lireLocalStorage();
                const next = dejaFavori ? ids.filter((id) => id !== produit.id) : [...ids, produit.id];
                ecrireLocalStorage(next);
                setFavoris((prev) =>
                    dejaFavori ? prev.filter((f) => f.id !== produit.id) : [...prev, produit],
                );
            }
        },
        [favoris, user, charger],
    );

    return (
        <FavorisContext.Provider value={{ favoris, loading: loading || authLoading, estFavori, toggleFavori }}>
            {children}
        </FavorisContext.Provider>
    );
}

export function useFavoris() {
    const ctx = useContext(FavorisContext);
    if (!ctx) throw new Error("useFavoris doit être utilisé dans un FavorisProvider");
    return ctx;
}