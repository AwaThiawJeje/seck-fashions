type EtoilesProps = {
    valeur: number;
    taille?: "sm" | "md" | "lg";
    interactif?: boolean;
    onChange?: (valeur: number) => void;
};

const TAILLES = { sm: "h-3.5 w-3.5", md: "h-5 w-5", lg: "h-7 w-7" };

export default function Etoiles({ valeur, taille = "sm", interactif = false, onChange }: EtoilesProps) {
    const classe = TAILLES[taille];

    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((n) =>
                interactif ? (
                    <button
                        key={n}
                        type="button"
                        onClick={() => onChange?.(n)}
                        aria-label={`${n} étoile${n > 1 ? "s" : ""}`}
                        className="transition-transform hover:scale-110"
                    >
                        <EtoileIcon rempli={n <= valeur} className={classe} />
                    </button>
                ) : (
                    <EtoileIcon key={n} rempli={n <= Math.round(valeur)} className={classe} />
                )
            )}
        </div>
    );
}

function EtoileIcon({ rempli, className }: { rempli: boolean; className: string }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill={rempli ? "#f59e0b" : "none"}
            stroke="#f59e0b"
            strokeWidth="1.5"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M12 2.5l2.9 6.2 6.6.7-4.9 4.6 1.3 6.6L12 17.5l-5.9 3.1 1.3-6.6-4.9-4.6 6.6-.7L12 2.5z" />
        </svg>
    );
}
