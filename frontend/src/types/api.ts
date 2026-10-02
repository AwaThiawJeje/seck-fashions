export interface Categorie {
    id: number;
    nom: string;
    slug: string;
    categorie_parente_id: number | null;
    enfants?: Categorie[];
    parente?: Categorie;
}

export interface Declinaison {
    id: number;
    produit_id: number;
    valeur: string;
    quantite: number;
}

export interface ImageProduit {
    id: number;
    produit_id: number;
    chemin: string;
    url: string;
    ordre: number;
}

export interface Produit {
    id: number;
    categorie_id: number;
    nom: string;
    slug: string;
    description: string | null;
    prix: string; // décimal renvoyé en texte : "25000.00"
    prix_promo: string | null;
    en_promotion: boolean;
    pourcentage_reduction: number | null;
    quantite: number;
    disponible: boolean;
    reference: string | null;
    mis_en_avant: boolean;
    categorie?: Categorie;
    images?: ImageProduit[];
    declinaisons?: Declinaison[];
}

export interface Page<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

export interface User {
    id: number;
    name: string;
    email: string;
    telephone: string | null;
    role: 'admin' | 'client';
}

export type StatutCommande = 'en_attente' | 'confirmee' | 'expediee' | 'livree' | 'annulee';

export interface LigneCommande {
    id: number;
    commande_id: number;
    produit_id: number | null;
    declinaison_id: number | null;
    declinaison_valeur: string | null;
    nom_produit: string;
    prix_unitaire: string;
    quantite: number;
    sous_total: string;
}

export interface Livraison {
    id: number;
    commande_id: number;
    nom_complet: string;
    telephone: string;
    adresse: string;
    ville: string;
    statut: 'en_attente' | 'en_cours' | 'livree' | 'echouee';
    date_prevue: string | null;
    date_reelle: string | null;
}

export interface Commande {
    id: number;
    user_id: number | null;
    statut: StatutCommande;
    total: string;
    methode_paiement: 'paiement_livraison' | 'wave' | 'orange_money';
    notes: string | null;
    created_at: string;
    lignes?: LigneCommande[];
    livraison?: Livraison | null;
    user?: User | null;
}

export interface Favori {
  id: number;
  user_id: number;
  produit_id: number;
  produit: Produit;
}