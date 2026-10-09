import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useCommandesAdmin } from "../../hooks/useCommandesAdmin";
import { useProduits } from "../../hooks/useProduits";
import { api } from "../../lib/api";
import { extraireMessageErreur } from "../../lib/crud";
import ListShell from "../../components/crud/ListShell";
import FormModal from "../../components/crud/FormModal";
import ConfirmDeleteModal from "../../components/crud/ConfirmDeleteModal";
import RowActions from "../../components/crud/RowActions";
import Modal from "../../components/Modal";
import { TextField, SelectField, TextareaField } from "../../components/crud/fields";
import type { Commande, Declinaison, Livraison, Produit, StatutCommande } from "../../types/api";
import { useOutletContext, useSearchParams } from "react-router-dom";
import type { AdminOutletContext } from "../../components/admin/outletContext";
import BoutonVoirPlus from "../../components/BoutonVoirPlus";

type StatutLivraison = Livraison["statut"];
type MethodePaiement = Commande["methode_paiement"];

const STATUTS: Record<StatutCommande, { label: string; classe: string }> = {
    en_attente: { label: "À valider", classe: "bg-orange-100 text-orange-700" },
    confirmee: { label: "À livrer", classe: "bg-blue-100 text-blue-700" },
    expediee: { label: "En livraison", classe: "bg-purple-100 text-purple-700" },
    livree: { label: "Livrée", classe: "bg-green-100 text-green-700" },
    annulee: { label: "Annulée", classe: "bg-neutral-200 text-neutral-600" },
};

const ONGLETS: { valeur: string; label: string; vide: string }[] = [
    { valeur: "en_attente", label: "À valider", vide: "Aucune commande à valider pour le moment." },
    { valeur: "confirmee", label: "À livrer", vide: "Aucune commande à livrer." },
    { valeur: "expediee", label: "En livraison", vide: "Aucune livraison en cours." },
    { valeur: "livree", label: "Livrées", vide: "Aucune commande livrée." },
    { valeur: "annulee", label: "Annulées", vide: "Aucune commande annulée." },
    { valeur: "", label: "Toutes", vide: "Aucune commande pour le moment." },
];

const PAIEMENTS: Record<MethodePaiement, string> = {
    paiement_livraison: "Paiement à la livraison",
    wave: "Wave",
    orange_money: "Orange Money",
};

