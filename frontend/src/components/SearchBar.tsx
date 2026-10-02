import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useRecentSearches } from "../hooks/useRecentSearches";
import type { Produit } from "../types/api";

type SearchBarProps = {
    className?: string;
};

export default function SearchBar({ className = "" }: SearchBarProps) {
    const [query, setQuery] = useState("");
    const [ouvert, setOuvert] = useState(false);
    const [suggestions, setSuggestions] = useState<Produit[]>([]);
    const [populaires, setPopulaires] = useState<Produit[]>([]);
    const [chargementSuggestions, setChargementSuggestions] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    const { recherches, ajouter, effacer } = useRecentSearches();

    useEffect(() => {
        function onClickOutside(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOuvert(false);
            }
        }
        document.addEventListener("mousedown", onClickOutside);
        return () => document.removeEventListener("mousedown", onClickOutside);
    }, []);

    // Chargé une fois, pour la section "Produits populaires" quand la recherche est vide
    useEffect(() => {
        api<Produit[]>("/api/produits?mis_en_avant=1&limite=5")
            .then(setPopulaires)
            .catch(() => setPopulaires([]));
    }, []);

    // Suggestions en direct pendant la frappe, avec un léger délai pour éviter un appel par lettre.
    // limite=5 : on ne veut que quelques suggestions, pas une page paginée avec toutes les
    // relations du catalogue — ça doit rester rapide même quand le catalogue grossira.
    useEffect(() => {
        const q = query.trim();
        if (!q) {
            setSuggestions([]);
            return;
        }

        setChargementSuggestions(true);
        const timer = setTimeout(() => {
            api<Produit[]>(`/api/produits?recherche=${encodeURIComponent(q)}&limite=5`)
                .then(setSuggestions)
                .catch(() => setSuggestions([]))
                .finally(() => setChargementSuggestions(false));
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    const lancerRecherche = (terme: string) => {
        const t = terme.trim();
        if (!t) return;
        ajouter(t);
        setOuvert(false);
        setQuery("");
        navigate(`/recherche?q=${encodeURIComponent(t)}`);
    };

    const allerAuProduit = (produit: Produit) => {
        ajouter(produit.nom);
        setOuvert(false);
        setQuery("");
        navigate(`/produit/${produit.slug}`);
    };

    const afficherRecent = query.trim() === "";

    return (
        <div ref={containerRef} className={`relative flex items-center gap-1.5 rounded-lg bg-white pl-3 pr-1 py-1 sm:gap-2 sm:pl-5 sm:pr-1.5 sm:py-1.5 ${className}`}>
            <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setOuvert(true)}
                onKeyDown={(e) => {
                    if (e.key === "Enter") lancerRecherche(query);
                }}
                placeholder="Rechercher un article"
                aria-label="Rechercher un article"
                className="w-full bg-transparent pl-1.2 text-xs text-black placeholder:text-neutral-500 focus:outline-none sm:pl-2 sm:text-sm"
            />
            <button
                type="button"
                onClick={() => lancerRecherche(query)}
                aria-label="Lancer la recherche"
                className="flex h-7 w-9 shrink-0 items-center justify-center rounded-md bg-black text-white transition-colors hover:bg-neutral-800 sm:h-9 sm:w-11 sm:rounded-lg"
            >
                <SearchIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </button>

            {ouvert && (
                <div className="absolute right-0 top-full z-50 mt-2 w-72 max-w-[90vw] max-h-96 overflow-y-auto rounded-md border border-neutral-200 bg-white text-left shadow-lg">
                    {afficherRecent ? (
                        <>
                            {recherches.length > 0 && (
                                <div className="border-b border-neutral-100 p-3">
                                    <div className="mb-2 flex items-center justify-between">
                                        <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                                            Recherches récentes
                                        </span>
                                        <button
                                            type="button"
                                            onClick={effacer}
                                            className="text-xs text-neutral-400 hover:text-black hover:underline"
                                        >
                                            Effacer
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {recherches.map((terme) => (
                                            <button
                                                key={terme}
                                                type="button"
                                                onClick={() => lancerRecherche(terme)}
                                                className="rounded-full border border-neutral-200 px-3 py-1 text-xs text-neutral-700 hover:border-black hover:text-black"
                                            >
                                                {terme}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {populaires.length > 0 && (
                                <div className="p-3">
                                    <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-neutral-500">
                                        Produits populaires
                                    </span>
                                    <div className="flex flex-col gap-1">
                                        {populaires.map((p) => (
                                            <button
                                                key={p.id}
                                                type="button"
                                                onClick={() => allerAuProduit(p)}
                                                className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm text-neutral-800 hover:bg-neutral-100"
                                            >
                                                <SuggestionThumb produit={p} />
                                                <span className="line-clamp-1">{p.nom}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {recherches.length === 0 && populaires.length === 0 && (
                                <p className="p-4 text-center text-xs text-neutral-400">
                                    Commence à taper pour rechercher un article.
                                </p>
                            )}
                        </>
                    ) : chargementSuggestions ? (
                        <p className="p-4 text-center text-xs text-neutral-400">Recherche...</p>
                    ) : suggestions.length > 0 ? (
                        <div className="flex flex-col gap-0.5 p-2">
                            {suggestions.map((p) => (
                                <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => allerAuProduit(p)}
                                    className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm text-neutral-800 hover:bg-neutral-100"
                                >
                                    <SuggestionThumb produit={p} />
                                    <span className="line-clamp-1">{p.nom}</span>
                                </button>
                            ))}
                            <button
                                type="button"
                                onClick={() => lancerRecherche(query)}
                                className="mt-1 rounded-sm px-2 py-1.5 text-left text-xs font-semibold text-neutral-600 hover:bg-neutral-100"
                            >
                                Voir tous les résultats pour "{query}"
                            </button>
                        </div>
                    ) : (
                        <p className="p-4 text-center text-xs text-neutral-400">
                            Aucun article ne correspond à "{query}".
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}

function SuggestionThumb({ produit }: { produit: Produit }) {
    const url = produit.images?.[0]?.url;
    if (!url) {
        return <span className="h-8 w-8 shrink-0 rounded-sm bg-neutral-100" />;
    }
    return <img src={url} alt="" className="h-8 w-8 shrink-0 rounded-sm object-cover" />;
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