const CLE = "seck_fashions_produits_recents";
const MAX = 10;

export function ajouterProduitRecent(id: number): void {
    try {
        const sansDoublon = recupererIdsRecents().filter((i) => i !== id);
        localStorage.setItem(CLE, JSON.stringify([id, ...sansDoublon].slice(0, MAX)));
    } catch {
        // Stockage indisponible (navigation privée...) — on ignore simplement.
    }
}

export function recupererIdsRecents(): number[] {
    try {
        const brut = localStorage.getItem(CLE);
        const valeurs = brut ? JSON.parse(brut) : [];
        return Array.isArray(valeurs) ? valeurs.filter((v) => typeof v === "number") : [];
    } catch {
        return [];
    }
}
