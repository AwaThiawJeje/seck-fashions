import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { api } from "../lib/api";
import type { Categorie } from "../types/api";

type CategoriesContextValue = {
    categories: Categorie[];
    loading: boolean;
    error: string | null;
    refetch: () => void;
};

const CategoriesContext = createContext<CategoriesContextValue | null>(null);

export function CategoriesProvider({ children }: { children: ReactNode }) {
    const [categories, setCategories] = useState<Categorie[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Chargé une seule fois pour toute l'app : avant, CategoryPage et CategorySidebar
    // appelaient chacun /api/categories de leur côté, doublant la requête à chaque
    // visite d'une page catégorie et ralentissant le premier affichage.
    const charger = useCallback(() => {
        setLoading(true);
        setError(null);
        api<Categorie[]>("/api/categories")
            .then(setCategories)
            .catch((err) => setError(err instanceof Error ? err.message : "Erreur de chargement."))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        charger();
    }, [charger]);

    return (
        <CategoriesContext.Provider value={{ categories, loading, error, refetch: charger }}>
            {children}
        </CategoriesContext.Provider>
    );
}

export function useCategories() {
    const ctx = useContext(CategoriesContext);
    if (!ctx) throw new Error("useCategories doit être utilisé dans un CategoriesProvider");
    return ctx;
}
