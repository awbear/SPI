export function isdigit(val: any) {
    // return ((val != null) && !isNaN(Number(val.toString())))
    return /^[0-9]{1,}$/.test(val);
}

export function isSpace(ch: any) {
    return /\s/.test(ch);
}

export function isalnum(ch: any) {
    return /^[a-z0-9]{1,}$/i.test(ch);
}

export function isalpha(ch: any) {
    return /^[a-z]{1,}$/i.test(ch);
}