import {diffLines} from 'diff';

export interface AssertionError {
    field: string;
    expected: any;
    actual: any;
    diff?: string;
}

export function assertEqual(field: string, actual: any, expected: any): AssertionError | null {
    if (actual === expected) return null;
    return {field, expected, actual};
}

export function assertDeepEqual(field: string, actual: any, expected: any): AssertionError | null {
    const actualStr = JSON.stringify(actual, null, 2);
    const expectedStr = JSON.stringify(expected, null, 2);
    if (actualStr === expectedStr) return null;

    const changes = diffLines(expectedStr, actualStr);
    const diffStr = changes.map(c => {
        const prefix = c.added ? '+' : c.removed ? '-' : ' ';
        return c.value.split('\n').filter(l => l).map(l => `${prefix} ${l}`).join('\n');
    }).join('\n');

    return {field, expected, actual, diff: diffStr};
}

export function assertPartialMatch(field: string, actual: Record<string, any>, expected: Record<string, any>): AssertionError | null {
    for (const [key, value] of Object.entries(expected)) {
        const err = assertDeepEqual(`${field}.${key}`, actual?.[key], value);
        if (err) return err;
    }
    return null;
}

export function assertArrayEqual(field: string, actual: string[], expected: string[]): AssertionError[] {
    const errors: AssertionError[] = [];

    if (actual.length !== expected.length) {
        errors.push({
            field: `${field}.length`,
            expected: expected.length,
            actual: actual.length,
        });
    }

    const len = Math.min(actual.length, expected.length);
    for (let i = 0; i < len; i++) {
        if (actual[i] !== expected[i]) {
            const changes = diffLines(expected[i], actual[i]);
            const diffStr = changes.map(c => {
                const prefix = c.added ? '+' : c.removed ? '-' : ' ';
                return c.value.split('\n').filter(l => l).map(l => `${prefix} ${l}`).join('\n');
            }).join('\n');

            errors.push({
                field: `${field}[${i}]`,
                expected: expected[i],
                actual: actual[i],
                diff: diffStr,
            });
        }
    }

    return errors;
}
