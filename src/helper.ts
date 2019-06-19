export function isNumeric(val: any): boolean {
    return ((val != null) && !isNaN(Number(val.toString())))
}

export function isSpace(ch: any): boolean {
    return /\s/.test(ch);
}
