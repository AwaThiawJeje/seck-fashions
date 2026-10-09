import { useEffect } from "react";
import type { ReactNode } from "react";

type DrawerProps = {
    open: boolean;
    onClose: () => void;
    titre: string;
    children: ReactNode;
};

/** Panneau qui glisse depuis la droite, sans fermer complètement la page derrière. */
export default function Drawer({ open, onClose, titre, children }: DrawerProps) {
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
        <div onClick={onClose} className="fixed inset-0 z-50 bg-black/50">
            <div
                onClick={(e) => e.stopPropagation()}
                className="ml-auto flex h-full w-full max-w-md flex-col bg-white shadow-xl animate-[drawer-in_0.2s_ease-out]"
            >
                <div className="flex shrink-0 items-center gap-3 border-b border-neutral-200 px-4 py-3">
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Fermer"
                        className="rounded-full p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-black"
                    >
                        <ArrowIcon />
                    </button>
                    <h2 className="text-sm font-bold uppercase tracking-wide">{titre}</h2>
                </div>
                <div className="flex-1 overflow-y-auto px-4 py-4">{children}</div>
            </div>
            <style>{`
                @keyframes drawer-in {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }
            `}</style>
        </div>
    );
}

function ArrowIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
            <path d="M5 12h14" />
            <path d="M12 5l7 7-7 7" />
        </svg>
    );
}
