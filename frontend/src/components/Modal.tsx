import { useEffect } from "react";
import type { ReactNode } from "react";

type ModalProps = {
    open: boolean;
    onClose: () => void;
    /** Faux pour les formulaires : un clic à côté ne doit pas faire perdre la saisie. */
    fermerSurFond?: boolean;
    children: ReactNode;
};

export default function Modal({ open, onClose, fermerSurFond = true, children }: ModalProps) {
    useEffect(() => {
        if (!open) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        document.addEventListener("keydown", onKeyDown);
        document.body.style.overflow = "hidden";
        return () => {
            document.removeEventListener("keydown", onKeyDown);
            document.body.style.overflow = "";
        };
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div
            onClick={fermerSurFond ? onClose : undefined}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-5 shadow-xl"
            >
                {children}
            </div>
        </div>
    );
}