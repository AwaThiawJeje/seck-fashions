import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { Categorie } from "../types/api";

export function useCategories() {
    const [categories, setCategories] = useState<Categorie[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        api<Categorie[]>("/api/categories")
            .then(setCategories)
            .catch((err) => setError(err instanceof Error ? err.message : "Erreur de chargement."))
            .finally(() => setLoading(false));
    }, []);

    return { categories, loading, error };
}