import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api } from "../lib/api";
import type { Page, Produit } from "../types/api";

const STORAGE_KEY = "panier_invite";

type LigneBrute = {
    produitId: number;
    declinaisonId: number | null;
    quantite: number;
};

export type LignePanier = {
    produitId: number;
    declinaisonId: number | null;
    quantite: number;
    produit: Produit;
    declinaisonValeur: string | null;
    prixUnitaire: number;
    stockMax: number;
    sousTotal: number;
};

function lireLocalStorage(): LigneBrute[] {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
}

function ecrireLocalStorage(lignes: LigneBrute[]) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(lignes));
    } catch {
        // stockage indisponible : le panier reste en mémoire pour cette session seulement
    }
}

function prixUnitaireDe(produit: Produit): number {
    return produit.en_promotion ? Number(produit.prix_promo) : Number(produit.prix);
}

function stockMaxDe(produit: Produit, declinaisonId: number | null): number {
    if (declinaisonId !== null) {
        return produit.declinaisons?.find((d) => d.id === declinaisonId)?.quantite ?? 0;
    }
    return produit.quantite;
}

type PanierContextValue = {
    lignes: LignePanier[];
    loading: boolean;
    nombreArticles: number;
    total: number;
    ajouterLigne: (produit: Produit, declinaisonId: number | null, quantite?: number) => void;
    modifierQuantite: (produitId: number, declinaisonId: number | null, quantite: number) => void;
    retirerLigne: (produitId: number, declinaisonId: number | null) => void;
    viderPanier: () => void;
};

const PanierContext = createContext<PanierContextValue | null>(null);

export function PanierProvider({ children }: { children: ReactNode }) {
    const [lignesBrutes, setLignesBrutes] = useState<LigneBrute[]>(() => lireLocalStorage());
    const [produitsMap, setProduitsMap] = useState<Record<number, Produit>>({});
    const [loading, setLoading] = useState(true);

    // Persiste à chaque changement
    useEffect(() => {
        ecrireLocalStorage(lignesBrutes);
    }, [lignesBrutes]);

    // Récupère les produits manquants — utile surtout au premier chargement,
    // quand on relit le panier depuis localStorage sans encore avoir les objets produits en mémoire.
    useEffect(() => {
        const idsManquants = [...new Set(lignesBrutes.map((l) => l.produitId))].filter(
            (id) => !(id in produitsMap),
        );

        if (idsManquants.length === 0) {
            setLoading(false);
            return;
        }

        setLoading(true);
        api<Page<Produit>>(`/api/produits?ids=${idsManquants.join(",")}`)
            .then((page) => {
                setProduitsMap((prev) => {
                    const next = { ...prev };
                    page.data.forEach((p) => { next[p.id] = p; });
                    return next;
                });
            })
            .finally(() => setLoading(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lignesBrutes]);

    const lignes: LignePanier[] = useMemo(() => {
        return lignesBrutes
            .map((lb) => {
                const produit = produitsMap[lb.produitId];
                if (!produit) return null;

                const declinaison = lb.declinaisonId !== null
                    ? produit.declinaisons?.find((d) => d.id === lb.declinaisonId) ?? null
                    : null;

                const prixUnitaire = prixUnitaireDe(produit);

                return {
                    produitId: lb.produitId,
                    declinaisonId: lb.declinaisonId,
                    quantite: lb.quantite,
                    produit,
                    declinaisonValeur: declinaison?.valeur ?? null,
                    prixUnitaire,
                    stockMax: stockMaxDe(produit, lb.declinaisonId),
                    sousTotal: prixUnitaire * lb.quantite,
                } satisfies LignePanier;
            })
            .filter((l): l is LignePanier => l !== null);
    }, [lignesBrutes, produitsMap]);

    const ajouterLigne = useCallback(
        (produit: Produit, declinaisonId: number | null, quantite = 1) => {
            // Merge immédiat dans le cache local : pas besoin d'attendre un fetch pour afficher la ligne
            setProduitsMap((prev) => ({ ...prev, [produit.id]: produit }));

            setLignesBrutes((prev) => {
                const stock = stockMaxDe(produit, declinaisonId);
                const index = prev.findIndex(
                    (l) => l.produitId === produit.id && l.declinaisonId === declinaisonId,
                );

                if (index === -1) {
                    return [...prev, { produitId: produit.id, declinaisonId, quantite: Math.min(quantite, stock) }];
                }

                const copie = [...prev];
                copie[index] = {
                    ...copie[index],
                    quantite: Math.min(copie[index].quantite + quantite, stock),
                };
                return copie;
            });
        },
        [],
    );

    const modifierQuantite = useCallback(
        (produitId: number, declinaisonId: number | null, quantite: number) => {
            setLignesBrutes((prev) =>
                prev.map((l) =>
                    l.produitId === produitId && l.declinaisonId === declinaisonId
                        ? { ...l, quantite: Math.max(1, quantite) }
                        : l,
                ),
            );
        },
        [],
    );

    const retirerLigne = useCallback((produitId: number, declinaisonId: number | null) => {
        setLignesBrutes((prev) =>
            prev.filter((l) => !(l.produitId === produitId && l.declinaisonId === declinaisonId)),
        );
    }, []);

    const viderPanier = useCallback(() => {
        setLignesBrutes([]);
    }, []);

    const nombreArticles = useMemo(() => lignes.reduce((sum, l) => sum + l.quantite, 0), [lignes]);
    const total = useMemo(() => lignes.reduce((sum, l) => sum + l.sousTotal, 0), [lignes]);

    return (
        <PanierContext.Provider
            value={{ lignes, loading, nombreArticles, total, ajouterLigne, modifierQuantite, retirerLigne, viderPanier }}
        >
            {children}
        </PanierContext.Provider>
    );
}

export function usePanier() {
    const ctx = useContext(PanierContext);
    if (!ctx) throw new Error("usePanier doit être utilisé dans un PanierProvider");
    return ctx;
}