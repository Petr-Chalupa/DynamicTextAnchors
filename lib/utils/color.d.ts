import { ColorValue } from "../types";
export declare function isValidHexColor(color: string): boolean;
export declare function invertHexColor(hex: string): ColorValue;
export declare function hexToRgb(hex: string): {
    r: number;
    g: number;
    b: number;
} | null;
export declare function rgbToHex(r: number, g: number, b: number): ColorValue;
export declare function generateRandomColor(): ColorValue;
export declare function adjustColorBrightness(hex: string, percent: number): ColorValue;
//# sourceMappingURL=color.d.ts.map