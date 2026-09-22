import { Link } from "react-router-dom";
import { categories } from "../data/categories";

type CategorySidebarProps = {
    activeSlug: string;
};

export default function CategorySidebar({ activeSlug }: CategorySidebarProps) {
    return (
        <aside className="w-full shrink-0 border-neutral-200 sm:w-48 sm:border-r">
            <nav className="flex flex-row gap-1 overflow-x-auto p-2 sm:flex-col sm:overflow-visible">
                {categories.map((cat) => {
                    const isActive = cat.slug === activeSlug;
                    return (
                        <Link
                            key={cat.slug}
                            to={`/categories/${cat.slug}`}
                            className={`shrink-0 rounded-sm px-3 py-2 text-sm font-medium transition-colors ${
                                isActive
                                    ? "bg-black text-white"
                                    : "text-neutral-700 hover:bg-neutral-100"
                            }`}
                        >
                            {cat.label}
                        </Link>
                    );
                })}
            </nav>
        </aside>
    );
}