import { Link } from "react-router-dom";
import { useCategories } from "../hooks/useCategories";

type CategorySidebarProps = {
    activeSlug: string;
};

export default function CategorySidebar({ activeSlug }: CategorySidebarProps) {
    const { categories, loading } = useCategories();

    if (loading) {
        return <aside className="w-full shrink-0 p-2 text-sm text-neutral-400 sm:w-48">Chargement...</aside>;
    }

    return (
        <aside className="w-full shrink-0 border-neutral-200 sm:w-48 sm:border-r">
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
    );
}