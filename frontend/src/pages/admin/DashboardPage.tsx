import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../lib/api";

type TableauDeBord = {
    commandes_a_valider: number;
    commandes_a_livrer: number;
    commandes_en_livraison: number;
    produits_epuises: { id: number; nom: string; slug: string }[];
};

const INTERVALLE = 30_000;
const NOMS_AFFICHES = 6;

export default function DashboardPage() {
    const [donnees, setDonnees] = useState<TableauDeBord | null>(null);
    const [error, setError] = useState<string | null>(null);

    const charger = useCallback(() => {
        api<TableauDeBord>("/api/tableau-de-bord")
            .then((d) => {
                setDonnees(d);
                setError(null);
            })
            .catch((err) => setError(err instanceof Error ? err.message : "Erreur de chargement."));
    }, []);

    useEffect(() => {
        charger();
        const timer = setInterval(charger, INTERVALLE);

        const auRetourSurLOnglet = () => {
            if (document.visibilityState === "visible") charger();
        };
        document.addEventListener("visibilitychange", auRetourSurLOnglet);

        return () => {
            clearInterval(timer);
            document.removeEventListener("visibilitychange", auRetourSurLOnglet);
        };
    }, [charger]);

    if (!donnees) {
        return (
            <div>
                <h1 className="mb-4 text-lg font-bold uppercase tracking-wide">Tableau de bord</h1>
                {error ? (
                    <p className="text-sm text-red-600">{error}</p>
                ) : (
                    <p className="text-sm text-neutral-500">Chargement...</p>
                )}
            </div>
        );
    }

    const epuises = donnees.produits_epuises;
    const toutEstAJour =
        donnees.commandes_a_valider + donnees.commandes_a_livrer + donnees.commandes_en_livraison === 0 &&
        epuises.length === 0;

    return (
        <div>
            <h1 className="mb-4 text-lg font-bold uppercase tracking-wide">Tableau de bord</h1>

            {toutEstAJour && (
                <p className="mb-4 rounded-sm bg-green-50 px-3 py-2 text-sm font-semibold text-green-700">
                    Rien à traiter pour le moment.
                </p>
            )}

            <div className="mb-6 grid gap-3 sm:grid-cols-3">
                <CarteCommandes
                    nombre={donnees.commandes_a_valider}
                    libelle="À valider"
                    to="/admin/commandes?onglet=en_attente"
                    urgent
                />
                <CarteCommandes
                    nombre={donnees.commandes_a_livrer}
                    libelle="À livrer"
                    to="/admin/commandes?onglet=confirmee"
                />
                <CarteCommandes
                    nombre={donnees.commandes_en_livraison}
                    libelle="En livraison"
                    to="/admin/commandes?onglet=expediee"
                />
            </div>

            <div className="rounded-md border border-neutral-200 p-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                    <h2 className="text-sm font-bold uppercase tracking-wide">
                        Produits épuisés
                        {epuises.length > 0 && (
                            <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-600">
                                {epuises.length}
                            </span>
                        )}
                    </h2>
                    {epuises.length > 0 && (
                        <Link
                            to="/admin/produits?etat=epuise"
                            className="text-xs font-semibold text-neutral-500 hover:text-black hover:underline"
                        >
                            Voir la liste
                        </Link>
                    )}
                </div>

                {epuises.length === 0 ? (
                    <p className="text-sm text-neutral-500">Aucun produit épuisé.</p>
                ) : (
                    <ul className="flex flex-col gap-1">
                        {epuises.slice(0, NOMS_AFFICHES).map((p) => (
                            <li key={p.id} className="truncate text-sm text-neutral-800">
                                {p.nom}
                            </li>
                        ))}
                        {epuises.length > NOMS_AFFICHES && (
                            <li className="text-xs text-neutral-400">
                                et {epuises.length - NOMS_AFFICHES} autre{epuises.length - NOMS_AFFICHES > 1 ? "s" : ""}
                            </li>
                        )}
                    </ul>
                )}
            </div>
        </div>
    );
}

function CarteCommandes({
    nombre,
    libelle,
    to,
    urgent = false,
}: {
    nombre: number;
    libelle: string;
    to: string;
    urgent?: boolean;
}) {
    const aTraiter = nombre > 0;
    const classeCadre = aTraiter && urgent ? "border-orange-300 bg-orange-50" : "border-neutral-200 hover:border-black";
    const classeNombre = aTraiter && urgent ? "text-orange-600" : aTraiter ? "text-black" : "text-neutral-300";

    return (
        <Link to={to} className={`block rounded-md border p-4 transition-colors ${classeCadre}`}>
            <p className={`text-3xl font-bold ${classeNombre}`}>{nombre}</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-neutral-600">{libelle}</p>
        </Link>
    );
}