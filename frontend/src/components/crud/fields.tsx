type TextFieldProps = {
    label: string;
    value: string;
    onChange: (value: string) => void;
    type?: string;
    required?: boolean;
    helperText?: string;
};

export function TextField({ label, value, onChange, type = "text", required, helperText }: TextFieldProps) {
    return (
        <label className="mb-3 block">
            <span className="mb-1 block text-xs font-semibold text-neutral-700">{label}</span>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                required={required}
                className="w-full rounded-sm border border-neutral-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
            />
            {helperText && <span className="mt-1 block text-xs text-neutral-400">{helperText}</span>}
        </label>
    );
}

type TextareaFieldProps = {
    label: string;
    value: string;
    onChange: (value: string) => void;
    rows?: number;
};

export function TextareaField({ label, value, onChange, rows = 3 }: TextareaFieldProps) {
    return (
        <label className="mb-3 block">
            <span className="mb-1 block text-xs font-semibold text-neutral-700">{label}</span>
            <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                rows={rows}
                className="w-full rounded-sm border border-neutral-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
            />
        </label>
    );
}

type SelectFieldProps = {
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: { value: string; label: string }[];
    placeholder?: string;
    disabled?: boolean;
    helperText?: string;
};

export function SelectField({ label, value, onChange, options, placeholder, disabled, helperText }: SelectFieldProps) {
    return (
        <label className="mb-3 block">
            <span className="mb-1 block text-xs font-semibold text-neutral-700">{label}</span>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                className="w-full rounded-sm border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-black focus:outline-none disabled:bg-neutral-100 disabled:text-neutral-400"
            >
                {placeholder && <option value="">{placeholder}</option>}
                {options.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                ))}
            </select>
            {helperText && <span className="mt-1 block text-xs text-neutral-400">{helperText}</span>}
        </label>
    );
}

type ToggleFieldProps = {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
};

export function ToggleField({ label, checked, onChange }: ToggleFieldProps) {
    return (
        <label className="mb-3 flex items-center gap-2">
            <input
                type="checkbox"
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                className="h-4 w-4 rounded-sm border-neutral-300"
            />
            <span className="text-sm text-neutral-700">{label}</span>
        </label>
    );
}