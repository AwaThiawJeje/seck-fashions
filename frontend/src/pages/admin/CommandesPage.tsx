import { useState } from "react";
import { useCommandesAdmin } from "../../hooks/useCommandesAdmin";
import { useProduits } from "../../hooks/useProduits";
import { api } from "../../lib/api";
import { extraireMessageErreur } from "../../lib/crud";
import ListShell from "../../components/crud/ListShell";
import Modal from "../../components/Modal";
import ConfirmDeleteModal from "../../components/crud/ConfirmDeleteModal";
import { TextField, SelectField, TextareaField } from "../../components/crud/fields";
import type { Commande, Produit, StatutCommande } from "../../types/api";

const ONGLETS: { valeur: string; label: string }[] = [
    { valeur: "", label: "Toutes" },
    { valeur: "en_attente", label: "En attente" },
    { valeur: "confirmee", label: "Confirmées" },
    { valeur: "expediee", label: "Expédiées" },
    { valeur: "livree", label: "Livrées" },
    { valeur: "annulee", label: "Annulées" },
];

function formatPrice(value: string) {
    return `${Number(value).toLocaleString("fr-FR")} FCFA`;
}

function libelleStatut(statut: StatutCommande): string {
    return {
        en_attente: "En attente",
        confirmee: "Confirmée",
        expediee: "Expédiée",
        livree: "Livrée",
        annulee: "Annulée",
    }[statut];
}

function classeStatut(statut: StatutCommande): string {
    return {
        en_attente: "bg-neutral-200 text-neutral-700",
        confirmee: "bg-blue-100 text-blue-700",
        expediee: "bg-orange-100 text-orange-700",
        livree: "bg-green-100 text-green-700",
        annulee: "bg-red-100 text-red-700",
    }[statut];
}

export default function CommandesPage() {
    const [onglet, setOnglet] = useState("");
    const { commandes, loading, error, refetch } = useCommandesAdmin(onglet || undefined);
    const [commandeOuverte, setCommandeOuverte] = useState<Commande | null>(null);
    const [creationOuverte, setCreationOuverte] = useState(false);

    return (
        <>
            <ListShell
                titre="Commandes"
                libelleNouveau="+ Nouvelle commande (WhatsApp direct)"
                onNouveau={() => setCreationOuverte(true)}
                loading={loading}
                error={error}
                estVide={commandes.length === 0}
                messageVide="Aucune commande ici."
            >
                <div className="mb-4 flex flex-wrap gap-1.5">
                    {ONGLETS.map((o) => (
                        <button
                            key={o.valeur}
                            type="button"
                            onClick={() => setOnglet(o.valeur)}
                            className={`rounded-sm px-3 py-1.5 text-xs font-semibold transition-colors ${
                                onglet === o.valeur ? "bg-black text-white" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                            }`}
                        >
                            {o.label}
                        </button>
                    ))}
                </div>

                <div className="flex flex-col gap-2">
                    {commandes.map((commande) => (
                        <button
                            key={commande.id}
                            type="button"
                            onClick={() => setCommandeOuverte(commande)}
                            className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-neutral-200 px-4 py-3 text-left hover:border-black"
                        >
                            <div>
                                <span className="text-sm font-semibold text-black">Commande #{commande.id}</span>
                                <span className="ml-2 text-xs text-neutral-500">
                                    {commande.livraison?.nom_complet ?? commande.user?.name ?? "Client invité"}
                                </span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-semibold text-black">{formatPrice(commande.total)}</span>
                                <span className={`rounded-sm px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${classeStatut(commande.statut)}`}>
                                    {libelleStatut(commande.statut)}
                                </span>
                            </div>
                        </button>
                    ))}
                </div>
            </ListShell>

            {commandeOuverte && (
                <DetailCommande
                    commande={commandeOuverte}
                    onClose={() => setCommandeOuverte(null)}
                    onChange={refetch}
                    onCommandeMiseAJour={setCommandeOuverte}
                />
            )}

            {creationOuverte && (
                <NouvelleCommandeManuelle
                    onClose={() => setCreationOuverte(false)}
                    onSuccess={() => { setCreationOuverte(false); refetch(); }}
                />
            )}
        </>
    );
}

