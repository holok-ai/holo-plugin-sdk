// Helper function to parse boolean environment variables
export const parseBoolean = (value: string | undefined, defaultValue: boolean = false): boolean => {
    if (!value) return defaultValue;
    return value.toLowerCase() === 'true';
};

// Helper function to parse number environment variables
export const parseNumber = (value: string | undefined, defaultValue: number): number => {
    if (!value) return defaultValue;
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
};

// Helper function to parse array environment variables
export const parseArray = (value: string | undefined, defaultValue: string[] = []): string[] => {
    if (!value) return defaultValue;
    return value.split(',').map(item => item.trim());
};
