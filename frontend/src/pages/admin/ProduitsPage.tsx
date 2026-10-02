import { useEffect, useRef, useState } from "react";
import { useProduits } from "../../hooks/useProduits";
import { useCategories } from "../../context/CategoriesContext";
import { api } from "../../lib/api";
import { extraireMessageErreur } from "../../lib/crud";
import ListShell from "../../components/crud/ListShell";
import FormModal from "../../components/crud/FormModal";
import ConfirmDeleteModal from "../../components/crud/ConfirmDeleteModal";
import RowActions from "../../components/crud/RowActions";
import Modal from "../../components/Modal";
import { TextField, TextareaField, ToggleField } from "../../components/crud/fields";
import type { Produit, ImageProduit, Categorie } from "../../types/api";

function formatPrice(value: string) {
    return `${Number(value).toLocaleString("fr-FR")} FCFA`;
}

function stockTotal(produit: Produit): number {
    if (produit.declinaisons && produit.declinaisons.length > 0) {
        return produit.declinaisons.reduce((s, d) => s + d.quantite, 0);
    }
    return produit.quantite;
}

export default function ProduitsPage() {
    // tout: true — l'admin doit voir aussi les produits masqués ou épuisés ici,
    // contrairement au site public qui ne les montre jamais.
    const { produits, loading, error, refetch } = useProduits({ tout: true });
    const [formulaire, setFormulaire] = useState<{ produit: Produit | null } | null>(null);
    const [produitASupprimer, setProduitASupprimer] = useState<Produit | null>(null);
    const [suppressionEnCours, setSuppressionEnCours] = useState(false);
    const [erreurSuppression, setErreurSuppression] = useState<string | null>(null);
    const [produitPrixAModifier, setProduitPrixAModifier] = useState<Produit | null>(null);
    const [produitPhotosAGerer, setProduitPhotosAGerer] = useState<Produit | null>(null);

    const confirmerSuppression = async () => {
        if (!produitASupprimer) return;
        setSuppressionEnCours(true);
        setErreurSuppression(null);
        try {
            await api(`/api/produits/${produitASupprimer.slug}`, { method: "DELETE" });
            setProduitASupprimer(null);
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
                titre="Produits"
                libelleNouveau="+ Nouveau produit"
                onNouveau={() => setFormulaire({ produit: null })}
                loading={loading}
                error={error}
                estVide={produits.length === 0}
                messageVide="Aucun produit pour le moment."
            >
                <div className="flex flex-col gap-2">
                    {produits.map((produit) => {
                        const stock = stockTotal(produit);
                        const image = produit.images?.[0]?.url;

                        return (
                            <div key={produit.id} className="flex items-center gap-3 rounded-md border border-neutral-200 p-3">
                                <div className="relative h-14 w-14 shrink-0">
                                    <div className="h-full w-full overflow-hidden rounded-sm bg-neutral-100">
                                        {image ? (
                                            <img src={image} alt={produit.nom} className="h-full w-full object-cover" />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center text-neutral-300">
                                                <PhotoIcon />
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setProduitPhotosAGerer(produit)}
                                        aria-label="Gérer les photos"
                                        title="Gérer les photos"
                                        className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-black text-white shadow-sm ring-2 ring-white hover:bg-neutral-700"
                                    >
                                        <CameraIcon />
                                    </button>
                                </div>

                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-semibold text-neutral-800">{produit.nom}</p>
                                    <p className="truncate text-xs text-neutral-500">{produit.categorie?.nom}</p>
                                </div>

                                <div className="shrink-0 text-right">
                                    {produit.en_promotion ? (
                                        <>
                                            <p className="text-sm font-bold text-black">{formatPrice(produit.prix_promo!)}</p>
                                            <p className="text-xs text-neutral-400 line-through">{formatPrice(produit.prix)}</p>
                                        </>
                                    ) : (
                                        <p className="text-sm font-bold text-black">{formatPrice(produit.prix)}</p>
                                    )}
                                </div>

                                <div className="shrink-0">
                                    {!produit.disponible ? (
                                        <span className="rounded-sm bg-neutral-200 px-2 py-1 text-[10px] font-bold uppercase text-neutral-600">
                                            Masqué
                                        </span>
                                    ) : stock === 0 ? (
                                        <span className="rounded-sm bg-red-100 px-2 py-1 text-[10px] font-bold uppercase text-red-600">
                                            Épuisé
                                        </span>
                                    ) : (
                                        <span className="rounded-sm bg-green-100 px-2 py-1 text-[10px] font-bold uppercase text-green-700">
                                            {stock} en stock
                                        </span>
                                    )}
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setProduitPrixAModifier(produit)}
                                    aria-label="Changer le prix"
                                    title="Changer le prix"
                                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-black"
                                >
                                    <TagIcon />
                                </button>

                                <RowActions
                                    onEdit={() => setFormulaire({ produit })}
                                    onDelete={() => setProduitASupprimer(produit)}
                                />
                            </div>
                        );
                    })}
                </div>
            </ListShell>

            {formulaire && (
                <FormulaireProduit
                    produit={formulaire.produit}
                    onClose={() => setFormulaire(null)}
                    onSuccess={() => { setFormulaire(null); refetch(); }}
                    onRefetchListe={refetch}
                />
            )}

            {produitPrixAModifier && (
                <ModifierPrixRapide
                    produit={produitPrixAModifier}
                    onClose={() => setProduitPrixAModifier(null)}
                    onSuccess={() => { setProduitPrixAModifier(null); refetch(); }}
                />
            )}

            {produitPhotosAGerer && (
                <GestionPhotosModal
                    produit={produitPhotosAGerer}
                    onClose={() => setProduitPhotosAGerer(null)}
                    onChange={refetch}
                />
            )}

            <ConfirmDeleteModal
                open={!!produitASupprimer}
                onClose={() => { setProduitASupprimer(null); setErreurSuppression(null); }}
                onConfirm={confirmerSuppression}
                envoiEnCours={suppressionEnCours}
                erreur={erreurSuppression}
                message={<>Supprimer <span className="font-semibold">{produitASupprimer?.nom}</span> ? Cette action est définitive.</>}
            />
        </>
    );
}

function ModifierPrixRapide({
    produit,
    onClose,
    onSuccess,
}: {
    produit: Produit;
    onClose: () => void;
    onSuccess: () => void;
}) {
    const [prix, setPrix] = useState(produit.prix);
    const [prixPromo, setPrixPromo] = useState(produit.prix_promo ?? "");
    const [envoiEnCours, setEnvoiEnCours] = useState(false);
    const [erreur, setErreur] = useState<string | null>(null);

    const soumettre = async (e: React.FormEvent) => {
        e.preventDefault();
        setEnvoiEnCours(true);
        setErreur(null);

        try {
            await api(`/api/produits/${produit.slug}/prix`, {
                method: "PATCH",
                body: {
                    prix: Number(prix),
                    prix_promo: prixPromo ? Number(prixPromo) : null,
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
        <FormModal
            open
            onClose={onClose}
            onSubmit={soumettre}
            titre={`Changer le prix — ${produit.nom}`}
            erreur={erreur}
            envoiEnCours={envoiEnCours}
            libelleSubmit="Enregistrer"
            libelleSubmitEnCours="Enregistrement..."
        >
            <TextField label="Prix (FCFA)" type="number" value={prix} onChange={setPrix} required />
            <TextField
                label="Prix en promotion (optionnel)"
                type="number"
                value={prixPromo}
                onChange={setPrixPromo}
                helperText="Laisse vide s'il n'y a pas de promotion en ce moment."
            />
        </FormModal>
    );
}

function GestionPhotosModal({
    produit,
    onClose,
    onChange,
}: {
    produit: Produit;
    onClose: () => void;
    onChange: () => void;
}) {
    const [images, setImages] = useState<ImageProduit[]>(produit.images ?? []);

    return (
        <Modal open onClose={onClose}>
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide">Photos — {produit.nom}</h2>

            <GestionPhotos
                produit={produit}
                images={images}
                onImagesChange={(nouvelles) => { setImages(nouvelles); onChange(); }}
            />

            <div className="mt-2 flex justify-end">
                <button
                    type="button"
                    onClick={onClose}
                    className="rounded-sm bg-black px-4 py-2 text-xs font-bold uppercase tracking-wide text-white hover:bg-neutral-800"
                >
                    Terminé
                </button>
            </div>
        </Modal>
    );
}

type LigneDeclinaison = { valeur: string; quantite: number };
type PhotoEnAttente = { id: string; fichier: File; apercu: string };

function FormulaireProduit({
    produit,
    onClose,
    onSuccess,
    onRefetchListe,
}: {
    produit: Produit | null;
    onClose: () => void;
    onSuccess: () => void;
    onRefetchListe: () => void;
}) {
    const [produitCree, setProduitCree] = useState<Produit | null>(produit);
    const estEdition = produit !== null;

    const [nom, setNom] = useState(produit?.nom ?? "");
    const [categorieId, setCategorieId] = useState(produit?.categorie_id.toString() ?? "");
    const [description, setDescription] = useState(produit?.description ?? "");
    const [prix, setPrix] = useState(produit?.prix ?? "");
    const [prixPromo, setPrixPromo] = useState(produit?.prix_promo ?? "");
    const [visible, setVisible] = useState(produit?.disponible ?? true);
    const [misEnAvant, setMisEnAvant] = useState(produit?.mis_en_avant ?? false);
    const [plusieursTailles, setPlusieursTailles] = useState(!!produit?.declinaisons?.length);
    const [quantite, setQuantite] = useState(produit?.quantite ?? 0);

    const [declinaisons, setDeclinaisons] = useState<LigneDeclinaison[]>(() => {
        const existantes = produit?.declinaisons?.map((d) => ({ valeur: d.valeur, quantite: d.quantite })) ?? [];
        return [...existantes, { valeur: "", quantite: 0 }];
    });

    const [imagesExistantes, setImagesExistantes] = useState<ImageProduit[]>(produit?.images ?? []);
    const [photosEnAttente, setPhotosEnAttente] = useState<PhotoEnAttente[]>([]);

    const [indexDeclinaisonASupprimer, setIndexDeclinaisonASupprimer] = useState<number | null>(null);

    const [envoiEnCours, setEnvoiEnCours] = useState(false);
    const [erreur, setErreur] = useState<string | null>(null);

    const refsValeur = useRef<(HTMLInputElement | null)[]>([]);
    const refsQuantite = useRef<(HTMLInputElement | null)[]>([]);
    const demandeFocusProchaineLigne = useRef(false);
    const longueurPrecedente = useRef(declinaisons.length);

    useEffect(() => {
        if (demandeFocusProchaineLigne.current && declinaisons.length > longueurPrecedente.current) {
            refsValeur.current[declinaisons.length - 1]?.focus();
        }
        demandeFocusProchaineLigne.current = false;
        longueurPrecedente.current = declinaisons.length;
    }, [declinaisons.length]);

    useEffect(() => {
        return () => photosEnAttente.forEach((p) => URL.revokeObjectURL(p.apercu));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const ajouterLigneDeclinaison = () => {
        setDeclinaisons((prev) => {
            const derniere = prev[prev.length - 1];
            if (derniere && derniere.valeur === "" && derniere.quantite === 0) {
                return prev;
            }
            return [...prev, { valeur: "", quantite: 0 }];
        });
        demandeFocusProchaineLigne.current = true;
    };

    const modifierLigneDeclinaison = (i: number, champ: keyof LigneDeclinaison, valeurBrute: string) => {
        setDeclinaisons((prev) => {
            const copie = prev.map((d, idx) => {
                if (idx !== i) return d;
                if (champ === "quantite") {
                    return { ...d, quantite: valeurBrute === "" ? 0 : Number(valeurBrute) || 0 };
                }
                return { ...d, valeur: valeurBrute };
            });

            const estDerniereLigne = i === copie.length - 1;
            const ligneEstRemplie = copie[i].valeur !== "" || copie[i].quantite !== 0;

            if (estDerniereLigne && ligneEstRemplie) {
                return [...copie, { valeur: "", quantite: 0 }];
            }
            return copie;
        });
    };

    const retirerLigneDeclinaison = (i: number) => setDeclinaisons((prev) => prev.filter((_, idx) => idx !== i));

    const gererTouchesValeur = (e: React.KeyboardEvent<HTMLInputElement>, i: number) => {
        const curseurEnFin = e.currentTarget.selectionStart === e.currentTarget.value.length;
        if (e.key === "Enter" || (e.key === "ArrowRight" && curseurEnFin)) {
            e.preventDefault();
            refsQuantite.current[i]?.focus();
        }
    };

    const gererTouchesQuantite = (e: React.KeyboardEvent<HTMLInputElement>, i: number) => {
        if (e.key === "Enter") {
            e.preventDefault();
            if (i === declinaisons.length - 1) {
                ajouterLigneDeclinaison();
            } else {
                refsValeur.current[i + 1]?.focus();
            }
        }
    };

    const soumettre = async (e: React.FormEvent) => {
        e.preventDefault();
        setEnvoiEnCours(true);
        setErreur(null);

        const body = {
            categorie_id: Number(categorieId),
            nom,
            description: description || null,
            prix: Number(prix),
            prix_promo: prixPromo ? Number(prixPromo) : null,
            disponible: visible,
            mis_en_avant: misEnAvant,
            quantite: plusieursTailles ? 0 : quantite,
            declinaisons: plusieursTailles ? declinaisons.filter((d) => d.valeur.trim() !== "") : [],
        };

        try {
            if (produitCree) {
                await api(`/api/produits/${produitCree.slug}`, { method: "PUT", body });
                onSuccess();
                return;
            }

            const nouveauProduit = await api<Produit>("/api/produits", { method: "POST", body });
            onRefetchListe();

            if (photosEnAttente.length === 0) {
                onSuccess();
                return;
            }

            try {
                const formData = new FormData();
                photosEnAttente.forEach((p) => formData.append("images[]", p.fichier));
                await api(`/api/produits/${nouveauProduit.slug}/images`, { method: "POST", body: formData });
                onSuccess();
            } catch {
                setProduitCree(nouveauProduit);
                setErreur("Le produit a été créé, mais l'envoi des photos a échoué. Réessaie ci-dessous.");
            }
        } catch (err) {
            setErreur(extraireMessageErreur(err));
        } finally {
            setEnvoiEnCours(false);
        }
    };

    return (
        <>
            <FormModal
                open
                onClose={onClose}
                onSubmit={soumettre}
                titre={estEdition ? "Modifier le produit" : "Nouveau produit"}
                erreur={erreur}
                envoiEnCours={envoiEnCours}
                libelleSubmit={produitCree ? "Enregistrer" : "Créer le produit"}
                libelleSubmitEnCours="Enregistrement..."
            >
                <TextField label="Nom du produit" value={nom} onChange={setNom} required />

                <SelecteurCategorie categorieId={categorieId} onChange={setCategorieId} />

                <TextareaField label="Description (optionnel)" value={description} onChange={setDescription} />
                <TextField label="Prix (FCFA)" type="number" value={prix} onChange={setPrix} required />
                <TextField
                    label="Prix en promotion (optionnel)"
                    type="number"
                    value={prixPromo}
                    onChange={setPrixPromo}
                    helperText="Laisse vide s'il n'y a pas de promotion en ce moment."
                />

                <ToggleField
                    label="Ce produit existe en plusieurs tailles ou pointures"
                    checked={plusieursTailles}
                    onChange={setPlusieursTailles}
                />

                {plusieursTailles ? (
                    <div className="mb-3 rounded-md border border-neutral-200 p-3">
                        {declinaisons.map((d, i) => (
                            <div key={i} className="mb-2 flex items-center gap-2">
                                <input
                                    ref={(el) => { refsValeur.current[i] = el; }}
                                    type="text"
                                    value={d.valeur}
                                    onChange={(e) => modifierLigneDeclinaison(i, "valeur", e.target.value)}
                                    onKeyDown={(e) => gererTouchesValeur(e, i)}
                                    placeholder="Ex : 42, M..."
                                    className="w-28 rounded-sm border border-neutral-300 px-2 py-1.5 text-sm"
                                />
                                <input
                                    ref={(el) => { refsQuantite.current[i] = el; }}
                                    type="number"
                                    min={0}
                                    value={d.quantite}
                                    onChange={(e) => modifierLigneDeclinaison(i, "quantite", e.target.value)}
                                    onKeyDown={(e) => gererTouchesQuantite(e, i)}
                                    onFocus={(e) => e.target.select()}
                                    placeholder="Quantité"
                                    className="w-28 rounded-sm border border-neutral-300 px-2 py-1.5 text-sm"
                                />
                                <button type="button" onClick={() => setIndexDeclinaisonASupprimer(i)} className="text-red-400 hover:text-red-600">
                                    <SmallTrashIcon />
                                </button>
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={ajouterLigneDeclinaison}
                            className="text-xs font-semibold text-neutral-600 hover:text-black hover:underline"
                        >
                            + Ajouter une taille
                        </button>
                        <p className="mt-1 text-xs text-neutral-400">
                            Astuce : Entrée (ou flèche droite) passe à la case suivante. Une nouvelle ligne apparaît automatiquement dès que tu remplis la dernière.
                        </p>
                    </div>
                ) : (
                    <TextField label="Quantité en stock" type="number" value={quantite.toString()} onChange={(v) => setQuantite(Number(v) || 0)} />
                )}

                <ToggleField label="Visible sur le site" checked={visible} onChange={setVisible} />
                <ToggleField label="Mettre en avant sur la page d'accueil" checked={misEnAvant} onChange={setMisEnAvant} />

                {produitCree ? (
                    <GestionPhotos
                        produit={produitCree}
                        images={imagesExistantes}
                        onImagesChange={(nouvelles) => { setImagesExistantes(nouvelles); onRefetchListe(); }}
                    />
                ) : (
                    <SelecteurPhotosLocal photos={photosEnAttente} onChange={setPhotosEnAttente} />
                )}
            </FormModal>

            <ConfirmDeleteModal
                open={indexDeclinaisonASupprimer !== null}
                onClose={() => setIndexDeclinaisonASupprimer(null)}
                onConfirm={() => {
                    if (indexDeclinaisonASupprimer !== null) retirerLigneDeclinaison(indexDeclinaisonASupprimer);
                    setIndexDeclinaisonASupprimer(null);
                }}
                envoiEnCours={false}
                erreur={null}
                libelleConfirm="Retirer"
                message={
                    <>
                        Retirer la taille{" "}
                        <span className="font-semibold">
                            {indexDeclinaisonASupprimer !== null ? (declinaisons[indexDeclinaisonASupprimer]?.valeur || "sans nom") : ""}
                        </span> ?
                    </>
                }
            />
        </>
    );
}

function SelecteurCategorie({
    categorieId,
    onChange,
}: {
    categorieId: string;
    onChange: (id: string) => void;
}) {
    const { categories, refetch } = useCategories();
    const [ajoutOuvert, setAjoutOuvert] = useState(false);

    const optionsCategories = categories.flatMap((racine) => [
        { value: racine.id.toString(), label: racine.nom },
        ...(racine.enfants ?? []).map((enfant) => ({ value: enfant.id.toString(), label: `— ${enfant.nom}` })),
    ]);

    return (
        <div className="mb-3">
            <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-700">Catégorie</span>
                <button
                    type="button"
                    onClick={() => setAjoutOuvert((v) => !v)}
                    className="text-xs font-semibold text-neutral-500 hover:text-black hover:underline"
                >
                    {ajoutOuvert ? "Annuler" : "+ Nouvelle catégorie"}
                </button>
            </div>

            <select
                value={categorieId}
                onChange={(e) => onChange(e.target.value)}
                className="w-full rounded-sm border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-black focus:outline-none"
            >
                <option value="">Choisir une catégorie...</option>
                {optionsCategories.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                ))}
            </select>

            {ajoutOuvert && (
                <CreationRapideCategorie
                    categoriesRacines={categories}
                    onCreee={(nouvelle) => {
                        onChange(nouvelle.id.toString());
                        setAjoutOuvert(false);
                        refetch();
                    }}
                />
            )}
        </div>
    );
}

function CreationRapideCategorie({
    categoriesRacines,
    onCreee,
}: {
    categoriesRacines: Categorie[];
    onCreee: (nouvelle: Categorie) => void;
}) {
    const [nom, setNom] = useState("");
    const [parentId, setParentId] = useState("");
    const [envoiEnCours, setEnvoiEnCours] = useState(false);
    const [erreur, setErreur] = useState<string | null>(null);

    const creer = async () => {
        if (!nom.trim()) return;
        setEnvoiEnCours(true);
        setErreur(null);
        try {
            const nouvelle = await api<Categorie>("/api/categories", {
                method: "POST",
                body: { nom, categorie_parente_id: parentId ? Number(parentId) : null },
            });
            onCreee(nouvelle);
        } catch (err) {
            setErreur(extraireMessageErreur(err));
        } finally {
            setEnvoiEnCours(false);
        }
    };

    return (
        <div className="mt-2 rounded-md border border-neutral-200 bg-neutral-50 p-3">
            {erreur && <p className="mb-2 text-xs font-semibold text-red-600">{erreur}</p>}

            <input
                type="text"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                placeholder="Nom de la nouvelle catégorie"
                className="mb-2 w-full rounded-sm border border-neutral-300 px-2 py-1.5 text-sm"
            />

            <select
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
                className="mb-2 w-full rounded-sm border border-neutral-300 bg-white px-2 py-1.5 text-sm"
            >
                <option value="">— Catégorie principale (sans parent) —</option>
                {categoriesRacines.filter((c) => !c.categorie_parente_id).map((c) => (
                    <option key={c.id} value={c.id}>Sous-catégorie de "{c.nom}"</option>
                ))}
            </select>

            <button
                type="button"
                onClick={creer}
                disabled={envoiEnCours || !nom.trim()}
                className="rounded-sm bg-black px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300"
            >
                {envoiEnCours ? "Création..." : "Créer et utiliser"}
            </button>
        </div>
    );
}

function SelecteurPhotosLocal({
    photos,
    onChange,
}: {
    photos: PhotoEnAttente[];
    onChange: (photos: PhotoEnAttente[]) => void;
}) {
    const [photoASupprimer, setPhotoASupprimer] = useState<PhotoEnAttente | null>(null);

    const ajouter = (files: FileList) => {
        const nouvelles: PhotoEnAttente[] = Array.from(files).map((f) => ({
            id: `${f.name}-${f.size}-${Date.now()}-${Math.random()}`,
            fichier: f,
            apercu: URL.createObjectURL(f),
        }));
        onChange([...photos, ...nouvelles]);
    };

    const confirmerRetrait = () => {
        if (!photoASupprimer) return;
        URL.revokeObjectURL(photoASupprimer.apercu);
        onChange(photos.filter((p) => p.id !== photoASupprimer.id));
        setPhotoASupprimer(null);
    };

    return (
        <div className="mb-3 rounded-md border border-neutral-200 p-3">
            <span className="mb-2 block text-xs font-semibold text-neutral-700">Photos</span>
            <div className="flex flex-wrap gap-2">
                {photos.map((p) => (
                    <div key={p.id} className="group relative h-16 w-16">
                        <img src={p.apercu} alt="" className="h-full w-full rounded-sm object-cover" />
                        <button
                            type="button"
                            onClick={() => setPhotoASupprimer(p)}
                            aria-label="Retirer cette photo"
                            className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow"
                        >
                            <SmallTrashIcon className="h-3 w-3" />
                        </button>
                    </div>
                ))}

                <label className="flex h-16 w-16 cursor-pointer items-center justify-center rounded-sm border-2 border-dashed border-neutral-300 text-neutral-400 hover:border-neutral-400 hover:text-neutral-600">
                    <span className="text-2xl leading-none">+</span>
                    <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => e.target.files && ajouter(e.target.files)}
                        className="hidden"
                    />
                </label>
            </div>

            <ConfirmDeleteModal
                open={!!photoASupprimer}
                onClose={() => setPhotoASupprimer(null)}
                onConfirm={confirmerRetrait}
                envoiEnCours={false}
                erreur={null}
                libelleConfirm="Retirer"
                message="Retirer cette photo ? Tu devras la resélectionner si c'est une erreur."
            />
        </div>
    );
}

function GestionPhotos({
    produit,
    images,
    onImagesChange,
}: {
    produit: Produit;
    images: ImageProduit[];
    onImagesChange: (images: ImageProduit[]) => void;
}) {
    const [envoiEnCours, setEnvoiEnCours] = useState(false);
    const [erreurUpload, setErreurUpload] = useState<string | null>(null);

    const [photoASupprimer, setPhotoASupprimer] = useState<ImageProduit | null>(null);
    const [suppressionEnCours, setSuppressionEnCours] = useState(false);
    const [erreurSuppression, setErreurSuppression] = useState<string | null>(null);

    const ajouterPhotos = async (files: FileList) => {
        const formData = new FormData();
        Array.from(files).forEach((f) => formData.append("images[]", f));

        setEnvoiEnCours(true);
        setErreurUpload(null);
        try {
            const nouvelles = await api<ImageProduit[]>(`/api/produits/${produit.slug}/images`, {
                method: "POST",
                body: formData,
            });
            onImagesChange([...images, ...nouvelles]);
        } catch (err) {
            setErreurUpload(extraireMessageErreur(err));
        } finally {
            setEnvoiEnCours(false);
        }
    };

    const confirmerSuppressionPhoto = async () => {
        if (!photoASupprimer) return;
        setSuppressionEnCours(true);
        setErreurSuppression(null);
        try {
            await api(`/api/images/${photoASupprimer.id}`, { method: "DELETE" });
            onImagesChange(images.filter((img) => img.id !== photoASupprimer.id));
            setPhotoASupprimer(null);
        } catch (err) {
            setErreurSuppression(extraireMessageErreur(err));
        } finally {
            setSuppressionEnCours(false);
        }
    };

    return (
        <div className="mb-3 rounded-md border border-neutral-200 p-3">
            <span className="mb-2 block text-xs font-semibold text-neutral-700">Photos</span>

            {erreurUpload && <p className="mb-2 text-xs font-semibold text-red-600">{erreurUpload}</p>}

            <div className="flex flex-wrap gap-2">
                {images.map((img) => (
                    <div key={img.id} className="group relative h-16 w-16">
                        <img src={img.url} alt="" className="h-full w-full rounded-sm object-cover" />
                        <button
                            type="button"
                            onClick={() => setPhotoASupprimer(img)}
                            aria-label="Supprimer cette photo"
                            className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow"
                        >
                            <SmallTrashIcon className="h-3 w-3" />
                        </button>
                    </div>
                ))}

                <label className="flex h-16 w-16 cursor-pointer items-center justify-center rounded-sm border-2 border-dashed border-neutral-300 text-neutral-400 hover:border-neutral-400 hover:text-neutral-600">
                    {envoiEnCours ? (
                        <span className="text-[10px]">...</span>
                    ) : (
                        <span className="text-2xl leading-none">+</span>
                    )}
                    <input
                        type="file"
                        accept="image/*"
                        multiple
                        disabled={envoiEnCours}
                        onChange={(e) => e.target.files && ajouterPhotos(e.target.files)}
                        className="hidden"
                    />
                </label>
            </div>

            <ConfirmDeleteModal
                open={!!photoASupprimer}
                onClose={() => { setPhotoASupprimer(null); setErreurSuppression(null); }}
                onConfirm={confirmerSuppressionPhoto}
                envoiEnCours={suppressionEnCours}
                erreur={erreurSuppression}
                message="Supprimer cette photo ? Cette action est définitive."
            />
        </div>
    );
}

function PhotoIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
            strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="M21 15l-5-5L5 21" />
        </svg>
    );
}

function CameraIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2Z" />
            <circle cx="12" cy="13" r="4" />
        </svg>
    );
}

function TagIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
            strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
            <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" />
            <circle cx="7" cy="7" r="1" fill="currentColor" stroke="none" />
        </svg>
    );
}

function SmallTrashIcon({ className = "h-4 w-4" }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M3 6h18" />
            <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
        </svg>
    );
}