import { useCallback, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useListePaginee } from "../../hooks/useListePaginee";
import { api } from "../../lib/api";
import { extraireMessageErreur } from "../../lib/crud";
import ListShell from "../../components/crud/ListShell";
import ConfirmDeleteModal from "../../components/crud/ConfirmDeleteModal";
import Etoiles from "../../components/Etoiles";
import type { AdminOutletContext } from "../../components/admin/outletContext";
import type { Avis } from "../../types/api";

const ONGLETS = [
    { valeur: "0", label: "En attente", vide: "Aucun avis en attente de modération." },
    { valeur: "1", label: "Validés", vide: "Aucun avis validé pour le moment." },
    { valeur: "", label: "Tous", vide: "Aucun avis pour le moment." },
];

function formatDate(iso?: string) {
    if (!iso) return "";
    return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

export default function AvisPage() {
    const { rafraichirAvisEnAttente } = useOutletContext<AdminOutletContext>();
    const [onglet, setOnglet] = useState("0");
    const [avisASupprimer, setAvisASupprimer] = useState<Avis | null>(null);
    const [suppressionEnCours, setSuppressionEnCours] = useState(false);
    const [erreurSuppression, setErreurSuppression] = useState<string | null>(null);
    const [idEnValidation, setIdEnValidation] = useState<number | null>(null);

    const construireUrl = useCallback(
        (page: number) => `/api/admin/avis?page=${page}${onglet !== "" ? `&valide=${onglet}` : ""}`,
        [onglet]
    );

    const { elements: avis, loading, error, refetch, aPlusDeResultats, voirPlus, chargementSuite, erreurSuite } =
        useListePaginee<Avis>(construireUrl);

    const ongletActif = ONGLETS.find((o) => o.valeur === onglet) ?? ONGLETS[0];

    const valider = async (a: Avis) => {
        setIdEnValidation(a.id);
        try {
            await api(`/api/admin/avis/${a.id}/valider`, { method: "PUT" });
            refetch();
            rafraichirAvisEnAttente();
        } finally {
            setIdEnValidation(null);
        }
    };

    const confirmerSuppression = async () => {
        if (!avisASupprimer) return;
        setSuppressionEnCours(true);
        setErreurSuppression(null);
        try {
            await api(`/api/admin/avis/${avisASupprimer.id}`, { method: "DELETE" });
            setAvisASupprimer(null);
            refetch();
            rafraichirAvisEnAttente();
        } catch (err) {
            setErreurSuppression(extraireMessageErreur(err));
        } finally {
            setSuppressionEnCours(false);
        }
    };

    return (
        <>
            <ListShell
                titre="Avis clients"
                entete={
                    <div className="flex flex-wrap gap-1.5">
                        {ONGLETS.map((o) => (
                            <button
                                key={o.valeur}
                                type="button"
                                onClick={() => setOnglet(o.valeur)}
                                className={`rounded-sm px-3 py-1.5 text-xs font-semibold transition-colors ${
                                    onglet === o.valeur
                                        ? "bg-black text-white"
                                        : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                                }`}
                            >
                                {o.label}
                            </button>
                        ))}
                    </div>
                }
                loading={loading}
                error={error}
                estVide={avis.length === 0}
                messageVide={ongletActif.vide}
            >
                <div className="flex flex-col gap-2">
                    {avis.map((a) => (
                        <div key={a.id} className="rounded-md border border-neutral-200 p-3">
                            <div className="flex flex-wrap items-start justify-between gap-2">
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-sm font-bold text-black">{a.produit?.nom}</span>
                                        <span
                                            className={`rounded-sm px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                                                a.valide ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                                            }`}
                                        >
                                            {a.valide ? "Validé" : "En attente"}
                                        </span>
                                    </div>
                                    <p className="mt-0.5 text-xs text-neutral-500">
                                        {a.user?.name ?? "Client"} · {formatDate(a.created_at)}
                                    </p>
                                    <Etoiles valeur={a.note} />
                                    {a.commentaire && <p className="mt-1 text-sm text-neutral-700">{a.commentaire}</p>}
                                </div>

                                <div className="flex shrink-0 items-center gap-1">
                                    {!a.valide && (
                                        <button
                                            type="button"
                                            onClick={() => valider(a)}
                                            disabled={idEnValidation === a.id}
                                            className="rounded-sm bg-green-600 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-neutral-300"
                                        >
                                            {idEnValidation === a.id ? "..." : "Valider"}
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => setAvisASupprimer(a)}
                                        className="rounded-sm border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                                    >
                                        Supprimer
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {aPlusDeResultats && (
                    <button
                        type="button"
                        onClick={voirPlus}
                        disabled={chargementSuite}
                        className="mt-3 w-full rounded-sm border border-neutral-300 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-50"
                    >
                        {chargementSuite ? "Chargement..." : erreurSuite ? "Réessayer" : "Voir plus"}
                    </button>
                )}
            </ListShell>

            <ConfirmDeleteModal
                open={avisASupprimer !== null}
                onClose={() => { setAvisASupprimer(null); setErreurSuppression(null); }}
                onConfirm={confirmerSuppression}
                envoiEnCours={suppressionEnCours}
                erreur={erreurSuppression}
                message={
                    avisASupprimer && (
                        <>
                            Supprimer l'avis de <span className="font-semibold">{avisASupprimer.user?.name ?? "ce client"}</span> sur{" "}
                            <span className="font-semibold">{avisASupprimer.produit?.nom}</span> ?
                        </>
                    )
                }
            />
        </>
    );
}
