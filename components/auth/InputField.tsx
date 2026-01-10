import React from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface InputFieldProps {
    label: string;
    type?: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
    required?: boolean;
    showPasswordToggle?: boolean;
    isPasswordVisible?: boolean;
    onTogglePassword?: () => void;
    id?: string;
}

export const InputField: React.FC<InputFieldProps> = ({
    label,
    type = "text",
    value,
    onChange,
    placeholder,
    required = false,
    showPasswordToggle = false,
    isPasswordVisible = false,
    onTogglePassword,
    id
}) => {
    // Generate a safe ID if one isn't provided, improving accessibility
    const inputId = id || label.toLowerCase().replace(/\s+/g, '-');

    return (
        <div className="relative group">
            <label
                htmlFor={inputId}
                className="absolute -top-2.5 left-3 bg-white dark:bg-neutral-900 px-1 text-xs font-semibold text-gray-700 dark:text-gray-300 z-10 transition-colors cursor-text"
            >
                {label}
            </label>
            <input
                id={inputId}
                type={showPasswordToggle ? (isPasswordVisible ? "text" : "password") : type}
                value={value}
                onChange={onChange}
                required={required}
                className="w-full px-4 py-3 bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-xl focus:ring-0 focus:border-gray-300 dark:focus:border-neutral-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-600 transition-all outline-none"
                placeholder={placeholder}
            />
            {showPasswordToggle && (
                <button
                    type="button"
                    onClick={onTogglePassword}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-600 transition-colors"
                    tabIndex={-1} // Prevent tabbing to this button before others? Actually tabbing to toggle is good.
                >
                    {isPasswordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
            )}
        </div>
    );
};
