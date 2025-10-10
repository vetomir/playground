import BigNumber from 'bignumber.js';

export interface FormatShape {
    prefix?: string;
    decimalSeparator?: string;
    groupSize?: number;
    groupSeparator?: string;
    suffix?: string;
}

const DEFAULT_FMT: Required<FormatShape> = {
    prefix: '',
    decimalSeparator: '.',
    groupSize: 3,
    groupSeparator: ',',
    suffix: '',
};

const UNITS: Record<'$' | '$k' | '$M' | '$B', number> = {
    $: 1,
    $k: 1_000,
    $M: 1_000_000,
    $B: 1_000_000_000,
};

// Cache dla regexów - unikamy tworzenia nowych przy każdym wywołaniu
const regexCache = new Map<string, RegExp>();

function getCachedRegex(pattern: string, flags?: string): RegExp {
    const key = `${pattern}::${flags ?? ''}`;
    if (!regexCache.has(key)) {
        regexCache.set(key, new RegExp(pattern, flags));
    }
    return regexCache.get(key)!;
}

function normalizeNegativeZero(value: string): string {
    return value.replace(getCachedRegex('^-0(\\.0+)?$'), '0$1');
}

function finalize(out: string, fmt: Required<FormatShape>): string {
    const normalized = normalizeNegativeZero(out);
    // Optymalizacja: jeśli brak prefix/suffix, zwróć od razu
    if (!fmt.prefix && !fmt.suffix) return normalized;
    return fmt.prefix + normalized + fmt.suffix;
}

function groupThousands(intPart: string, groupSize: number, groupSep: string): string {
    // Early return dla edge cases
    if (groupSize <= 0 || !groupSep || intPart.length <= groupSize) return intPart;

    const isNegative = intPart[0] === '-';
    const digits = isNegative ? intPart.slice(1) : intPart;

    // Optymalizacja: jeśli liczba cyfr <= groupSize, nie grupuj
    if (digits.length <= groupSize) return intPart;

    const pattern = `\\B(?=(\\d{${groupSize}})+(?!\\d))`;
    const grouped = digits.replace(getCachedRegex(pattern, 'g'), groupSep);

    return isNegative ? '-' + grouped : grouped;
}

function mergeFormat(custom?: FormatShape): Required<FormatShape> {
    // Optymalizacja: jeśli brak customizacji, zwróć default
    if (!custom || Object.keys(custom).length === 0) return DEFAULT_FMT;
    return { ...DEFAULT_FMT, ...custom };
}

export function formatMoneyPrecise(
    value: number | string,
    unit: '$' | '$k' | '$M' | '$B' = '$',
    decimalPlaces: number = 0,
    roundingMode: BigNumber.RoundingMode = BigNumber.ROUND_HALF_UP,
    fmt?: FormatShape
): string {
    const F = mergeFormat(fmt);
    const places = Math.max(0, Math.floor(decimalPlaces)); // Walidacja + zaokrąglenie

    try {
        const bnFmt = {
            prefix: '',
            decimalSeparator: F.decimalSeparator,
            groupSize: F.groupSize,
            groupSeparator: F.groupSeparator,
            suffix: '',
        };
        const out = new BigNumber(value)
            .dividedBy(UNITS[unit])
            .toFormat(places, roundingMode, bnFmt);
        return finalize(out, F);
    } catch {
        return finalize('-', F);
    }
}

export function formatMoneyFast(
    value: number | string,
    unit: '$' | '$k' | '$M' | '$B' = '$',
    decimalPlaces: number = 0,
    fmt?: FormatShape
): string {
    const F = mergeFormat(fmt);
    const places = Math.max(0, Math.floor(decimalPlaces)); // Walidacja + zaokrąglenie

    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (!isFinite(num)) return finalize('-', F); // isFinite łapie też NaN i Infinity

    const divided = num / UNITS[unit];
    const fixed = divided.toFixed(places);

    const dotIndex = fixed.indexOf('.');
    let intPart = dotIndex === -1 ? fixed : fixed.slice(0, dotIndex);
    let fracPart = dotIndex === -1 ? '' : fixed.slice(dotIndex + 1);

    intPart = groupThousands(intPart, F.groupSize, F.groupSeparator);

    let out = fracPart ? intPart + F.decimalSeparator + fracPart : intPart;

    // Trimming zer tylko jeśli są miejsca dziesiętne
    if (places > 0 && fracPart) {
        const escSep = F.decimalSeparator.replace(getCachedRegex('[.*+?^${}()|[\\]\\\\]', 'g'), '\\$&');
        const trimPattern = `(${escSep}\\d*?)0+$`;
        const endPattern = `${escSep}$`;

        out = out
            .replace(getCachedRegex(trimPattern), '$1')
            .replace(getCachedRegex(endPattern), '');
    }

    return finalize(out, F);
}

export function formatMoney(
    value: number | string | undefined,
    unit: '$' | '$k' | '$M' | '$B' = '$',
    decimalPlaces: number = 0,
    precise: boolean = false,
    roundingMode: BigNumber.RoundingMode = BigNumber.ROUND_HALF_UP,
    fmt?: FormatShape
): string {
    if (value == null) return finalize('-', mergeFormat(fmt)); // == łapie undefined i null

    return precise
        ? formatMoneyPrecise(value, unit, decimalPlaces, roundingMode, fmt)
        : formatMoneyFast(value, unit, decimalPlaces, fmt);
}
