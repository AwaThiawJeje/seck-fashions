import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../lib/api";
import type { Page } from "../types/api";

/** Retire les doublons, au cas où un élément aurait bougé de page pendant la lecture. */
function fusionner<T extends { id: number }>(listes: T[][]): T[] {
    const vus = new Set<number>();
    const resultat: T[] = [];
    for (const element of listes.flat()) {
        if (!vus.has(element.id)) {
            vus.add(element.id);
            resultat.push(element);
        }
    }
    return resultat;
}

export function useListePaginee<T extends { id: number }>(construireUrl: (page: number) => string) {
    const [elements, setElements] = useState<T[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [chargementSuite, setChargementSuite] = useState(false);
    const [erreurSuite, setErreurSuite] = useState(false);
    const [aPlusDeResultats, setAPlusDeResultats] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const generation = useRef(0); // sert à ignorer les réponses devenues périmées
    const pageChargee = useRef(0);
    const dernierePage = useRef(1);

    const appliquerPagination = useCallback((page: Page<T>) => {
        pageChargee.current = page.current_page;
        dernierePage.current = page.last_page;
        setTotal(page.total);
        setAPlusDeResultats(page.current_page < page.last_page);
    }, []);

    const charger = useCallback(
        (silencieux: boolean) => {
            const numero = ++generation.current;
            if (!silencieux) setLoading(true);
            setError(null);
            setErreurSuite(false);

            // Rechargement silencieux (après une modification) : on relit toutes les pages
            // déjà affichées, pour que la liste ne se replie pas sur les 20 premiers.
            const nombrePages = silencieux ? Math.max(pageChargee.current, 1) : 1;

            Promise.all(Array.from({ length: nombrePages }, (_, i) => api<Page<T>>(construireUrl(i + 1))))
                .then((pages) => {
                    if (numero !== generation.current) return;
                    setElements(fusionner(pages.map((p) => p.data)));
                    appliquerPagination(pages[pages.length - 1]);
                })
                .catch((err) => {
                    // Un rechargement silencieux raté ne doit pas remplacer la liste par une erreur.
                    if (!silencieux && numero === generation.current) {
                        setError(err instanceof Error ? err.message : "Erreur de chargement.");
                    }
                })
                .finally(() => {
                    if (numero === generation.current) setLoading(false);
                });
        },
        [construireUrl, appliquerPagination]
    );

    useEffect(() => {
        charger(false);
    }, [charger]);

    const refetch = useCallback(() => charger(true), [charger]);

    const voirPlus = useCallback(() => {
        if (chargementSuite || pageChargee.current >= dernierePage.current) return;

        const numero = generation.current;
        setChargementSuite(true);
        setErreurSuite(false);

        api<Page<T>>(construireUrl(pageChargee.current + 1))
            .then((page) => {
                if (numero !== generation.current) return;
                setElements((prev) => fusionner([prev, page.data]));
                appliquerPagination(page);
            })
            .catch(() => {
                if (numero === generation.current) setErreurSuite(true);
            })
            .finally(() => setChargementSuite(false));
    }, [chargementSuite, construireUrl, appliquerPagination]);

    return { elements, total, loading, error, chargementSuite, erreurSuite, aPlusDeResultats, voirPlus, refetch };
}