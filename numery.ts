import BigNumber from 'bignumber.js';

/**
 * Configuration for number formatting output
 */
export interface FormatShape {
    prefix?: string;
    decimalSeparator?: string;
    groupSize?: number;
    groupSeparator?: string;
    suffix?: string;
    fallback?: string; // Value to return on error or invalid input
}

/**
 * Default formatting configuration (US/International style)
 */
const DEFAULT_FMT: Required<FormatShape> = {
    prefix: '',
    decimalSeparator: '.',
    groupSize: 3,
    groupSeparator: ',',
    suffix: '',
    fallback: '-', // Default fallback value
};

/**
 * Unit multipliers for different denominations
 */
const UNITS: Record<'$' | '$k' | '$M' | '$B', number> = {
    $: 1,
    $k: 1_000,
    $M: 1_000_000,
    $B: 1_000_000_000,
};

/**
 * Cache for compiled regex patterns to improve performance
 */
const regexCache = new Map<string, RegExp>();

/**
 * Returns cached regex or creates and caches a new one
 */
function getCachedRegex(pattern: string, flags?: string): RegExp {
    const key = `${pattern}::${flags ?? ''}`;
    if (!regexCache.has(key)) {
        regexCache.set(key, new RegExp(pattern, flags));
    }
    return regexCache.get(key)!;
}

/**
 * Converts negative zero values to positive zero (e.g., "-0.00" → "0.00")
 */
function normalizeNegativeZero(value: string): string {
    return value.replace(getCachedRegex('^-0(\\.0+)?$'), '0$1');
}

/**
 * Adds prefix/suffix and normalizes the output value
 */
function finalize(out: string, fmt: Required<FormatShape>): string {
    const normalized = normalizeNegativeZero(out);
    // Skip concatenation if no prefix/suffix defined
    if (!fmt.prefix && !fmt.suffix) return normalized;
    return fmt.prefix + normalized + fmt.suffix;
}

/**
 * Groups integer part with thousand separators (e.g., "1234567" → "1,234,567")
 * Handles negative numbers correctly by preserving the minus sign
 */
function groupThousands(intPart: string, groupSize: number, groupSep: string): string {
    // Early returns for cases where grouping isn't needed
    if (groupSize <= 0 || !groupSep || intPart.length <= groupSize) return intPart;

    const isNegative = intPart[0] === '-';
    const digits = isNegative ? intPart.slice(1) : intPart;

    // Skip grouping if number is too short
    if (digits.length <= groupSize) return intPart;

    const pattern = `\\B(?=(\\d{${groupSize}})+(?!\\d))`;
    const grouped = digits.replace(getCachedRegex(pattern, 'g'), groupSep);

    return isNegative ? '-' + grouped : grouped;
}

/**
 * Merges custom format with defaults, optimized for empty custom objects
 */
function mergeFormat(custom?: FormatShape): Required<FormatShape> {
    // Return default directly if no customization
    if (!custom || Object.keys(custom).length === 0) return DEFAULT_FMT;
    return { ...DEFAULT_FMT, ...custom };
}

/**
 * High-precision formatting using BigNumber library
 * Supports custom rounding modes and all format options
 * Use for financial calculations or when exact precision is required
 */
export function formatMoneyPrecise(
    value: number | string,
    unit: '$' | '$k' | '$M' | '$B' = '$',
    decimalPlaces: number = 0,
    roundingMode: BigNumber.RoundingMode = BigNumber.ROUND_HALF_UP,
    fmt?: FormatShape
): string {
    const F = mergeFormat(fmt);
    // Ensure decimal places is non-negative integer
    const places = Math.max(0, Math.floor(decimalPlaces));

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
        return F.fallback; // Return custom fallback on error
    }
}

/**
 * Fast formatting using native JavaScript number methods
 * ~10x faster than precise version but uses standard rounding
 * Trims trailing zeros automatically for cleaner output
 */
export function formatMoneyFast(
    value: number | string,
    unit: '$' | '$k' | '$M' | '$B' = '$',
    decimalPlaces: number = 0,
    fmt?: FormatShape
): string {
    const F = mergeFormat(fmt);
    // Ensure decimal places is non-negative integer
    const places = Math.max(0, Math.floor(decimalPlaces));

    const num = typeof value === 'string' ? parseFloat(value) : value;
    // Check for NaN, Infinity, and -Infinity
    if (!isFinite(num)) return F.fallback; // Return custom fallback

    const divided = num / UNITS[unit];
    const fixed = divided.toFixed(places);

    // Manual split is faster than array destructuring for large operations
    const dotIndex = fixed.indexOf('.');
    let intPart = dotIndex === -1 ? fixed : fixed.slice(0, dotIndex);
    let fracPart = dotIndex === -1 ? '' : fixed.slice(dotIndex + 1);

    intPart = groupThousands(intPart, F.groupSize, F.groupSeparator);

    let out = fracPart ? intPart + F.decimalSeparator + fracPart : intPart;

    // Trim trailing zeros only if we have decimal places and fractional part
    if (places > 0 && fracPart) {
        // Escape special regex characters in decimal separator
        const escSep = F.decimalSeparator.replace(getCachedRegex('[.*+?^${}()|[\\]\\\\]', 'g'), '\\$&');
        const trimPattern = `(${escSep}\\d*?)0+$`;
        const endPattern = `${escSep}$`;

        out = out
            .replace(getCachedRegex(trimPattern), '$1')  // Remove trailing zeros
            .replace(getCachedRegex(endPattern), '');     // Remove separator if no decimals left
    }

    return finalize(out, F);
}

/**
 * Main formatting function with automatic precision switching
 * @param value - Number or numeric string to format
 * @param unit - Unit denomination ($ = 1, $k = 1000, $M = million, $B = billion)
 * @param decimalPlaces - Number of decimal places to display
 * @param precise - If true, uses BigNumber for exact calculations; if false, uses fast native method
 * @param roundingMode - Rounding mode (only used when precise=true)
 * @param fmt - Custom formatting options (separators, prefix, suffix, fallback)
 * @returns Formatted string or fallback value if input is invalid
 */
export function formatMoney(
    value: number | string | undefined,
    unit: '$' | '$k' | '$M' | '$B' = '$',
    decimalPlaces: number = 0,
    precise: boolean = false,
    roundingMode: BigNumber.RoundingMode = BigNumber.ROUND_HALF_UP,
    fmt?: FormatShape
): string {
    const F = mergeFormat(fmt);
    // Handle null and undefined with loose equality check
    if (value == null) return F.fallback; // Return custom fallback

    return precise
        ? formatMoneyPrecise(value, unit, decimalPlaces, roundingMode, fmt)
        : formatMoneyFast(value, unit, decimalPlaces, fmt);
}
