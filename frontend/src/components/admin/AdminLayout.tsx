import { useCallback, useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../lib/api";
import type { Avis, Commande, Page } from "../../types/api";
import type { AdminOutletContext } from "./outletContext";
import Modal from "../Modal";

const liens = [
    { to: "/admin", label: "Tableau de bord", end: true, icon: <DashboardIcon /> },
    { to: "/admin/produits", label: "Produits", end: false, icon: <ProduitsIcon /> },
    { to: "/admin/categories", label: "Catégories", end: false, icon: <CategoriesIcon /> },
    { to: "/admin/commandes", label: "Commandes", end: false, icon: <CommandesIcon /> },
    { to: "/admin/avis", label: "Avis", end: false, icon: <AvisIcon /> },
];

export default function AdminLayout() {
    const { user, logout } = useAuth();
    const [confirmationOuverte, setConfirmationOuverte] = useState(false);
    const [commandesAValider, setCommandesAValider] = useState(0);
    const [avisEnAttente, setAvisEnAttente] = useState(0);

    const rafraichirCommandesAValider = useCallback(() => {
        api<Page<Commande>>("/api/commandes?statut=en_attente")
            .then((page) => setCommandesAValider(page.total))
            .catch(() => setCommandesAValider(0));
    }, []);

    const rafraichirAvisEnAttente = useCallback(() => {
        api<Page<Avis>>("/api/admin/avis?valide=0")
            .then((page) => setAvisEnAttente(page.total))
            .catch(() => setAvisEnAttente(0));
    }, []);

    useEffect(() => {
        rafraichirCommandesAValider();
        rafraichirAvisEnAttente();
    }, [rafraichirCommandesAValider, rafraichirAvisEnAttente]);

    const pastilles: Record<string, number> = {
        "/admin/commandes": commandesAValider,
        "/admin/avis": avisEnAttente,
    };

    return (
        <div className="flex min-h-screen">
            {/* Desktop : sidebar fixe à gauche — lg: (1024px) et non md:, pour laisser
                assez de place au contenu (lignes produits, boutons...) qui ne supporte
                pas d'être compressé entre 768 et 1024px. */}
            <aside className="hidden w-56 shrink-0 border-r border-neutral-200 bg-black text-white lg:block">
                <div className="px-4 py-5 text-sm font-bold tracking-[0.2em]">
                    SECK FASHIONS
                </div>
                <nav className="flex flex-col gap-0.5 px-2">
                    {liens.map((lien) => (
                        <NavLink
                            key={lien.to}
                            to={lien.to}
                            end={lien.end}
                            className={({ isActive }) =>
                                `relative flex items-center justify-between rounded-sm px-3 py-2 text-sm transition-colors ${
                                    isActive ? "bg-white text-black font-semibold" : "text-white/80 hover:bg-white/10"
                                }`
                            }
                        >
                            {lien.label}
                            {!!pastilles[lien.to] && (
                                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-bold text-white">
                                    {pastilles[lien.to] > 99 ? "99+" : pastilles[lien.to]}
                                </span>
                            )}
                        </NavLink>
                    ))}
                </nav>
            </aside>

            <div className="flex-1">
                <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-neutral-200 bg-white px-4 lg:px-6">
                    <span className="text-sm font-bold tracking-[0.15em] lg:hidden">SECK FASHIONS</span>
                    <span className="hidden text-sm text-neutral-500 lg:inline">
                        Connecté en tant que <span className="font-semibold text-black">{user?.name}</span>
                    </span>
                    <button
                        type="button"
                        onClick={() => setConfirmationOuverte(true)}
                        className="text-xs font-semibold text-neutral-500 hover:text-black hover:underline"
                    >
                        Se déconnecter
                    </button>
                </header>

                <main className="p-4 pb-24 lg:p-6 lg:pb-6">
                    <Outlet context={{ rafraichirCommandesAValider, rafraichirAvisEnAttente } satisfies AdminOutletContext} />
                </main>
            </div>

            {/* Mobile/tablette : barre de navigation fixée en bas */}
            <nav className="fixed inset-x-0 bottom-0 z-50 flex h-16 border-t border-neutral-200 bg-white lg:hidden">
                {liens.map((lien) => (
                    <NavLink
                        key={lien.to}
                        to={lien.to}
                        end={lien.end}
                        className="relative flex flex-1 flex-col items-center justify-center gap-0.5"
                    >
                        {({ isActive }) => (
                            <>
                                <span className={isActive ? "text-black" : "text-neutral-400"}>{lien.icon}</span>
                                <span className={`text-[11px] ${isActive ? "font-semibold text-black" : "text-neutral-400"}`}>
                                    {lien.label}
                                </span>
                                {!!pastilles[lien.to] && (
                                    <span className="absolute right-5 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-bold text-white">
                                        {pastilles[lien.to] > 99 ? "99+" : pastilles[lien.to]}
                                    </span>
                                )}
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            <Modal open={confirmationOuverte} onClose={() => setConfirmationOuverte(false)}>
                <p className="mb-4 text-sm text-neutral-800">
                    Tu vas être déconnecté de l'administration.
                </p>
                <div className="flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={() => setConfirmationOuverte(false)}
                        className="rounded-sm bg-black px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-neutral-800"
                    >
                        Annuler
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setConfirmationOuverte(false);
                            logout();
                        }}
                        className="rounded-sm border border-black bg-white px-3 py-1.5 text-xs font-semibold text-black transition-colors hover:bg-neutral-50"
                    >
                        Se déconnecter
                    </button>
                </div>
            </Modal>
        </div>
    );
}

function DashboardIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
            <path d="M4 11.5 12 4l8 7.5" />
            <path d="M6 10v9a1 1 0 0 0 1 1h3v-6h4v6h3a1 1 0 0 0 1-1v-9" />
        </svg>
    );
}

function ProduitsIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
            <path d="M20.5 7.3 12 12l-8.5-4.7" />
            <path d="M12 22V12" />
            <path d="m3.3 7 8.2-4.5a1 1 0 0 1 1 0L20.7 7a1 1 0 0 1 .5.9v8.3a1 1 0 0 1-.5.9l-8.2 4.5a1 1 0 0 1-1 0L3.3 17a1 1 0 0 1-.5-.9V7.8a1 1 0 0 1 .5-.9Z" />
        </svg>
    );
}

function CategoriesIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" className="h-6 w-6">
            <rect x="3.5" y="3.5" width="7" height="7" rx="1.2" />
            <rect x="13.5" y="3.5" width="7" height="7" rx="1.2" />
            <rect x="3.5" y="13.5" width="7" height="7" rx="1.2" />
            <rect x="13.5" y="13.5" width="7" height="7" rx="1.2" />
        </svg>
    );
}

function CommandesIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
            <path d="M6 2h9l3 3v17H6z" />
            <path d="M15 2v3h3" />
            <path d="M9 11h6" />
            <path d="M9 15h6" />
        </svg>
    );
}

function AvisIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
            <path d="M12 2.5l2.9 6.2 6.6.7-4.9 4.6 1.3 6.6L12 17.5l-5.9 3.1 1.3-6.6-4.9-4.6 6.6-.7L12 2.5z" />
        </svg>
    );
}
