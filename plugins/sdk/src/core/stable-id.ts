export const createStableId = (name: string, args: Record<string, unknown>): string => {
    const input = name + JSON.stringify(args, Object.keys(args).sort());
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
        const char = input.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return `call_${Math.abs(hash).toString(16)}`;
};
