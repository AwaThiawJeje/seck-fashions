type BoutonVoirPlusProps = {
    visible: boolean;
    chargement: boolean;
    erreur: boolean;
    onClick: () => void;
};

export default function BoutonVoirPlus({ visible, chargement, erreur, onClick }: BoutonVoirPlusProps) {
    if (!visible) return null;

    return (
        <div className="mt-6 flex flex-col items-center gap-2">
            {erreur && (
                <p className="text-xs font-semibold text-red-600">
                    Impossible de charger la suite. Vérifie ta connexion puis réessaie.
                </p>
            )}
            <button
                type="button"
                onClick={onClick}
                disabled={chargement}
                className="rounded-sm border border-black bg-white px-6 py-2.5 text-xs font-bold uppercase tracking-wide text-black transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:border-neutral-300 disabled:text-neutral-400"
            >
                {chargement ? "Chargement..." : "Voir plus"}
            </button>
        </div>
    );
}