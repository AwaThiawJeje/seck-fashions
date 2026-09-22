export type Category = {
    slug: string;
    label: string;
};

export const categories: Category[] = [
    { slug: "chaussures", label: "Chaussures" },
    { slug: "vetements", label: "Vêtements" },
    { slug: "accessoires", label: "Accessoires" },
    // ajoute une entrée par catégorie au fur et à mesure
];