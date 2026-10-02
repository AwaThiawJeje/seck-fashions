import type { ReactNode } from "react";
import Modal from "../Modal";

type ConfirmDeleteModalProps = {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    envoiEnCours: boolean;
    erreur: string | null;
    message: ReactNode;
    libelleConfirm?: string;
};

export default function ConfirmDeleteModal({
    open,
    onClose,
    onConfirm,
    envoiEnCours,
    erreur,
    message,
    libelleConfirm = "Supprimer",
}: ConfirmDeleteModalProps) {
    return (
        <Modal open={open} onClose={onClose}>
            <div className="text-sm text-neutral-800">{message}</div>

            {erreur && (
                <p className="mt-3 rounded-sm bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">{erreur}</p>
            )}

            <div className="mt-4 flex justify-end gap-2">
                <button
                    type="button"
                    onClick={onClose}
                    className="rounded-sm px-3 py-2 text-xs font-semibold text-neutral-500 hover:text-black"
                >
                    Annuler
                </button>
                <button
                    type="button"
                    onClick={onConfirm}
                    disabled={envoiEnCours}
                    className="rounded-sm border border-black bg-white px-4 py-2 text-xs font-semibold text-black hover:bg-neutral-50 disabled:cursor-not-allowed disabled:text-neutral-300"
                >
                    {envoiEnCours ? "Suppression..." : libelleConfirm}
                </button>
            </div>
        </Modal>
    );
}