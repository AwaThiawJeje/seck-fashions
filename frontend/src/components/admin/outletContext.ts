export type AdminOutletContext = {
    /** Recompte les commandes à valider (pastille du menu). */
    rafraichirCommandesAValider: () => void;
    /** Recompte les avis en attente de modération (pastille du menu). */
    rafraichirAvisEnAttente: () => void;
};