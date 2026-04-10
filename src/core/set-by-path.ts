export function setByPath(obj: Record<string, any>, path: string, value: any): Record<string, any> {
    const result = {...obj};
    const keys = path.split('.');
    if (keys.length === 1) {
        result[keys[0]] = value;
        return result;
    }
    let current: any = result;
    for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = current[keys[i]] ? {...current[keys[i]]} : {};
        current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    return result;
}
