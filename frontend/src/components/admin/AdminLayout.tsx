import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const liens = [
    { to: "/admin", label: "Tableau de bord", end: true },
    { to: "/admin/produits", label: "Produits", end: false },
    { to: "/admin/categories", label: "Catégories", end: false },
    { to: "/admin/commandes", label: "Commandes", end: false },
];

export default function AdminLayout() {
    const { user, logout } = useAuth();

    return (
        <div className="flex min-h-screen">
            <aside className="w-56 shrink-0 border-r border-neutral-200 bg-black text-white">
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
                                `rounded-sm px-3 py-2 text-sm transition-colors ${
                                    isActive ? "bg-white text-black font-semibold" : "text-white/80 hover:bg-white/10"
                                }`
                            }
                        >
                            {lien.label}
                        </NavLink>
                    ))}
                </nav>
            </aside>

            <div className="flex-1">
                <header className="flex items-center justify-between border-b border-neutral-200 px-6 py-3">
                    <span className="text-sm text-neutral-500">
                        Connecté en tant que <span className="font-semibold text-black">{user?.name}</span>
                    </span>
                    <button
                        type="button"
                        onClick={logout}
                        className="text-xs font-semibold text-neutral-500 hover:text-black hover:underline"
                    >
                        Se déconnecter
                    </button>
                </header>

                <main className="p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}