import { useRef, useState } from "react";
import { useCategories } from "../../context/CategoriesContext";
import { api } from "../../lib/api";
import { extraireMessageErreur } from "../../lib/crud";
import ListShell from "../../components/crud/ListShell";
import FormModal from "../../components/crud/FormModal";
import ConfirmDeleteModal from "../../components/crud/ConfirmDeleteModal";
import RowActions from "../../components/crud/RowActions";
import { TextField, SelectField } from "../../components/crud/fields";
import type { Categorie } from "../../types/api";

export default function CategoriesPage() {
    const { categories, loading, error, refetch } = useCategories();
    const [categorieAModifier, setCategorieAModifier] = useState<Categorie | null>(null);
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
                entete={
                    <AjoutRapide
                        placeholder="Ajouter une catégorie principale (ex : Chaussures)"
                        parentId={null}
                        onAjoutee={refetch}
                    />
                }
                loading={loading}
                error={error}
                estVide={categories.length === 0}
                messageVide="Aucune catégorie pour le moment. Ajoute la première ci-dessus."
            >
                <div className="flex flex-col gap-3">
                    {categories.map((racine) => (
                        <div key={racine.id} className="rounded-md border border-neutral-200">
                            <div className="flex items-center justify-between gap-2 px-4 py-2">
                                <span className="text-sm font-semibold text-neutral-800">{racine.nom}</span>
                                <RowActions
                                    onEdit={() => setCategorieAModifier(racine)}
                                    onDelete={() => setCategorieASupprimer(racine)}
                                />
                            </div>

                            {racine.enfants && racine.enfants.length > 0 && (
                                <div className="divide-y divide-neutral-100 border-t border-neutral-100">
                                    {racine.enfants.map((enfant) => (
                                        <div key={enfant.id} className="flex items-center justify-between gap-2 py-1 pl-8 pr-4">
                                            <span className="text-sm text-neutral-700">{enfant.nom}</span>
                                            <RowActions
                                                onEdit={() => setCategorieAModifier(enfant)}
                                                onDelete={() => setCategorieASupprimer(enfant)}
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="border-t border-neutral-100 bg-neutral-50 px-4 py-2">
                                <AjoutRapide
                                    compact
                                    placeholder="+ Ajouter une sous-catégorie"
                                    parentId={racine.id}
                                    onAjoutee={refetch}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </ListShell>

            {categorieAModifier && (
                <FormulaireCategorie
                    categories={categories}
                    categorie={categorieAModifier}
                    onClose={() => setCategorieAModifier(null)}
                    onSuccess={() => {
                        setCategorieAModifier(null);
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
                                    Ses sous-catégories deviendront des catégories principales plutôt que d'être supprimées.
                                </span>
                            )}
                        </>
                    )
                }
            />
        </>
    );
}

/** Champ d'ajout rapide : tape un nom, Entrée, et le champ reste prêt pour le suivant. */
function AjoutRapide({
    placeholder,
    parentId,
    onAjoutee,
    compact = false,
}: {
    placeholder: string;
    parentId: number | null;
    onAjoutee: () => void;
    compact?: boolean;
}) {
    const [nom, setNom] = useState("");
    const [envoiEnCours, setEnvoiEnCours] = useState(false);
    const [erreur, setErreur] = useState<string | null>(null);
    const champ = useRef<HTMLInputElement>(null);

    const ajouter = async () => {
        const valeur = nom.trim();
        if (!valeur || envoiEnCours) return;

        setEnvoiEnCours(true);
        setErreur(null);
        try {
            await api("/api/categories", {
                method: "POST",
                body: { nom: valeur, categorie_parente_id: parentId },
            });
            setNom("");
            onAjoutee();
            champ.current?.focus();
        } catch (err) {
            setErreur(extraireMessageErreur(err));
        } finally {
            setEnvoiEnCours(false);
        }
    };

    return (
        <div>
            <div className="flex items-center gap-2">
                <input
                    ref={champ}
                    type="text"
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            e.preventDefault();
                            ajouter();
                        }
                    }}
                    placeholder={placeholder}
                    className={`min-w-0 flex-1 rounded-sm border border-neutral-300 bg-white px-3 text-sm focus:border-black focus:outline-none ${
                        compact ? "py-1.5" : "py-2"
                    }`}
                />
                <button
                    type="button"
                    onClick={ajouter}
                    disabled={envoiEnCours || !nom.trim()}
                    className="shrink-0 rounded-sm bg-black px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300"
                >
                    {envoiEnCours ? "..." : "Ajouter"}
                </button>
            </div>
            {erreur && <p className="mt-1 text-xs font-semibold text-red-600">{erreur}</p>}
        </div>
    );
}

function FormulaireCategorie({
    categories,
    categorie,
    onClose,
    onSuccess,
}: {
    categories: Categorie[];
    categorie: Categorie;
    onClose: () => void;
    onSuccess: () => void;
}) {
    const aDesEnfants = !!categorie.enfants && categorie.enfants.length > 0;

    const [nom, setNom] = useState(categorie.nom);
    const [parentId, setParentId] = useState(categorie.categorie_parente_id?.toString() ?? "");
    const [envoiEnCours, setEnvoiEnCours] = useState(false);
    const [erreur, setErreur] = useState<string | null>(null);

    const parentsDisponibles = categories.filter((c) => c.id !== categorie.id);

    const soumettre = async (e: React.FormEvent) => {
        e.preventDefault();
        setEnvoiEnCours(true);
        setErreur(null);

        try {
            await api(`/api/categories/${categorie.id}`, {
                method: "PUT",
                body: { nom, categorie_parente_id: parentId ? Number(parentId) : null },
            });
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
            titre="Modifier la catégorie"
            erreur={erreur}
            envoiEnCours={envoiEnCours}
            libelleSubmit="Enregistrer"
            libelleSubmitEnCours="Enregistrement..."
        >
            <TextField label="Nom" value={nom} onChange={setNom} required />
            <SelectField
                label="Ranger dans"
                value={parentId}
                onChange={setParentId}
                options={parentsDisponibles.map((p) => ({ value: p.id.toString(), label: p.nom }))}
                placeholder="— Aucune (catégorie principale) —"
                disabled={aDesEnfants}
                helperText={
                    aDesEnfants
                        ? "Cette catégorie contient des sous-catégories, elle doit rester une catégorie principale."
                        : undefined
                }
            />
        </FormModal>
    );
}