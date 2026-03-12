export function sanitizeObject(obj: Record<string, any>) {
    return Object.entries(obj).reduce((acc, [key, value]) => {
        // Exclude null, undefined, and empty strings to use provider SDK defaults
        if (value != null && value !== '') {
            acc[key] = value;
        }
        return acc;
    }, {} as Record<string, any>);
}