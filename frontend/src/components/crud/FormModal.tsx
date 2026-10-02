import type { ReactNode } from "react";
import Modal from "../Modal";

type FormModalProps = {
    open: boolean;
    onClose: () => void;
    onSubmit: (e: React.FormEvent) => void;
    titre: string;
    erreur: string | null;
    envoiEnCours: boolean;
    libelleSubmit: string;
    libelleSubmitEnCours: string;
    children: ReactNode;
};

export default function FormModal({
    open,
    onClose,
    onSubmit,
    titre,
    erreur,
    envoiEnCours,
    libelleSubmit,
    libelleSubmitEnCours,
    children,
}: FormModalProps) {
    return (
        <Modal open={open} onClose={onClose}>
            <form onSubmit={onSubmit}>
                <h2 className="mb-4 text-sm font-bold uppercase tracking-wide">{titre}</h2>

                {erreur && (
                    <p className="mb-3 rounded-sm bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">{erreur}</p>
                )}

                {children}

                <div className="mt-4 flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-sm px-3 py-2 text-xs font-semibold text-neutral-500 hover:text-black"
                    >
                        Annuler
                    </button>
                    <button
                        type="submit"
                        disabled={envoiEnCours}
                        className="rounded-sm bg-black px-4 py-2 text-xs font-bold uppercase tracking-wide text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300"
                    >
                        {envoiEnCours ? libelleSubmitEnCours : libelleSubmit}
                    </button>
                </div>
            </form>
        </Modal>
    );
}