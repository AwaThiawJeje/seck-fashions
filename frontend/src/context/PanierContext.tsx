import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { api } from "../lib/api";
import { useAuth } from "./AuthContext";
import type { Page, Produit } from "../types/api";

const STORAGE_KEY = "panier_invite";

type LigneBrute = {
    produitId: number;
    declinaisonId: number | null;
    quantite: number;
};

type LigneServeur = {
    produit_id: number;
    declinaison_id: number | null;
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

// chargement : on ne sait pas encore d'où vient le panier
// invite     : stocké sur l'appareil
// compte     : stocké sur le serveur
// hors-ligne : connecté, mais le serveur n'a pas répondu (on garde le panier sur l'appareil)
type Mode = "chargement" | "invite" | "compte" | "hors-ligne";

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

function versBrute(l: LigneServeur): LigneBrute {
    return { produitId: l.produit_id, declinaisonId: l.declinaison_id, quantite: l.quantite };
}

function versServeur(lignes: LigneBrute[]): LigneServeur[] {
    return lignes
        .filter((l) => l.quantite >= 1)
        .map((l) => ({ produit_id: l.produitId, declinaison_id: l.declinaisonId, quantite: l.quantite }));
}

/**
 * Fusionne deux paniers. Pour un même article on garde la plus grande quantité, pas la
 * somme : refaire la fusion (rechargement de page...) ne gonfle ainsi jamais les quantités.
 */
function fusionner(a: LigneBrute[], b: LigneBrute[]): LigneBrute[] {
    const resultat = a.map((l) => ({ ...l }));
    for (const ligne of b) {
        const existante = resultat.find(
            (l) => l.produitId === ligne.produitId && l.declinaisonId === ligne.declinaisonId,
        );
        if (existante) existante.quantite = Math.max(existante.quantite, ligne.quantite);
        else resultat.push({ ...ligne });
    }
    return resultat;
}

function prixUnitaireDe(produit: Produit): number {
    return produit.en_promotion ? Number(produit.prix_promo) : Number(produit.prix);
}

function stockMaxDe(produit: Produit, declinaisonId: number | null): number {
    if (!produit.disponible) return 0;
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
    const { user, loading: authLoading } = useAuth();
    const connecte = user !== null;

    const [lignesBrutes, setLignesBrutes] = useState<LigneBrute[]>(() => lireLocalStorage());
    const [mode, setMode] = useState<Mode>("chargement");
    const [produitsMap, setProduitsMap] = useState<Record<number, Produit>>({});
    const [introuvables, setIntrouvables] = useState<Set<number>>(new Set());

    const lignesRef = useRef(lignesBrutes);
    lignesRef.current = lignesBrutes;

    // Dernière version connue du panier côté serveur (pour ne rien renvoyer d'inutile).
    const derniereVersionServeur = useRef("[]");
    const envoiEnCours = useRef(false);
    const renvoyer = useRef(false);

    const synchroniserAvecServeur = useCallback(async () => {
        if (envoiEnCours.current) {
            renvoyer.current = true; // un envoi est en cours : la dernière version partira juste après
            return;
        }

        envoiEnCours.current = true;
        try {
            do {
                renvoyer.current = false;
                const contenu = versServeur(lignesRef.current);
                const empreinte = JSON.stringify(contenu);
                if (empreinte === derniereVersionServeur.current) break;

                await api("/api/panier", { method: "PUT", body: { lignes: contenu } });
                derniereVersionServeur.current = empreinte;
            } while (renvoyer.current);
        } catch {
            // Échec réseau : la prochaine modification retentera l'envoi.
        } finally {
            envoiEnCours.current = false;
        }
    }, []);

    // D'où vient le panier ? Appareil (visiteur) ou serveur (client connecté).
    useEffect(() => {
        if (authLoading) return;
        let annule = false;

        if (!connecte) {
            setLignesBrutes(lireLocalStorage());
            setMode("invite");
            return;
        }

        setMode("chargement");

        (async () => {
            try {
                const serveur = (await api<LigneServeur[]>("/api/panier")).map(versBrute);
                derniereVersionServeur.current = JSON.stringify(versServeur(serveur));

                // Le panier choisi avant la connexion rejoint celui du compte.
                const locales = lireLocalStorage();
                let finale = serveur;

                if (locales.length > 0) {
                    finale = fusionner(serveur, locales);
                    try {
                        await api("/api/panier", { method: "PUT", body: { lignes: versServeur(finale) } });
                        derniereVersionServeur.current = JSON.stringify(versServeur(finale));
                        ecrireLocalStorage([]);
                    } catch {
                        // On garde le panier de l'appareil : la fusion sera retentée plus tard.
                    }
                }

                if (annule) return;
                setLignesBrutes(finale);
                setMode("compte");
            } catch {
                if (annule) return;
                setLignesBrutes(lireLocalStorage());
                setMode("hors-ligne");
            }
        })();

        return () => {
            annule = true;
        };
    }, [connecte, authLoading]);

    // Sauvegarde après chaque modification. Le mode évite d'écrire le panier d'un compte
    // sur l'appareil au moment d'une déconnexion.
    useEffect(() => {
        if ((mode === "invite" && !connecte) || (mode === "hors-ligne" && connecte)) {
            ecrireLocalStorage(lignesBrutes);
        } else if (mode === "compte" && connecte) {
            synchroniserAvecServeur();
        }
    }, [lignesBrutes, mode, connecte, synchroniserAvecServeur]);

    // Récupère les produits des lignes qu'on ne connaît pas encore.
    useEffect(() => {
        const manquants = [...new Set(lignesBrutes.map((l) => l.produitId))].filter(
            (id) => !(id in produitsMap) && !introuvables.has(id),
        );
        if (manquants.length === 0) return;

        let annule = false;
        api<Page<Produit>>(`/api/produits?ids=${manquants.join(",")}`)
            .then((page) => {
                if (annule) return;
                setProduitsMap((prev) => {
                    const next = { ...prev };
                    page.data.forEach((p) => {
                        next[p.id] = p;
                    });
                    return next;
                });
                const trouves = new Set(page.data.map((p) => p.id));
                setIntrouvables((prev) => new Set([...prev, ...manquants.filter((id) => !trouves.has(id))]));
            })
            .catch(() => {
                if (!annule) setIntrouvables((prev) => new Set([...prev, ...manquants]));
            });

        return () => {
            annule = true;
        };
    }, [lignesBrutes, produitsMap, introuvables]);

    const produitsManquants = lignesBrutes.some(
        (l) => !(l.produitId in produitsMap) && !introuvables.has(l.produitId),
    );
    const loading = mode === "chargement" || produitsManquants;

    const lignes: LignePanier[] = useMemo(() => {
        return lignesBrutes
            .map((lb) => {
                const produit = produitsMap[lb.produitId];
                if (!produit) return null;

                const declinaison =
                    lb.declinaisonId !== null
                        ? (produit.declinaisons?.find((d) => d.id === lb.declinaisonId) ?? null)
                        : null;

                const prixUnitaire = prixUnitaireDe(produit);
                const stockMax = stockMaxDe(produit, lb.declinaisonId);
                // Une quantité enregistrée plus haut que le stock actuel est ramenée au stock.
                const quantite = stockMax > 0 ? Math.min(lb.quantite, stockMax) : lb.quantite;

                return {
                    produitId: lb.produitId,
                    declinaisonId: lb.declinaisonId,
                    quantite,
                    produit,
                    declinaisonValeur: declinaison?.label ?? null,
                    prixUnitaire,
                    stockMax,
                    sousTotal: prixUnitaire * quantite,
                } satisfies LignePanier;
            })
            .filter((l): l is LignePanier => l !== null);
    }, [lignesBrutes, produitsMap]);

    const ajouterLigne = useCallback((produit: Produit, declinaisonId: number | null, quantite = 1) => {
        // Le produit est mis en cache tout de suite : la ligne s'affiche sans attendre un nouvel appel.
        setProduitsMap((prev) => ({ ...prev, [produit.id]: produit }));

        setLignesBrutes((prev) => {
            const stock = stockMaxDe(produit, declinaisonId);
            const index = prev.findIndex((l) => l.produitId === produit.id && l.declinaisonId === declinaisonId);
            const dejaDansLePanier = index === -1 ? 0 : prev[index].quantite;
            const nouvelle = Math.min(dejaDansLePanier + quantite, stock);
            if (nouvelle < 1) return prev;

            if (index === -1) {
                return [...prev, { produitId: produit.id, declinaisonId, quantite: nouvelle }];
            }
            const copie = [...prev];
            copie[index] = { ...copie[index], quantite: nouvelle };
            return copie;
        });
    }, []);

    const modifierQuantite = useCallback((produitId: number, declinaisonId: number | null, quantite: number) => {
        setLignesBrutes((prev) =>
            prev.map((l) =>
                l.produitId === produitId && l.declinaisonId === declinaisonId
                    ? { ...l, quantite: Math.max(1, quantite) }
                    : l,
            ),
        );
    }, []);

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