import { Link } from "react-router-dom";

type NavKey = "accueil" | "categories" | "favoris" | "panier";

type BottomNavProps = {
    active?: NavKey;
    favoritesCount?: number;
    cartCount?: number;
};

export default function BottomNav({ active = "accueil", favoritesCount = 0, cartCount = 0 }: BottomNavProps) {
    const items: { key: NavKey; href: string; label: string; icon: React.ReactNode; count?: number }[] = [
        { key: "accueil", href: "/", label: "Accueil", icon: <HomeIcon /> },
        { key: "categories", href: "/categories/chaussures", label: "Catégories", icon: <CategoryIcon /> },
        { key: "favoris", href: "/favoris", label: "Favoris", icon: <HeartIcon />, count: favoritesCount },
        { key: "panier", href: "/panier", label: "Panier", icon: <CartIcon />, count: cartCount },
    ];

    return (
        <nav className="fixed inset-x-0 bottom-0 z-50 flex h-16 border-t border-neutral-200 bg-white md:hidden">
            {items.map((item) => {
                const isActive = item.key === active;
                return (
                    <Link
                        key={item.key}
                        to={item.href}
                        aria-label={item.label}
                        aria-current={isActive ? "page" : undefined}
                        className="relative flex flex-1 flex-col items-center justify-center gap-0.5"
                    >
                        <span className={isActive ? "text-black" : "text-neutral-400"}>{item.icon}</span>
                        <span className={`text-[11px] ${isActive ? "font-semibold text-black" : "text-neutral-400"}`}>
                            {item.label}
                        </span>
                        {!!item.count && item.count > 0 && (
                            <span className="absolute right-5 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-black px-1 text-[10px] font-bold text-white">
                                {item.count > 99 ? "99+" : item.count}
                            </span>
                        )}
                    </Link>
                );
            })}
        </nav>
    );
}

function HomeIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <path d="M4 11.5 12 4l8 7.5" />
        <path d="M6 10v9a1 1 0 0 0 1 1h3v-6h4v6h3a1 1 0 0 0 1-1v-9" />
        </svg>
    );
}

function CategoryIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" className="h-6 w-6">
        <rect x="3.5" y="3.5" width="7" height="7" rx="1.2" />
        <rect x="13.5" y="3.5" width="7" height="7" rx="1.2" />
        <rect x="3.5" y="13.5" width="7" height="7" rx="1.2" />
        <rect x="13.5" y="13.5" width="7" height="7" rx="1.2" />
        </svg>
    );
}

function HeartIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" className="h-6 w-6">
        <path d="M12 20s-7.5-4.6-7.5-9.4A4.1 4.1 0 0 1 12 7.8a4.1 4.1 0 0 1 7.5 2.8C19.5 15.4 12 20 12 20Z" />
        </svg>
    );
}

function CartIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <path d="M3 5h2.2l1.6 9.4a1.6 1.6 0 0 0 1.6 1.3h7.9a1.6 1.6 0 0 0 1.6-1.2L19.4 8H6.2" />
        <circle cx="9.5" cy="19.5" r="1.3" />
        <circle cx="16.5" cy="19.5" r="1.3" />
        </svg>
    );
}