import { Link } from "react-router-dom";
import { useCategories } from "../context/CategoriesContext";

type CategorySidebarProps = {
    activeSlug: string;
};

export default function CategorySidebar({ activeSlug }: CategorySidebarProps) {
    const { categories, loading } = useCategories();

    if (loading) {
        return (
            <>
                <p className="p-2 text-sm text-neutral-400 sm:hidden">Chargement...</p>
                <aside className="hidden shrink-0 p-2 text-sm text-neutral-400 sm:block sm:w-48">Chargement...</aside>
            </>
        );
    }

    // Pour la barre horizontale mobile : une liste à plat, uniquement des catégories
    // qui affichent vraiment des produits (les enfants quand ils existent, sinon la
    // racine elle-même si elle n'a pas de sous-catégorie).
    const categoriesPlates = categories.flatMap((racine) =>
        racine.enfants && racine.enfants.length > 0 ? racine.enfants : [racine],
    );

    return (
        <>
            {/* Mobile : barre horizontale fixée sous le header, pour ne pas avoir à
                scroller verticalement à travers toute la liste avant les produits. */}
            <nav className="sticky top-16 z-40 -mx-4 flex gap-2 overflow-x-auto border-b border-neutral-200 bg-white px-4 py-2 sm:hidden">
                {categoriesPlates.map((cat) => (
                    <Link
                        key={cat.slug}
                        to={`/categories/${cat.slug}`}
                        className={`shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                            cat.slug === activeSlug
                                ? "border-black bg-black text-white"
                                : "border-neutral-300 text-neutral-700 hover:border-black"
                        }`}
                    >
                        {cat.nom}
                    </Link>
                ))}
            </nav>

            {/* Desktop : sidebar verticale classique */}
            <aside className="hidden shrink-0 border-neutral-200 sm:block sm:w-48 sm:border-r">
                <nav className="flex flex-col gap-3 p-2">
                    {categories.map((racine) => (
                        <div key={racine.slug}>
                            <Link
                                to={`/categories/${racine.slug}`}
                                className={`block rounded-sm px-3 py-2 text-sm font-semibold transition-colors ${
                                    racine.slug === activeSlug ? "bg-black text-white" : "text-neutral-800 hover:bg-neutral-100"
                                }`}
                            >
                                {racine.nom}
                            </Link>

                            {racine.enfants && racine.enfants.length > 0 && (
                                <div className="ml-2 mt-1 flex flex-col gap-0.5 border-l border-neutral-200 pl-2">
                                    {racine.enfants.map((enfant) => (
                                        <Link
                                            key={enfant.slug}
                                            to={`/categories/${enfant.slug}`}
                                            className={`rounded-sm px-3 py-1.5 text-sm transition-colors ${
                                                enfant.slug === activeSlug ? "bg-black text-white" : "text-neutral-600 hover:bg-neutral-100"
                                            }`}
                                        >
                                            {enfant.nom}
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </nav>
            </aside>
        </>
    );
}