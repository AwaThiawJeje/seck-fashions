import type { ReactNode } from "react";

type ListShellProps = {
    titre: string;
    libelleNouveau?: string;
    onNouveau?: () => void;
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
    loading,
    error,
    estVide,
    messageVide = "Rien pour le moment.",
    children,
}: ListShellProps) {
    return (
        <div>
            <div className="mb-4 flex items-center justify-between">
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