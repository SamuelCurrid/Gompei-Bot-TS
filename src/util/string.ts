export function partition(str: string, substring: string): [string, string] {
    const index = str.indexOf(substring);
    if (index === -1) {
        return [str, ''];
    }
    return [str.slice(0, index), str.slice(index + substring.length)];
}