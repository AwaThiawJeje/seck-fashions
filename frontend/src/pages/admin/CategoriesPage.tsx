import { useState } from "react";
import { useCategories } from "../../context/CategoriesContext";
import { api } from "../../lib/api";
import { extraireMessageErreur } from "../../lib/crud";
import ListShell from "../../components/crud/ListShell";
import FormModal from "../../components/crud/FormModal";
import ConfirmDeleteModal from "../../components/crud/ConfirmDeleteModal";
import { TextField, SelectField } from "../../components/crud/fields";
import type { Categorie } from "../../types/api";

type EtatFormulaire = {
    categorie: Categorie | null; // null = création
    parentPreselectionne: number | null;
};

export default function CategoriesPage() {
    const { categories, loading, error, refetch } = useCategories();
    const [formulaire, setFormulaire] = useState<EtatFormulaire | null>(null);
    const [categorieASupprimer, setCategorieASupprimer] = useState<Categorie | null>(null);
    const [suppressionEnCours, setSuppressionEnCours] = useState(false);
    const [erreurSuppression, setErreurSuppression] = useState<string | null>(null);

    const confirmerSuppression = async () => {
        if (!categorieASupprimer) return;
        setSuppressionEnCours(true);
        setErreurSuppression(null);
        try {
            await api(`/api/categories/${categorieASupprimer.id}`, { method: "DELETE" });
            setCategorieASupprimer(null);
            refetch();
        } catch (err) {
            setErreurSuppression(extraireMessageErreur(err));
        } finally {
            setSuppressionEnCours(false);
        }
    };

    return (
        <>
            <ListShell
                titre="Catégories"
                libelleNouveau="+ Nouvelle catégorie"
                onNouveau={() => setFormulaire({ categorie: null, parentPreselectionne: null })}
                loading={loading}
                error={error}
                estVide={categories.length === 0}
                messageVide="Aucune catégorie pour le moment."
            >
                <div className="flex flex-col gap-3">
                    {categories.map((racine) => (
                        <div key={racine.id} className="rounded-md border border-neutral-200">
                            <div className="flex items-center justify-between px-4 py-3">
                                <span className="text-sm font-semibold text-neutral-800">{racine.nom}</span>
                                <div className="flex items-center gap-3 text-xs">
                                    <button
                                        type="button"
                                        onClick={() => setFormulaire({ categorie: null, parentPreselectionne: racine.id })}
                                        className="font-semibold text-neutral-500 hover:text-black hover:underline"
                                    >
                                        + Sous-catégorie
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormulaire({ categorie: racine, parentPreselectionne: null })}
                                        className="font-semibold text-neutral-500 hover:text-black hover:underline"
                                    >
                                        Modifier
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setCategorieASupprimer(racine)}
                                        className="font-semibold text-red-400 hover:text-red-600 hover:underline"
                                    >
                                        Supprimer
                                    </button>
                                </div>
                            </div>

                            {racine.enfants && racine.enfants.length > 0 && (
                                <div className="divide-y divide-neutral-100 border-t border-neutral-100">
                                    {racine.enfants.map((enfant) => (
                                        <div key={enfant.id} className="flex items-center justify-between py-2 pl-8 pr-4">
                                            <span className="text-sm text-neutral-700">{enfant.nom}</span>
                                            <div className="flex items-center gap-3 text-xs">
                                                <button
                                                    type="button"
                                                    onClick={() => setFormulaire({ categorie: enfant, parentPreselectionne: null })}
                                                    className="font-semibold text-neutral-500 hover:text-black hover:underline"
                                                >
                                                    Modifier
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setCategorieASupprimer(enfant)}
                                                    className="font-semibold text-red-400 hover:text-red-600 hover:underline"
                                                >
                                                    Supprimer
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </ListShell>

            {formulaire && (
                <FormulaireCategorie
                    categories={categories}
                    categorie={formulaire.categorie}
                    parentPreselectionne={formulaire.parentPreselectionne}
                    onClose={() => setFormulaire(null)}
                    onSuccess={() => {
                        setFormulaire(null);
                        refetch();
                    }}
                />
            )}

            <ConfirmDeleteModal
                open={!!categorieASupprimer}
                onClose={() => { setCategorieASupprimer(null); setErreurSuppression(null); }}
                onConfirm={confirmerSuppression}
                envoiEnCours={suppressionEnCours}
                erreur={erreurSuppression}
                message={
                    categorieASupprimer && (
                        <>
                            Supprimer <span className="font-semibold">{categorieASupprimer.nom}</span> ?
                            {categorieASupprimer.enfants && categorieASupprimer.enfants.length > 0 && (
                                <span className="mt-1 block text-xs text-neutral-500">
                                    Ses sous-catégories deviendront des catégories racines plutôt que d'être supprimées.
                                </span>
                            )}
                        </>
                    )
                }
            />
        </>
    );
}

function FormulaireCategorie({
    categories,
    categorie,
    parentPreselectionne,
    onClose,
    onSuccess,
}: {
    categories: Categorie[];
    categorie: Categorie | null;
    parentPreselectionne: number | null;
    onClose: () => void;
    onSuccess: () => void;
}) {
    const estEdition = categorie !== null;
    const aDesEnfants = !!categorie?.enfants && categorie.enfants.length > 0;

    const [nom, setNom] = useState(categorie?.nom ?? "");
    const [parentId, setParentId] = useState(
        categorie?.categorie_parente_id?.toString() ?? parentPreselectionne?.toString() ?? ""
    );
    const [envoiEnCours, setEnvoiEnCours] = useState(false);
    const [erreur, setErreur] = useState<string | null>(null);

    const parentsDisponibles = categories.filter(
        (c) => !c.categorie_parente_id && c.id !== categorie?.id
    );

    const soumettre = async (e: React.FormEvent) => {
        e.preventDefault();
        setEnvoiEnCours(true);
        setErreur(null);

        const body = { nom, categorie_parente_id: parentId ? Number(parentId) : null };

        try {
            if (estEdition) {
                await api(`/api/categories/${categorie.id}`, { method: "PUT", body });
            } else {
                await api("/api/categories", { method: "POST", body });
            }
            onSuccess();
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
            titre={estEdition ? "Modifier la catégorie" : "Nouvelle catégorie"}
            erreur={erreur}
            envoiEnCours={envoiEnCours}
            libelleSubmit={estEdition ? "Enregistrer" : "Créer"}
            libelleSubmitEnCours="Enregistrement..."
        >
            <TextField label="Nom" value={nom} onChange={setNom} required />
            <SelectField
                label="Catégorie parente"
                value={parentId}
                onChange={setParentId}
                options={parentsDisponibles.map((p) => ({ value: p.id.toString(), label: p.nom }))}
                placeholder="— Aucune (catégorie racine) —"
                disabled={aDesEnfants}
                helperText={aDesEnfants ? "Cette catégorie a des sous-catégories, elle doit rester une catégorie racine." : undefined}
            />
        </FormModal>
    );
}