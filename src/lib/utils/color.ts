import { ColorValue } from "../types";

export function isValidHexColor(color: string): boolean {
    const hexColorRegex = /^#[0-9a-f]{3}([0-9a-f]{3})?$/i;
    const isValid = hexColorRegex.test(color);

    if (!isValid && typeof console !== "undefined") {
        console.warn(`Invalid hex color format: "${color}". Expected format: #RGB or #RRGGBB`);
    }

    return isValid;
}

export function invertHexColor(hex: string): ColorValue {
    if (!isValidHexColor(hex)) throw new Error(`Invalid hex color: ${hex}`);

    let cleanHex = hex.startsWith("#") ? hex.slice(1) : hex;

    // Convert 3-digit hex to 6-digit
    if (cleanHex.length === 3) {
        cleanHex = cleanHex
            .split("")
            .map((char) => char + char)
            .join("");
    }

    const r = parseInt(cleanHex.slice(0, 2), 16);
    const g = parseInt(cleanHex.slice(2, 4), 16);
    const b = parseInt(cleanHex.slice(4, 6), 16);

    // Use luminance formula to determine if color is light or dark
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;

    return luminance >= 128 ? "#000000" : "#FFFFFF";
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    if (!isValidHexColor(hex)) return null;

    let cleanHex = hex.startsWith("#") ? hex.slice(1) : hex;
    if (cleanHex.length === 3) {
        cleanHex = cleanHex
            .split("")
            .map((char) => char + char)
            .join("");
    }

    return {
        r: parseInt(cleanHex.slice(0, 2), 16),
        g: parseInt(cleanHex.slice(2, 4), 16),
        b: parseInt(cleanHex.slice(4, 6), 16),
    };
}

export function rgbToHex(r: number, g: number, b: number): ColorValue {
    const validate = (value: number, name: string) => {
        if (!Number.isInteger(value) || value < 0 || value > 255) {
            throw new Error(`${name} must be an integer between 0 and 255, got ${value}`);
        }
    };

    validate(r, "Red");
    validate(g, "Green");
    validate(b, "Blue");

    const toHex = (n: number) => n.toString(16).padStart(2, "0");
    return `#${toHex(r)}${toHex(g)}${toHex(b)}` as ColorValue;
}

export function generateRandomColor(): ColorValue {
    const randomValue = () => Math.floor(Math.random() * 256);
    return rgbToHex(randomValue(), randomValue(), randomValue());
}

export function adjustColorBrightness(hex: string, percent: number): ColorValue {
    const rgb = hexToRgb(hex);
    if (!rgb) throw new Error(`Invalid hex color: ${hex}`);

    const adjust = (value: number) => {
        const adjusted = Math.round(value * (1 + percent / 100));
        return Math.max(0, Math.min(255, adjusted));
    };

    return rgbToHex(adjust(rgb.r), adjust(rgb.g), adjust(rgb.b));
}
