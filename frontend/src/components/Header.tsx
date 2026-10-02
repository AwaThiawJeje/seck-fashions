import { Link } from "react-router-dom";
import SearchBar from "./SearchBar";

type HeaderVariant = "default" | "product";

type HeaderProps = {
    variant?: HeaderVariant;
    favoritesCount?: number;
    cartCount?: number;
    onBack?: () => void;
};

export default function Header({
    variant = "default",
    favoritesCount = 0,
    cartCount = 0,
    onBack,
}: HeaderProps) {
    return (
        <header className="sticky top-0 z-50 w-full bg-black text-white">
            <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
                {variant === "product" && (
                    <button
                        type="button"
                        onClick={onBack}
                        aria-label="Retour"
                        className="-ml-2 rounded-full p-2 transition-colors hover:bg-white/10 md:hidden"
                    >
                        <BackIcon />
                    </button>
                )}

                <a
                    href="/"
                    className="shrink-0 text-base font-bold tracking-[0.2em] sm:text-2xl sm:tracking-[0.25em]"
                >
                    SECK FASHIONS
                </a>

                <div className="hidden flex-1 items-center justify-center gap-6 md:flex">
                    <nav className="flex shrink-0 items-center gap-5 text-sm font-medium text-white/90">
                        <Link to="/" className="transition-colors hover:text-white">
                            Accueil
                        </Link>
                        <Link to="/categories/chaussures" className="transition-colors hover:text-white">
                            Catégories
                        </Link>
                    </nav>

                    <SearchBar className="max-w-md" />
                </div>

                {variant === "default" && (
                    <div className="ml-auto mr-1 shrink-0 md:hidden">
                        <SearchBar className="w-28 sm:w-60" />
                    </div>
                )}

                <div className="ml-auto hidden items-center gap-1 md:flex">
                    <IconLink
                        href="/favoris"
                        label={`Favoris, ${favoritesCount} article(s)`}
                        count={favoritesCount}
                    >
                        <HeartIcon />
                    </IconLink>

                    <IconLink
                        href="/panier"
                        label={`Panier, ${cartCount} article(s)`}
                        count={cartCount}
                    >
                        <CartIcon />
                    </IconLink>
                </div>

                {variant === "product" && (
                    <div className="ml-auto md:hidden">
                        <IconLink
                            href="/panier"
                            label={`Panier, ${cartCount} article(s)`}
                            count={cartCount}
                        >
                            <CartIcon />
                        </IconLink>
                    </div>
                )}
            </div>
        </header>
    );
}

function IconLink({
    href,
    label,
    count,
    children,
}: {
    href: string;
    label: string;
    count: number;
    children: React.ReactNode;
}) {
    return (
        <a href={href}
            aria-label={label}
            className="relative rounded-full p-2 transition-colors hover:bg-white/10"
        >
            {children}
            {count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-white px-1 text-[10px] font-bold text-black">
                {count > 99 ? "99+" : count}
                </span>
            )}
        </a>
    );
}

function HeartIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
            strokeLinejoin="round" className="h-6 w-6">
        <path d="M12 20s-7.5-4.6-7.5-9.4A4.1 4.1 0 0 1 12 7.8a4.1 4.1 0 0 1 7.5 2.8C19.5 15.4 12 20 12 20Z" />
        </svg>
    );
}

function CartIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
            strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <path d="M3 5h2.2l1.6 9.4a1.6 1.6 0 0 0 1.6 1.3h7.9a1.6 1.6 0 0 0 1.6-1.2L19.4 8H6.2" />
        <circle cx="9.5" cy="19.5" r="1.3" />
        <circle cx="16.5" cy="19.5" r="1.3" />
        </svg>
    );
}

function BackIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <path d="M15 18l-6-6 6-6" />
        </svg>
    );
}