function formatPrice(value: string | number) {
    return `${Number(value).toLocaleString("fr-FR")} FCFA`;
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleString("fr-FR", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function prixUnitaire(produit: Produit): number {
    return produit.en_promotion ? Number(produit.prix_promo) : Number(produit.prix);
}

type ActionSuivante =
    | { type: "valider"; libelle: string }
    | { type: "livraison"; libelle: string; statutCible: "en_cours" | "livree" };

function actionSuivante(commande: Commande): ActionSuivante | null {
    switch (commande.statut) {
        case "en_attente":
            return { type: "valider", libelle: "Valider" };
        case "confirmee":
            return { type: "livraison", libelle: "Mettre en livraison", statutCible: "en_cours" };
        case "expediee":
            return { type: "livraison", libelle: "Marquer comme livrée", statutCible: "livree" };
        default:
            return null;
    }
}

type Modale =
    | { type: "details"; commande: Commande }
    | { type: "livraison"; commande: Commande; statutCible: StatutLivraison | null }
    | { type: "nouvelle" };

type Confirmation =
    | { type: "valider"; commande: Commande }
    | { type: "annuler"; commande: Commande }
    | { type: "livraison"; commande: Commande; statutCible: "en_cours" | "livree" };

function decrireConfirmation(c: Confirmation) {
    const numero = <span className="font-semibold">N° {c.commande.numero}</span>;

    switch (c.type) {
        case "valider":
            return {
                message: <>Valider la commande {numero} ?</>,
                libelle: "Valider",
                libelleRefus: "Annuler",
                variante: "succes" as const,
            };
        case "annuler":
            return {
                message: <>Annuler la commande {numero} ? Cette action est définitive.</>,
                libelle: "Oui, annuler la commande",
                libelleRefus: "Non, la garder",
                variante: "neutre" as const,
            };
        case "livraison":
            return c.statutCible === "en_cours"
                ? {
                      message: <>Mettre la commande {numero} en livraison ?</>,
                      libelle: "Mettre en livraison",
                      libelleRefus: "Annuler",
                      variante: "succes" as const,
                  }
                : {
                      message: <>Marquer la commande {numero} comme livrée ?</>,
                      libelle: "Marquer comme livrée",
                      libelleRefus: "Annuler",
                      variante: "succes" as const,
                  };
    }
}

export default function CommandesPage() {
    const [searchParams] = useSearchParams();
    const ongletDemande = searchParams.get("onglet");
    const [onglet, setOnglet] = useState(
        ONGLETS.some((o) => o.valeur === ongletDemande) ? (ongletDemande as string) : "en_attente"
    );
    const { rafraichirCommandesAValider } = useOutletContext<AdminOutletContext>();
    const {
        commandes,
        total,
        loading,
        error,
        refetch: recharger,
        aPlusDeResultats,
        voirPlus,
        chargementSuite,
        erreurSuite,
    } = useCommandesAdmin(onglet || undefined);

    // Numéro purement visuel, propre à cet onglet : la plus récente commande du
    // filtre affiché porte le plus grand numéro, pour rester consécutif (1, 2, 3...)
    // même quand le numéro "réel" (stable, utilisé dans Mes commandes / WhatsApp)
    // saute des valeurs à cause des commandes d'un autre statut.
    const avecNumeroAffiche = (commande: Commande, index: number): Commande => ({
        ...commande,
        numero: total - index,
    });

    // Recharge la liste ET la pastille du menu après chaque action.
    const refetch = () => {
        recharger();
        rafraichirCommandesAValider();
    };

    // Une commande qui arrive pendant qu'il est sur la page apparaît toute seule.
    useEffect(() => {
        const timer = setInterval(recharger, 30_000);
        return () => clearInterval(timer);
    }, [recharger]);

    const [modale, setModale] = useState<Modale | null>(null);
    const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
    const [actionEnCours, setActionEnCours] = useState(false);
    const [erreurAction, setErreurAction] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);

    // Arrivée depuis le lien "Lien de gestion" du message WhatsApp : ouvre
    // directement le détail de cette commande, quel que soit son statut.
    const idDepuisLien = searchParams.get("commande");
    useEffect(() => {
        if (!idDepuisLien) return;
        api<Commande>(`/api/commandes/${idDepuisLien}`)
            .then((commande) => setModale({ type: "details", commande }))
            .catch(() => setErreurAction("Commande introuvable."));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [idDepuisLien]);

    useEffect(() => {
        if (!notice) return;
        const timer = setTimeout(() => setNotice(null), 3500);
        return () => clearTimeout(timer);
    }, [notice]);

    const ongletActif = ONGLETS.find((o) => o.valeur === onglet) ?? ONGLETS[0];

    const demanderConfirmation = (c: Confirmation) => {
        setModale(null);
        setErreurAction(null);
        setConfirmation(c);
    };

    const lancerActionSuivante = (commande: Commande) => {
        const action = actionSuivante(commande);
        if (!action) return;

        if (action.type === "valider") {
            demanderConfirmation({ type: "valider", commande });
        } else if (commande.livraison) {
            demanderConfirmation({ type: "livraison", commande, statutCible: action.statutCible });
        } else {
            // Pas encore de coordonnées : on les demande avant d'avancer.
            setModale({ type: "livraison", commande, statutCible: action.statutCible });
        }
    };

    const executerConfirmation = async () => {
        if (!confirmation) return;
        const { commande } = confirmation;

        setActionEnCours(true);
        setErreurAction(null);

        try {
            let message: string;

            if (confirmation.type === "valider") {
                await api(`/api/commandes/${commande.id}/valider`, { method: "PUT" });
                message = `Commande N° ${commande.numero} validée.`;
            } else if (confirmation.type === "annuler") {
                await api(`/api/commandes/${commande.id}/annuler`, { method: "PUT" });
                message = `Commande N° ${commande.numero} annulée.`;
            } else {
                const liv = commande.livraison;
                if (!liv) throw new Error("Coordonnées manquantes.");
                await api(`/api/commandes/${commande.id}/livraison`, {
                    method: "PUT",
                    body: {
                        nom_complet: liv.nom_complet,
                        telephone: liv.telephone,
                        adresse: liv.adresse,
                        ville: liv.ville,
                        statut: confirmation.statutCible,
                    },
                });
                message =
                    confirmation.statutCible === "en_cours"
                        ? `Commande N° ${commande.numero} mise en livraison.`
                        : `Commande N° ${commande.numero} marquée comme livrée.`;
            }

            setConfirmation(null);
            setNotice(message);
            refetch();
        } catch (err) {
            setErreurAction(extraireMessageErreur(err));
        } finally {
            setActionEnCours(false);
        }
    };

    const infosConfirmation = confirmation ? decrireConfirmation(confirmation) : null;

    return (
        <>
            <ListShell
                titre="Commandes"
                libelleNouveau="+ Nouvelle commande"
                onNouveau={() => setModale({ type: "nouvelle" })}
                entete={
                    <>
                        {notice && (
                            <p className="mb-3 rounded-sm bg-green-50 px-3 py-2 text-xs font-semibold text-green-700">
                                {notice}
                            </p>
                        )}
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
                    </>
                }
                loading={loading}
                error={error}
                estVide={commandes.length === 0}
                messageVide={ongletActif.vide}
            >
                <div className="flex flex-col gap-2">
                    {commandes.map((commande, index) => {
                        const commandeAffichee = avecNumeroAffiche(commande, index);
                        return (
                            <CarteCommande
                                key={commande.id}
                                commande={commandeAffichee}
                                onDetails={() => setModale({ type: "details", commande: commandeAffichee })}
                                onActionSuivante={() => lancerActionSuivante(commandeAffichee)}
                                onCoordonnees={() => setModale({ type: "livraison", commande: commandeAffichee, statutCible: null })}
                                onAnnuler={() => demanderConfirmation({ type: "annuler", commande: commandeAffichee })}
                            />
                        );
                    })}
                </div>
                <BoutonVoirPlus
                    visible={aPlusDeResultats}
                    chargement={chargementSuite}
                    erreur={erreurSuite}
                    onClick={voirPlus}
                />
            </ListShell>

            {modale?.type === "details" && (
                <DetailCommandeModal
                    commande={modale.commande}
                    onClose={() => setModale(null)}
                    onActionSuivante={() => lancerActionSuivante(modale.commande)}
                    onCoordonnees={() =>
                        setModale({ type: "livraison", commande: modale.commande, statutCible: null })
                    }
                    onAnnuler={() => demanderConfirmation({ type: "annuler", commande: modale.commande })}
                />
            )}

            {modale?.type === "livraison" && (
                <LivraisonModal
                    commande={modale.commande}
                    statutCible={modale.statutCible}
                    onClose={() => setModale(null)}
                    onSuccess={(message) => {
                        setModale(null);
                        setNotice(message);
                        refetch();
                    }}
                />
            )}

            {modale?.type === "nouvelle" && (
                <NouvelleCommandeModal
                    onClose={() => setModale(null)}
                    onSuccess={(numero) => {
                        setModale(null);
                        setNotice(`Commande N° ${numero} créée.`);
                        // Affiche l'onglet où la nouvelle commande apparaît.
                        if (onglet !== "en_attente") setOnglet("en_attente");
                        else refetch();
                    }}
                />
            )}

            <ConfirmDeleteModal
                open={confirmation !== null}
                onClose={() => setConfirmation(null)}
                onConfirm={executerConfirmation}
                envoiEnCours={actionEnCours}
                erreur={erreurAction}
                message={infosConfirmation?.message}
                libelleConfirm={infosConfirmation?.libelle}
                libelleRefus={infosConfirmation?.libelleRefus}
                variante={infosConfirmation?.variante}
            />
        </>
    );
}

function CarteCommande({
    commande,
    onDetails,
    onActionSuivante,
    onCoordonnees,
    onAnnuler,
}: {
    commande: Commande;
    onDetails: () => void;
    onActionSuivante: () => void;
    onCoordonnees: () => void;
    onAnnuler: () => void;
}) {
    const statut = STATUTS[commande.statut];
    const action = actionSuivante(commande);
    const liv = commande.livraison;

    const nomClient = liv?.nom_complet ?? commande.user?.name ?? "Client WhatsApp";
    const contact = [nomClient, liv?.telephone].filter(Boolean).join(" · ");
    const resume = (commande.lignes ?? []).map((l) => `${l.nom_produit} ×${l.quantite}`).join(", ");

    const peutAnnuler = commande.statut !== "annulee" && commande.statut !== "livree";
    const peutEditerCoordonnees = commande.statut !== "annulee";

    return (
        <div className="rounded-md border border-neutral-200 p-3">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-black">N° {commande.numero}</span>
                        <span
                            className={`rounded-sm px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${statut.classe}`}
                        >
                            {statut.label}
                        </span>
                        <span className="text-xs text-neutral-400">{formatDate(commande.created_at)}</span>
                    </div>
                    <p className="mt-1 truncate text-sm text-neutral-800">{contact}</p>
                    {resume && <p className="line-clamp-2 text-xs text-neutral-500">{resume}</p>}
                    {!liv && peutEditerCoordonnees && (
                        <p className="mt-1 text-xs font-semibold text-orange-600">Coordonnées du client à ajouter</p>
                    )}
                </div>
                <p className="shrink-0 text-sm font-bold text-black">{formatPrice(commande.total)}</p>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-neutral-100 pt-3">
                <div>
                    {action && (
                        <button
                            type="button"
                            onClick={onActionSuivante}
                            className="rounded-sm bg-green-600 px-4 py-2 text-xs font-bold uppercase tracking-wide text-white hover:bg-green-700"
                        >
                            {action.libelle}
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-1">
                    <BoutonAvecIcone libelle="Détails" onClick={onDetails}>
                        <EyeIcon />
                    </BoutonAvecIcone>
                    {peutEditerCoordonnees && (
                        <BoutonAvecIcone libelle="Coordonnées" onClick={onCoordonnees}>
                            <TruckIcon />
                        </BoutonAvecIcone>
                    )}
                    {peutAnnuler && (
                        <button
                            type="button"
                            onClick={onAnnuler}
                            aria-label="Annuler la commande"
                            title="Annuler la commande"
                            className="flex h-8 w-8 items-center justify-center rounded-sm text-red-500 transition-colors hover:bg-red-50"
                        >
                            <XCircleIcon />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

function BoutonAvecIcone({
    libelle,
    onClick,
    children,
}: {
    libelle: string;
    onClick: () => void;
    children: ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            title={libelle}
            className="flex items-center gap-1 rounded-sm px-2 py-1.5 text-xs font-semibold text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-black"
        >
            {children}
            <span>{libelle}</span>
        </button>
    );
}

function DetailCommandeModal({
    commande,
    onClose,
    onActionSuivante,
    onCoordonnees,
    onAnnuler,
}: {
    commande: Commande;
    onClose: () => void;
    onActionSuivante: () => void;
    onCoordonnees: () => void;
    onAnnuler: () => void;
}) {
    const statut = STATUTS[commande.statut];
    const action = actionSuivante(commande);
    const liv = commande.livraison;
    const peutAnnuler = commande.statut !== "annulee" && commande.statut !== "livree";
    const peutEditerCoordonnees = commande.statut !== "annulee";

    return (
        <Modal open onClose={onClose}>
            <div className="mb-1 flex items-center justify-between gap-2">
                <h2 className="text-sm font-bold uppercase tracking-wide">Commande N° {commande.numero}</h2>
                <span
                    className={`rounded-sm px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${statut.classe}`}
                >
                    {statut.label}
                </span>
            </div>
            <p className="mb-4 text-xs text-neutral-400">
                {formatDate(commande.created_at)} · {PAIEMENTS[commande.methode_paiement]}
            </p>

            <div className="mb-4 flex flex-col gap-2">
                {commande.lignes?.map((ligne) => (
                    <div key={ligne.id} className="flex items-center justify-between gap-2 text-sm">
                        <span className="min-w-0 flex-1 text-neutral-700">
                            {ligne.nom_produit} × {ligne.quantite}
                        </span>
                        <span className="shrink-0 font-semibold text-black">{formatPrice(ligne.sous_total)}</span>
                    </div>
                ))}
                <div className="mt-1 flex items-center justify-between border-t border-neutral-200 pt-2 text-sm font-bold">
                    <span>Total</span>
                    <span>{formatPrice(commande.total)}</span>
                </div>
            </div>

            {commande.notes && (
                <div className="mb-4 rounded-md bg-neutral-50 p-3 text-sm text-neutral-700">
                    <span className="mb-1 block text-xs font-semibold uppercase text-neutral-400">Note</span>
                    {commande.notes}
                </div>
            )}

            <div className="mb-4 rounded-md border border-neutral-200 p-3">
                <div className="mb-1 flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                        Client et livraison
                    </span>
                    {peutEditerCoordonnees &&
                        (liv ? (
                            <RowActions onEdit={onCoordonnees} />
                        ) : (
                            <button
                                type="button"
                                onClick={onCoordonnees}
                                className="text-xs font-semibold text-orange-600 hover:underline"
                            >
                                + Ajouter
                            </button>
                        ))}
                </div>
                {liv ? (
                    <>
                        <p className="text-sm text-neutral-800">{liv.nom_complet}</p>
                        <p className="text-sm text-neutral-600">{liv.telephone}</p>
                        <p className="text-sm text-neutral-600">
                            {liv.adresse}, {liv.ville}
                        </p>
                    </>
                ) : (
                    <p className="text-sm text-neutral-500">Aucune coordonnée pour le moment.</p>
                )}
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2">
                {peutAnnuler && (
                    <button
                        type="button"
                        onClick={onAnnuler}
                        className="rounded-sm px-3 py-2 text-xs font-semibold text-red-500 hover:bg-red-50"
                    >
                        Annuler la commande
                    </button>
                )}
                <button
                    type="button"
                    onClick={onClose}
                    className="rounded-sm px-3 py-2 text-xs font-semibold text-neutral-500 hover:text-black"
                >
                    Fermer
                </button>
                {action && (
                    <button
                        type="button"
                        onClick={onActionSuivante}
                        className="rounded-sm bg-green-600 px-4 py-2 text-xs font-bold uppercase tracking-wide text-white hover:bg-green-700"
                    >
                        {action.libelle}
                    </button>
                )}
            </div>
        </Modal>
    );
}

function LivraisonModal({
    commande,
    statutCible,
    onClose,
    onSuccess,
}: {
    commande: Commande;
    statutCible: StatutLivraison | null;
    onClose: () => void;
    onSuccess: (message: string) => void;
}) {
    const liv = commande.livraison;

    const [nomComplet, setNomComplet] = useState(liv?.nom_complet ?? commande.user?.name ?? "");
    const [telephone, setTelephone] = useState(liv?.telephone ?? commande.user?.telephone ?? "");
    const [adresse, setAdresse] = useState(liv?.adresse ?? "");
    const [ville, setVille] = useState(liv?.ville ?? "");
    const [envoiEnCours, setEnvoiEnCours] = useState(false);
    const [erreur, setErreur] = useState<string | null>(null);

    const libelleAction =
        statutCible === "en_cours"
            ? "Mettre en livraison"
            : statutCible === "livree"
              ? "Marquer comme livrée"
              : "Enregistrer";

    const soumettre = async (e: React.FormEvent) => {
        e.preventDefault();
        setEnvoiEnCours(true);
        setErreur(null);

        try {
            await api(`/api/commandes/${commande.id}/livraison`, {
                method: "PUT",
                body: {
                    nom_complet: nomComplet,
                    telephone,
                    adresse,
                    ville,
                    statut: statutCible ?? liv?.statut ?? "en_attente",
                },
            });

            onSuccess(
                statutCible === "en_cours"
                    ? `Commande N° ${commande.numero} mise en livraison.`
                    : statutCible === "livree"
                      ? `Commande N° ${commande.numero} marquée comme livrée.`
                      : "Coordonnées enregistrées."
            );
        } catch (err) {
            setErreur(extraireMessageErreur(err));
        } finally {
            setEnvoiEnCours(false);
        }
    };

    return (
        <FormModal
            open
            onClose={onClose}
            onSubmit={soumettre}
            titre={`${statutCible ? libelleAction : "Coordonnées du client"} — commande N° ${commande.numero}`}
            erreur={erreur}
            envoiEnCours={envoiEnCours}
            libelleSubmit={libelleAction}
            libelleSubmitEnCours="Enregistrement..."
        >
            <TextField label="Nom du client" value={nomComplet} onChange={setNomComplet} required />
            <TextField label="Téléphone" type="tel" value={telephone} onChange={setTelephone} required />
            <TextField label="Adresse de livraison" value={adresse} onChange={setAdresse} required />
            <TextField label="Ville" value={ville} onChange={setVille} required />
        </FormModal>
    );
}

type LigneEnCours = {
    produit: Produit;
    declinaison: Declinaison | null;
    quantite: number;
};

function NouvelleCommandeModal({
    onClose,
    onSuccess,
}: {
    onClose: () => void;
    onSuccess: (numero: number) => void;
}) {
    const [lignes, setLignes] = useState<LigneEnCours[]>([]);
    const [indexASupprimer, setIndexASupprimer] = useState<number | null>(null);

    const [nomComplet, setNomComplet] = useState("");
    const [telephone, setTelephone] = useState("");
    const [adresse, setAdresse] = useState("");
    const [ville, setVille] = useState("");
    const [methodePaiement, setMethodePaiement] = useState<MethodePaiement>("paiement_livraison");
    const [notes, setNotes] = useState("");

    const [envoiEnCours, setEnvoiEnCours] = useState(false);
    const [erreur, setErreur] = useState<string | null>(null);

    const total = lignes.reduce((somme, l) => somme + prixUnitaire(l.produit) * l.quantite, 0);

    // Si le même produit (et la même taille) est ajouté deux fois, on additionne
    // les quantités plutôt que de créer deux lignes séparées.
    const ajouterLigne = (nouvelle: LigneEnCours) => {
        setLignes((prev) => {
            const index = prev.findIndex(
                (l) => l.produit.id === nouvelle.produit.id && l.declinaison?.id === nouvelle.declinaison?.id
            );
            if (index === -1) return [...prev, nouvelle];

            const stock = nouvelle.declinaison ? nouvelle.declinaison.quantite : nouvelle.produit.quantite;
            const copie = [...prev];
            copie[index] = {
                ...copie[index],
                quantite: Math.min(copie[index].quantite + nouvelle.quantite, stock),
            };
            return copie;
        });
    };

    const soumettre = async (e: React.FormEvent) => {
        e.preventDefault();

        if (lignes.length === 0) {
            setErreur("Ajoute au moins un article à la commande.");
            return;
        }

        setEnvoiEnCours(true);
        setErreur(null);

        try {
            const commande = await api<Commande>("/api/commandes/manuelle", {
                method: "POST",
                body: {
                    methode_paiement: methodePaiement,
                    notes: notes || null,
                    articles: lignes.map((l) => ({
                        produit_id: l.produit.id,
                        declinaison_id: l.declinaison?.id ?? null,
                        quantite: l.quantite,
                    })),
                    livraison: { nom_complet: nomComplet, telephone, adresse, ville },
                },
            });
            onSuccess(commande.numero);
        } catch (err) {
            setErreur(extraireMessageErreur(err));
        } finally {
            setEnvoiEnCours(false);
        }
    };

    const ligneASupprimer = indexASupprimer !== null ? lignes[indexASupprimer] : null;

    return (
        <>
            <FormModal
                open
                onClose={onClose}
                onSubmit={soumettre}
                titre="Nouvelle commande"
                erreur={erreur}
                envoiEnCours={envoiEnCours}
                libelleSubmit="Créer la commande"
                libelleSubmitEnCours="Création..."
            >
                <p className="mb-3 text-xs text-neutral-500">
                    Pour un client qui t'a contacté directement sur WhatsApp, sans passer par le site.
                </p>

                {lignes.length > 0 && (
                    <div className="mb-3 rounded-md border border-neutral-200 p-3">
                        {lignes.map((l, i) => (
                            <div
                                key={`${l.produit.id}-${l.declinaison?.id ?? "sans-taille"}`}
                                className="flex items-center justify-between gap-2 py-1 text-sm"
                            >
                                <span className="min-w-0 flex-1 truncate text-neutral-700">
                                    {l.produit.nom}
                                    {l.declinaison ? ` (${l.declinaison.label})` : ""} × {l.quantite}
                                </span>
                                <span className="shrink-0 font-semibold text-black">
                                    {formatPrice(prixUnitaire(l.produit) * l.quantite)}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setIndexASupprimer(i)}
                                    aria-label="Retirer cet article"
                                    className="shrink-0 text-red-400 hover:text-red-600"
                                >
                                    <SmallTrashIcon />
                                </button>
                            </div>
                        ))}
                        <div className="mt-1 flex items-center justify-between border-t border-neutral-100 pt-2 text-sm font-bold">
                            <span>Total</span>
                            <span>{formatPrice(total)}</span>
                        </div>
                    </div>
                )}

                <AjoutArticle lignes={lignes} onAjouter={ajouterLigne} />

                <TextField label="Nom du client" value={nomComplet} onChange={setNomComplet} required />
                <TextField label="Téléphone" type="tel" value={telephone} onChange={setTelephone} required />
                <TextField label="Adresse de livraison" value={adresse} onChange={setAdresse} required />
                <TextField label="Ville" value={ville} onChange={setVille} required />
                <SelectField
                    label="Mode de paiement"
                    value={methodePaiement}
                    onChange={(v) => setMethodePaiement(v as MethodePaiement)}
                    options={Object.entries(PAIEMENTS).map(([value, label]) => ({ value, label }))}
                />
                <TextareaField label="Note (optionnel)" value={notes} onChange={setNotes} />
            </FormModal>

            <ConfirmDeleteModal
                open={indexASupprimer !== null}
                onClose={() => setIndexASupprimer(null)}
                onConfirm={() => {
                    if (indexASupprimer !== null) {
                        setLignes((prev) => prev.filter((_, i) => i !== indexASupprimer));
                    }
                    setIndexASupprimer(null);
                }}
                envoiEnCours={false}
                erreur={null}
                libelleConfirm="Retirer"
                message={
                    <>
                        Retirer <span className="font-semibold">{ligneASupprimer?.produit.nom}</span> de la commande ?
                    </>
                }
            />
        </>
    );
}

/** Recherche un produit, choisit la taille et la quantité, puis ajoute la ligne. */
function AjoutArticle({
    lignes,
    onAjouter,
}: {
    lignes: LigneEnCours[];
    onAjouter: (ligne: LigneEnCours) => void;
}) {
    const [terme, setTerme] = useState("");
    const [termeRecherche, setTermeRecherche] = useState("");
    const [listeOuverte, setListeOuverte] = useState(false);
    const [produit, setProduit] = useState<Produit | null>(null);
    const [declinaison, setDeclinaison] = useState<Declinaison | null>(null);
    const [quantite, setQuantite] = useState(1);

    const champRecherche = useRef<HTMLInputElement>(null);
    const refocaliser = useRef(false);

    // Petit délai pour ne pas interroger le serveur à chaque lettre tapée.
    useEffect(() => {
        const timer = setTimeout(() => setTermeRecherche(terme.trim()), 250);
        return () => clearTimeout(timer);
    }, [terme]);

    // Remet le curseur dans la recherche après un ajout, pour enchaîner l'article suivant.
    useEffect(() => {
        if (produit === null && refocaliser.current) {
            champRecherche.current?.focus();
            refocaliser.current = false;
        }
    }, [produit]);

    const { produits, loading } = useProduits({ recherche: termeRecherche || undefined });

    const aDesTailles = (produit?.declinaisons?.length ?? 0) > 0;

    // Ce qui est déjà dans la commande pour le même article est retiré du stock proposé :
    // impossible de dépasser le stock réel en ajoutant deux fois la même chose.
    const quantiteDejaPrise = (produitId: number, declinaisonId: number | null) =>
        lignes
            .filter((l) => l.produit.id === produitId && (l.declinaison?.id ?? null) === declinaisonId)
            .reduce((somme, l) => somme + l.quantite, 0);

    const stockDuProduit = !produit ? 0 : aDesTailles ? (declinaison?.quantite ?? 0) : produit.quantite;
    const stockRestant = produit
        ? Math.max(stockDuProduit - quantiteDejaPrise(produit.id, declinaison?.id ?? null), 0)
        : 0;

    const peutAjouter = !!produit && (!aDesTailles || declinaison !== null) && stockRestant > 0;

    const choisir = (p: Produit) => {
        setProduit(p);
        setDeclinaison(null);
        setQuantite(1);
        setTerme("");
        setListeOuverte(false);
    };

    const changer = () => {
        refocaliser.current = true;
        setProduit(null);
        setDeclinaison(null);
        setQuantite(1);
    };

    const ajouter = () => {
        if (!produit || !peutAjouter) return;
        onAjouter({ produit, declinaison, quantite });
        refocaliser.current = true;
        setProduit(null);
        setDeclinaison(null);
        setQuantite(1);
    };

    return (
        <div className="mb-4">
            <span className="mb-1 block text-xs font-semibold text-neutral-700">Ajouter un article</span>

            {!produit ? (
                <>
                    <input
                        ref={champRecherche}
                        type="text"
                        value={terme}
                        onChange={(e) => {
                            setTerme(e.target.value);
                            setListeOuverte(true);
                        }}
                        onFocus={() => setListeOuverte(true)}
                        onBlur={() => setListeOuverte(false)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                e.preventDefault(); // ne pas envoyer tout le formulaire
                                if (produits[0]) choisir(produits[0]);
                            }
                        }}
                        placeholder="Chercher un produit..."
                        className="w-full rounded-sm border border-neutral-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
                    />

                    {listeOuverte && (
                        // onMouseDown empêche le champ de perdre le focus au moment du clic,
                        // sinon la liste se fermerait avant que le clic ne soit pris en compte.
                        <div
                            onMouseDown={(e) => e.preventDefault()}
                            className="mt-1 max-h-48 overflow-y-auto rounded-sm border border-neutral-200 bg-white"
                        >
                            {loading ? (
                                <p className="px-3 py-2 text-xs text-neutral-400">Recherche...</p>
                            ) : produits.length === 0 ? (
                                <p className="px-3 py-2 text-xs text-neutral-400">Aucun produit disponible trouvé.</p>
                            ) : (
                                produits.map((p) => (
                                    <button
                                        key={p.id}
                                        type="button"
                                        onClick={() => choisir(p)}
                                        className="flex w-full items-center gap-2 px-2 py-1.5 text-left text-sm hover:bg-neutral-100"
                                    >
                                        {p.images?.[0]?.url ? (
                                            <img
                                                src={p.images[0].url}
                                                alt=""
                                                className="h-8 w-8 shrink-0 rounded-sm object-cover"
                                            />
                                        ) : (
                                            <span className="h-8 w-8 shrink-0 rounded-sm bg-neutral-100" />
                                        )}
                                        <span className="min-w-0 flex-1 truncate text-neutral-800">{p.nom}</span>
                                        <span className="shrink-0 text-xs text-neutral-500">
                                            {formatPrice(prixUnitaire(p))}
                                        </span>
                                    </button>
                                ))
                            )}
                        </div>
                    )}
                </>
            ) : (
                <div className="rounded-md border border-neutral-200 bg-neutral-50 p-2">
                    <div className="mb-2 flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-semibold text-neutral-800">{produit.nom}</span>
                        <button
                            type="button"
                            onClick={changer}
                            className="shrink-0 text-xs font-semibold text-neutral-500 hover:text-black hover:underline"
                        >
                            Changer
                        </button>
                    </div>

                    {aDesTailles && (
                        <div className="mb-2 flex flex-wrap gap-1.5">
                            {produit.declinaisons?.map((d) => {
                                const epuisee = d.quantite - quantiteDejaPrise(produit.id, d.id) <= 0;
                                return (
                                    <button
                                        key={d.id}
                                        type="button"
                                        disabled={epuisee}
                                        onClick={() => {
                                            setDeclinaison(d);
                                            setQuantite(1);
                                        }}
                                        className={`min-w-10 rounded-sm border px-2.5 py-1.5 text-sm transition-colors ${
                                            epuisee
                                                ? "cursor-not-allowed border-neutral-200 text-neutral-300 line-through"
                                                : declinaison?.id === d.id
                                                  ? "border-black bg-black text-white"
                                                  : "border-neutral-300 bg-white text-neutral-800 hover:border-black"
                                        }`}
                                    >
                                        {d.label}
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center rounded-sm border border-neutral-300 bg-white">
                            <button
                                type="button"
                                onClick={() => setQuantite((q) => Math.max(1, q - 1))}
                                disabled={quantite <= 1}
                                className="px-2.5 py-1 text-base text-black hover:bg-neutral-100 disabled:cursor-not-allowed disabled:text-neutral-300 disabled:hover:bg-transparent"
                            >
                                −
                            </button>
                            <ChampQuantite
                                valeur={quantite}
                                max={stockRestant}
                                desactive={aDesTailles && !declinaison}
                                onChange={setQuantite}
                            />
                            <button
                                type="button"
                                onClick={() => setQuantite((q) => Math.min(Math.max(stockRestant, 1), q + 1))}
                                disabled={quantite >= stockRestant}
                                className="px-2.5 py-1 text-base text-black hover:bg-neutral-100 disabled:cursor-not-allowed disabled:text-neutral-300 disabled:hover:bg-transparent"
                            >
                                +
                            </button>
                        </div>

                        {(!aDesTailles || declinaison) && (
                            <span className="text-xs text-neutral-400">
                                {stockRestant === 0
                                    ? "Tout le stock est déjà dans la commande"
                                    : `${stockRestant} disponible${stockRestant > 1 ? "s" : ""}`}
                            </span>
                        )}

                        <button
                            type="button"
                            onClick={ajouter}
                            disabled={!peutAjouter}
                            className="ml-auto rounded-sm bg-black px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300"
                        >
                            {aDesTailles && !declinaison ? "Choisis une taille" : "Ajouter"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

/**
 * Champ de quantité où l'on peut taper : toute valeur au-dessus du stock est
 * ramenée au maximum sur-le-champ, impossible de dépasser.
 */
function ChampQuantite({
    valeur,
    max,
    desactive,
    onChange,
}: {
    valeur: number;
    max: number;
    desactive: boolean;
    onChange: (n: number) => void;
}) {
    const [texte, setTexte] = useState(String(valeur));
    const plafond = Math.max(max, 1);

    // Suit les changements venus de l'extérieur (boutons − / +, remise à 1...).
    useEffect(() => {
        setTexte(String(valeur));
    }, [valeur]);

    return (
        <input
            type="number"
            inputMode="numeric"
            min={1}
            max={plafond}
            value={texte}
            disabled={desactive}
            onChange={(e) => {
                const brut = e.target.value;
                setTexte(brut);
                if (brut === "") return; // en train de retaper : on attend un chiffre

                const saisi = Math.floor(Number(brut));
                if (Number.isNaN(saisi)) return;

                const borne = Math.min(Math.max(1, saisi), plafond);
                onChange(borne);
                if (borne !== saisi) setTexte(String(borne)); // au-dessus du stock : retour au maximum
            }}
            onBlur={() => setTexte(String(valeur))} // champ laissé vide : on remet la valeur actuelle
            onFocus={(e) => e.target.select()}
            className="w-12 border-x border-neutral-300 py-1 text-center text-sm focus:outline-none disabled:bg-neutral-50 disabled:text-neutral-300"
        />
    );
}

function EyeIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
            strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
            <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12Z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    );
}

function TruckIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
            strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
            <path d="M1 3h15v13H1z" />
            <path d="M16 8h4l3 3v5h-7z" />
            <circle cx="5.5" cy="18.5" r="2.5" />
            <circle cx="18.5" cy="18.5" r="2.5" />
        </svg>
    );
}

function XCircleIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
            strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
            <circle cx="12" cy="12" r="10" />
            <path d="m15 9-6 6" />
            <path d="m9 9 6 6" />
        </svg>
    );
}

function SmallTrashIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
            <path d="M3 6h18" />
            <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
        </svg>
    );
}