declare module "arabic-persian-reshaper" {
  export const ArabicShaper: {
    convertArabic(input: string): string;
    convertArabicBack(input: string): string;
  };
}
