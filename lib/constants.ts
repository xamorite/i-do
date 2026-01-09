
export type CategoryType = 'work' | 'personal' | 'health' | 'errands' | 'default';

export const CATEGORY_CONFIG: Record<string, {
    color: string;
    bgColor: string;
    borderColor: string;
    label: string;
}> = {
    work: {
        color: 'text-blue-600 dark:text-blue-400',
        bgColor: 'bg-blue-50 dark:bg-blue-900/20',
        borderColor: 'border-blue-200 dark:border-blue-800',
        label: 'Work',
    },
    personal: {
        color: 'text-green-600 dark:text-green-400',
        bgColor: 'bg-green-50 dark:bg-green-900/20',
        borderColor: 'border-green-200 dark:border-green-800',
        label: 'Personal',
    },
    health: {
        color: 'text-rose-600 dark:text-rose-400',
        bgColor: 'bg-rose-50 dark:bg-rose-900/20',
        borderColor: 'border-rose-200 dark:border-rose-800',
        label: 'Health',
    },
    errands: {
        color: 'text-orange-600 dark:text-orange-400',
        bgColor: 'bg-orange-50 dark:bg-orange-900/20',
        borderColor: 'border-orange-200 dark:border-orange-800',
        label: 'Errands',
    },
    default: {
        color: 'text-gray-600 dark:text-gray-400',
        bgColor: 'bg-gray-50 dark:bg-gray-900/20',
        borderColor: 'border-gray-200 dark:border-gray-800',
        label: 'General',
    }
};

export const getCategoryStyles = (category?: string) => {
    const key = category?.toLowerCase() || 'default';
    return CATEGORY_CONFIG[key] || CATEGORY_CONFIG['default'];
};
