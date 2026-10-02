type RowActionsProps = {
    onEdit?: () => void;
    onDelete?: () => void;
};

export default function RowActions({ onEdit, onDelete }: RowActionsProps) {
    return (
        <div className="flex items-center gap-1">
            {onEdit && (
                <button
                    type="button"
                    onClick={onEdit}
                    aria-label="Modifier"
                    title="Modifier"
                    className="flex h-9 w-9 items-center justify-center rounded-sm text-orange-500 transition-colors hover:bg-orange-50"
                >
                    <PencilIcon />
                </button>
            )}
            {onDelete && (
                <button
                    type="button"
                    onClick={onDelete}
                    aria-label="Supprimer"
                    title="Supprimer"
                    className="flex h-9 w-9 items-center justify-center rounded-sm text-red-500 transition-colors hover:bg-red-50"
                >
                    <TrashIcon />
                </button>
            )}
        </div>
    );
}

function PencilIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
            strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
        </svg>
    );
}

function TrashIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
            strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
            <path d="M3 6h18" />
            <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6" />
            <path d="M14 11v6" />
        </svg>
    );
}