function DetailCommande({
    commande,
    onClose,
    onChange,
    onCommandeMiseAJour,
}: {
    commande: Commande;
    onClose: () => void;
    onChange: () => void;
    onCommandeMiseAJour: (c: Commande) => void;
}) {
    const [actionEnCours, setActionEnCours] = useState<"valider" | "annuler" | null>(null);
    const [confirmationAction, setConfirmationAction] = useState<"valider" | "annuler" | null>(null);
    const [erreurAction, setErreurAction] = useState<string | null>(null);

    const executerAction = async (action: "valider" | "annuler") => {
        setActionEnCours(action);
        setErreurAction(null);
        try {
            const miseAJour = await api<Commande>(`/api/commandes/${commande.id}/${action}`, { method: "PUT" });
            onCommandeMiseAJour(miseAJour);
            onChange();
            setConfirmationAction(null);
        } catch (err) {
            setErreurAction(extraireMessageErreur(err));
        } finally {
            setActionEnCours(null);
        }
    };

    return (
        <>
            <Modal open onClose={onClose}>
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-sm font-bold uppercase tracking-wide">Commande #{commande.id}</h2>
                    <span className={`rounded-sm px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${classeStatut(commande.statut)}`}>
                        {libelleStatut(commande.statut)}
                    </span>
                </div>

                <div className="mb-4 flex flex-col gap-2">
                    {commande.lignes?.map((ligne) => (
                        <div key={ligne.id} className="flex items-center justify-between text-sm">
                            <span className="text-neutral-700">{ligne.nom_produit} × {ligne.quantite}</span>
                            <span className="font-semibold text-black">{formatPrice(ligne.sous_total)}</span>
                        </div>
                    ))}
                    <div className="mt-1 flex items-center justify-between border-t border-neutral-200 pt-2 text-sm font-bold">
                        <span>Total</span>
                        <span>{formatPrice(commande.total)}</span>
                    </div>
                </div>

                <LivraisonSection
                    commande={commande}
                    onMiseAJour={(c) => { onCommandeMiseAJour(c); onChange(); }}
                />

                {erreurAction && (
                    <p className="mt-3 rounded-sm bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">{erreurAction}</p>
                )}

                <div className="mt-4 flex justify-end gap-2">
                    {commande.statut === "en_attente" && (
                        <button
                            type="button"
                            onClick={() => setConfirmationAction("valider")}
                            className="rounded-sm bg-green-600 px-4 py-2 text-xs font-bold uppercase tracking-wide text-white hover:bg-green-700"
                        >
                            Valider
                        </button>
                    )}
                    {commande.statut !== "annulee" && commande.statut !== "livree" && (
                        <button
                            type="button"
                            onClick={() => setConfirmationAction("annuler")}
                            className="rounded-sm border border-red-300 px-4 py-2 text-xs font-bold uppercase tracking-wide text-red-600 hover:bg-red-50"
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
                </div>
            </Modal>

            <ConfirmDeleteModal
                open={confirmationAction !== null}
                onClose={() => setConfirmationAction(null)}
                onConfirm={() => confirmationAction && executerAction(confirmationAction)}
                envoiEnCours={actionEnCours !== null}
                erreur={null}
                libelleConfirm={confirmationAction === "valider" ? "Valider" : "Annuler la commande"}
                message={
                    confirmationAction === "valider"
                        ? "Valider cette commande ? Le stock des articles sera décrémenté."
                        : "Annuler cette commande ? Si elle était déjà confirmée, le stock sera remis."
                }
            />
        </>
    );
}

function LivraisonSection({
    commande,
    onMiseAJour,
}: {
    commande: Commande;
    onMiseAJour: (c: Commande) => void;
}) {
    const [edition, setEdition] = useState(!commande.livraison);
    const [nomComplet, setNomComplet] = useState(commande.livraison?.nom_complet ?? "");
    const [telephone, setTelephone] = useState(commande.livraison?.telephone ?? "");
    const [adresse, setAdresse] = useState(commande.livraison?.adresse ?? "");
    const [ville, setVille] = useState(commande.livraison?.ville ?? "");
    const [statutLivraison, setStatutLivraison] = useState<"en_attente" | "en_cours" | "livree" | "echouee">(
        commande.livraison?.statut ?? "en_attente"
    );
    const [envoiEnCours, setEnvoiEnCours] = useState(false);
    const [erreur, setErreur] = useState<string | null>(null);

    const enregistrer = async (e: React.FormEvent) => {
        e.preventDefault();
        setEnvoiEnCours(true);
        setErreur(null);
        try {
            await api(`/api/commandes/${commande.id}/livraison`, {
                method: "PUT",
                body: { nom_complet: nomComplet, telephone, adresse, ville, statut: statutLivraison },
            });
            const commandeFraiche = await api<Commande>(`/api/commandes/${commande.id}`);
            onMiseAJour(commandeFraiche);
            setEdition(false);
        } catch (err) {
            setErreur(extraireMessageErreur(err));
        } finally {
            setEnvoiEnCours(false);
        }
    };

    if (!edition) {
        return (
            <div className="mb-4 rounded-md border border-neutral-200 p-3">
                <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Livraison</span>
                    <button type="button" onClick={() => setEdition(true)} className="text-xs font-semibold text-neutral-500 hover:text-black hover:underline">
                        Modifier
                    </button>
                </div>
                <p className="text-sm text-neutral-800">{commande.livraison?.nom_complet}</p>
                <p className="text-sm text-neutral-600">{commande.livraison?.telephone}</p>
                <p className="text-sm text-neutral-600">{commande.livraison?.adresse}, {commande.livraison?.ville}</p>
            </div>
        );
    }

    return (
        <form onSubmit={enregistrer} className="mb-4 rounded-md border border-neutral-200 p-3">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-neutral-500">Livraison</span>

            {erreur && (
                <p className="mb-2 rounded-sm bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">{erreur}</p>
            )}

            <TextField label="Nom complet" value={nomComplet} onChange={setNomComplet} required />
            <TextField label="Téléphone" value={telephone} onChange={setTelephone} required />
            <TextField label="Adresse" value={adresse} onChange={setAdresse} required />
            <TextField label="Ville" value={ville} onChange={setVille} required />
            <SelectField
                label="Statut de la livraison"
                value={statutLivraison}
                onChange={(v) => setStatutLivraison(v as typeof statutLivraison)}
                options={[
                    { value: "en_attente", label: "En attente" },
                    { value: "en_cours", label: "En cours" },
                    { value: "livree", label: "Livrée" },
                    { value: "echouee", label: "Échouée" },
                ]}
            />

            <div className="flex justify-end gap-2">
                {commande.livraison && (
                    <button type="button" onClick={() => setEdition(false)} className="rounded-sm px-3 py-2 text-xs font-semibold text-neutral-500 hover:text-black">
                        Annuler
                    </button>
                )}
                <button
                    type="submit"
                    disabled={envoiEnCours}
                    className="rounded-sm bg-black px-4 py-2 text-xs font-bold uppercase tracking-wide text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300"
                >
                    {envoiEnCours ? "Enregistrement..." : "Enregistrer"}
                </button>
            </div>
        </form>
    );
}

type LigneEnCours = {
    produit: Produit;
    declinaisonId: number | null;
    declinaisonValeur: string | null;
    quantite: number;
    stockMax: number;
};

function NouvelleCommandeManuelle({
    onClose,
    onSuccess,
}: {
    onClose: () => void;
    onSuccess: () => void;
}) {
    const { produits } = useProduits();
    const [produitSelectionneId, setProduitSelectionneId] = useState("");
    const [declinaisonSelectionneeId, setDeclinaisonSelectionneeId] = useState("");
    const [quantiteAAjouter, setQuantiteAAjouter] = useState(1);
    const [lignes, setLignes] = useState<LigneEnCours[]>([]);

    const [nomComplet, setNomComplet] = useState("");
    const [telephone, setTelephone] = useState("");
    const [adresse, setAdresse] = useState("");
    const [ville, setVille] = useState("");
    const [methodePaiement, setMethodePaiement] = useState("paiement_livraison");
    const [notes, setNotes] = useState("");

    const [envoiEnCours, setEnvoiEnCours] = useState(false);
    const [erreur, setErreur] = useState<string | null>(null);

    const produitSelectionne = produits.find((p) => p.id === Number(produitSelectionneId)) ?? null;
    const declinaisonSelectionnee = produitSelectionne?.declinaisons?.find((d) => d.id === Number(declinaisonSelectionneeId)) ?? null;
    const stockDisponible = produitSelectionne
        ? (produitSelectionne.declinaisons && produitSelectionne.declinaisons.length > 0
            ? (declinaisonSelectionnee?.quantite ?? 0)
            : produitSelectionne.quantite)
        : 0;

    const ajouterLigne = () => {
        if (!produitSelectionne) return;
        if (produitSelectionne.declinaisons && produitSelectionne.declinaisons.length > 0 && !declinaisonSelectionnee) return;

        setLignes((prev) => [
            ...prev,
            {
                produit: produitSelectionne,
                declinaisonId: declinaisonSelectionnee?.id ?? null,
                declinaisonValeur: declinaisonSelectionnee?.valeur ?? null,
                quantite: quantiteAAjouter,
                stockMax: stockDisponible,
            },
        ]);
        setProduitSelectionneId("");
        setDeclinaisonSelectionneeId("");
        setQuantiteAAjouter(1);
    };

    const retirerLigne = (index: number) => {
        setLignes((prev) => prev.filter((_, i) => i !== index));
    };

    const total = lignes.reduce((sum, l) => {
        const prix = l.produit.en_promotion ? Number(l.produit.prix_promo) : Number(l.produit.prix);
        return sum + prix * l.quantite;
    }, 0);

    const soumettre = async (e: React.FormEvent) => {
        e.preventDefault();
        if (lignes.length === 0) {
            setErreur("Ajoute au moins un article.");
            return;
        }

        setEnvoiEnCours(true);
        setErreur(null);

        try {
            await api("/api/commandes/manuelle", {
                method: "POST",
                body: {
                    methode_paiement: methodePaiement,
                    notes: notes || null,
                    articles: lignes.map((l) => ({
                        produit_id: l.produit.id,
                        declinaison_id: l.declinaisonId,
                        quantite: l.quantite,
                    })),
                    livraison: { nom_complet: nomComplet, telephone, adresse, ville },
                },
            });
            onSuccess();
        } catch (err) {
            setErreur(extraireMessageErreur(err));
        } finally {
            setEnvoiEnCours(false);
        }
    };

    return (
        <Modal open onClose={onClose}>
            <form onSubmit={soumettre}>
                <h2 className="mb-4 text-sm font-bold uppercase tracking-wide">Nouvelle commande — contact WhatsApp direct</h2>

                {erreur && (
                    <p className="mb-3 rounded-sm bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">{erreur}</p>
                )}

                <div className="mb-4 rounded-md border border-neutral-200 p-3">
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-neutral-500">Articles</span>

                    {lignes.length > 0 && (
                        <div className="mb-3 flex flex-col gap-1.5">
                            {lignes.map((l, i) => (
                                <div key={i} className="flex items-center justify-between text-sm">
                                    <span className="text-neutral-700">
                                        {l.produit.nom}{l.declinaisonValeur ? ` (${l.declinaisonValeur})` : ""} × {l.quantite}
                                    </span>
                                    <button type="button" onClick={() => retirerLigne(i)} className="text-xs text-red-400 hover:text-red-600">
                                        Retirer
                                    </button>
                                </div>
                            ))}
                            <div className="flex items-center justify-between border-t border-neutral-100 pt-1.5 text-sm font-bold">
                                <span>Total</span>
                                <span>{total.toLocaleString("fr-FR")} FCFA</span>
                            </div>
                        </div>
                    )}

                    <div className="flex flex-wrap items-end gap-2">
                        <select
                            value={produitSelectionneId}
                            onChange={(e) => { setProduitSelectionneId(e.target.value); setDeclinaisonSelectionneeId(""); }}
                            className="min-w-40 flex-1 rounded-sm border border-neutral-300 bg-white px-2 py-1.5 text-sm"
                        >
                            <option value="">Choisir un produit...</option>
                            {produits.map((p) => (
                                <option key={p.id} value={p.id}>{p.nom}</option>
                            ))}
                        </select>

                        {produitSelectionne?.declinaisons && produitSelectionne.declinaisons.length > 0 && (
                            <select
                                value={declinaisonSelectionneeId}
                                onChange={(e) => setDeclinaisonSelectionneeId(e.target.value)}
                                className="rounded-sm border border-neutral-300 bg-white px-2 py-1.5 text-sm"
                            >
                                <option value="">Taille...</option>
                                {produitSelectionne.declinaisons.map((d) => (
                                    <option key={d.id} value={d.id} disabled={d.quantite === 0}>
                                        {d.valeur} {d.quantite === 0 ? "(épuisé)" : `(${d.quantite} en stock)`}
                                    </option>
                                ))}
                            </select>
                        )}

                        <input
                            type="number"
                            min={1}
                            max={stockDisponible || 1}
                            value={quantiteAAjouter}
                            onChange={(e) => setQuantiteAAjouter(Number(e.target.value))}
                            className="w-16 rounded-sm border border-neutral-300 px-2 py-1.5 text-sm"
                        />

                        <button
                            type="button"
                            onClick={ajouterLigne}
                            disabled={!produitSelectionne || !!(produitSelectionne.declinaisons && produitSelectionne.declinaisons.length > 0 && !declinaisonSelectionnee)}
                            className="rounded-sm bg-black px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300"
                        >
                            Ajouter
                        </button>
                    </div>
                </div>

                <TextField label="Nom complet du client" value={nomComplet} onChange={setNomComplet} required />
                <TextField label="Téléphone" value={telephone} onChange={setTelephone} required />
                <TextField label="Adresse" value={adresse} onChange={setAdresse} required />
                <TextField label="Ville" value={ville} onChange={setVille} required />
                <SelectField
                    label="Mode de paiement"
                    value={methodePaiement}
                    onChange={setMethodePaiement}
                    options={[
                        { value: "paiement_livraison", label: "Paiement à la livraison" },
                        { value: "wave", label: "Wave" },
                        { value: "orange_money", label: "Orange Money" },
                    ]}
                />
                <TextareaField label="Notes (optionnel)" value={notes} onChange={setNotes} />

                <div className="mt-4 flex justify-end gap-2">
                    <button type="button" onClick={onClose} className="rounded-sm px-3 py-2 text-xs font-semibold text-neutral-500 hover:text-black">
                        Annuler
                    </button>
                    <button
                        type="submit"
                        disabled={envoiEnCours}
                        className="rounded-sm bg-black px-4 py-2 text-xs font-bold uppercase tracking-wide text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300"
                    >
                        {envoiEnCours ? "Création..." : "Créer la commande"}
                    </button>
                </div>
            </form>
        </Modal>
    );
}