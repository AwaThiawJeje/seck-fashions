/* ---------- Header.tsx ---------- */
import { useState } from "react";
import { Link } from "react-router-dom";

type HeaderVariant = "default" | "product";

type HeaderProps = {
    variant?: HeaderVariant;
    favoritesCount?: number;
    cartCount?: number;
    onSearch?: (query: string) => void;
    onBack?: () => void;
};

export default function Header({
    variant = "default",
    favoritesCount = 0,
    cartCount = 0,
    onSearch,
    onBack,
}: HeaderProps) {
    const [query, setQuery] = useState("");

    const submit = () => {
        const q = query.trim();
        if (q) onSearch?.(q);
    };

    return (
        <header className="w-full bg-black text-white">
            <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
                {/* Bouton retour — mobile, fiche produit uniquement */}
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

                {/* Nom de l'entreprise */}
                <a 
                    href="/"
                    className="shrink-0 text-base font-bold tracking-[0.2em] sm:text-2xl sm:tracking-[0.25em]"
                >
                    SECK FASHIONS
                </a>

                {/* Centre — desktop : Accueil, Catégories, recherche */}
                <div className="hidden flex-1 items-center justify-center gap-6 md:flex">
                    <nav className="flex shrink-0 items-center gap-5 text-sm font-medium text-white/90">
                        <Link to="/" className="transition-colors hover:text-white">
                            Accueil
                        </Link>
                        <Link to="/categories/chaussures" className="transition-colors hover:text-white">
                            Catégories
                        </Link>
                    </nav>

                    <SearchBar
                        query={query}
                        setQuery={setQuery}
                        submit={submit}
                        className="max-w-md"
                    />
                </div>

                {/* Mobile — recherche seule (variant default) */}
                {variant === "default" && (
                    <div className="ml-auto mr-1 shrink-0 md:hidden">
    <SearchBar query={query} setQuery={setQuery} submit={submit} />
</div>
                )}

                {/* Droite : favoris + panier — desktop uniquement */}
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

                {/* Mobile — panier seul, fiche produit uniquement */}
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

/* ---------- Recherche ---------- */

type SearchBarProps = {
    query: string;
    setQuery: (v: string) => void;
    submit: () => void;
    className?: string;
};

function SearchBar({ query, setQuery, submit, className = "" }: SearchBarProps) {
    return (
        <div className={`flex w-28 items-center gap-1.5 rounded-lg bg-white pl-3 pr-1 py-1 sm:gap-2 sm:pl-5 sm:pr-1.5 sm:py-1.5 sm:w-60 md:w-60 lg:w-96 ${className}`}>
            <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                if (e.key === "Enter") submit();
                }}
                placeholder="Rechercher un article"
                aria-label="Rechercher un article"
                className="w-full bg-transparent pl-1.2 text-xs text-black placeholder:text-neutral-500 focus:outline-none sm:pl-2 sm:text-sm"
            />
            <button
                type="button"
                onClick={submit}
                aria-label="Lancer la recherche"
                className="flex h-7 w-9 shrink-0 items-center justify-center rounded-md bg-black text-white transition-colors hover:bg-neutral-800 sm:h-9 sm:w-11 sm:rounded-lg"
            >
                <SearchIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </button>
        </div>
    );
}

/* ---------- Icônes ---------- */

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

function SearchIcon({ className = "h-5 w-5" }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" className={className}>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
        </svg>
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