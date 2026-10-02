import type { Commande } from "../types/api";

function formatPrice(value: number): string {
    return `${value.toLocaleString("fr-FR")} FCFA`;
}

export function construireLienWhatsapp(numero: string, message: string): string {
    const numeroNettoye = numero.replace(/[^\d]/g, "");
    return `https://wa.me/${numeroNettoye}?text=${encodeURIComponent(message)}`;
}

export function construireMessageCommande(commande: Commande): string {
    const lignes = (commande.lignes ?? []).map((l) => {
        const taille = l.declinaison_valeur ? ` (${l.declinaison_valeur})` : "";
        return `• ${l.nom_produit}${taille} x${l.quantite} — ${formatPrice(Number(l.sous_total))}`;
    });

    return [
        `Bonjour, je souhaite commander (réf. #${commande.id}) :`,
        "",
        ...lignes,
        "",
        `Total : ${formatPrice(Number(commande.total))}`,
        "",
        "Merci de me confirmer la disponibilité.",
    ].join("\n");
}