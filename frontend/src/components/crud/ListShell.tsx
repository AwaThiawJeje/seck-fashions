import type { ReactNode } from "react";

type ListShellProps = {
    titre: string;
    libelleNouveau?: string;
    onNouveau?: () => void;
    entete?: ReactNode;
    loading: boolean;
    error: string | null;
    estVide: boolean;
    messageVide?: string;
    children: ReactNode;
};

export default function ListShell({
    titre,
    libelleNouveau,
    onNouveau,
    entete,
    loading,
    error,
    estVide,
    messageVide = "Rien pour le moment.",
    children,
}: ListShellProps) {
    return (
        <div>
            {/* Collé juste sous le header de l'admin (sticky top-14 = h-14 du header) pour que
                le bouton "+ Nouveau..." et les filtres restent accessibles pendant le scroll
                d'une longue liste. */}
            <div className="sticky top-14 z-20 -mx-4 bg-white px-4 pb-4 pt-3 lg:-mx-6 lg:px-6">
                <div className="flex items-center justify-between gap-2">
                    <h1 className="text-lg font-bold uppercase tracking-wide">{titre}</h1>
                    {onNouveau && (
                        <button
                            type="button"
                            onClick={onNouveau}
                            className="rounded-sm bg-black px-4 py-2 text-xs font-bold uppercase tracking-wide text-white hover:bg-neutral-800"
                        >
                            {libelleNouveau ?? "+ Nouveau"}
                        </button>
                    )}
                </div>

                {entete && <div className="mt-4">{entete}</div>}
            </div>

            {loading ? (
                <p className="text-sm text-neutral-500">Chargement...</p>
            ) : error ? (
                <p className="text-sm text-red-600">{error}</p>
            ) : estVide ? (
                <p className="text-sm text-neutral-500">{messageVide}</p>
            ) : (
                children
            )}
        </div>
    );
}