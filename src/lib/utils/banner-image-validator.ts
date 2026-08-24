/**
 * Banner Image Validation Rules & Aspect Ratio Checker
 * Banner must be strictly horizontal / landscape (ideal 16:9 to 21:9).
 */

export interface BannerDimensionResult {
  isValid: boolean;
  width: number;
  height: number;
  aspectRatio: number;
  aspectRatioLabel: string;
  error?: string;
}

export const MIN_BANNER_WIDTH = 600;
export const MIN_BANNER_HEIGHT = 250;
export const MIN_ASPECT_RATIO = 1.35; // Minimum horizontal ratio (e.g. 4:3 is 1.33 which is barely horizontal, 16:9 is 1.78)

/**
 * Calculates human-readable aspect ratio label
 */
export function getAspectRatioLabel(ratio: number): string {
  if (ratio >= 2.2) return '21:9 (Ultrawide)';
  if (ratio >= 1.7 && ratio <= 1.85) return '16:9 (Ideal Banner)';
  if (ratio >= 1.5 && ratio < 1.7) return '16:10 (Landscape)';
  if (ratio >= 1.3 && ratio < 1.5) return '4:3 (Landscape Standar)';
  if (ratio >= 0.95 && ratio <= 1.05) return '1:1 (Kotak / Square)';
  if (ratio < 0.95) return 'Portrait / Vertikal';
  return `${ratio.toFixed(2)}:1`;
}

/**
 * Loads an image from a File or URL and validates its dimensions and aspect ratio
 */
export function validateBannerImageDimensions(
  source: File | string
): Promise<BannerDimensionResult> {
  return new Promise((resolve) => {
    const isFile = typeof source !== 'string';
    const objectUrl = isFile ? URL.createObjectURL(source) : source;

    const img = new Image();

    img.onload = () => {
      const width = img.naturalWidth || img.width;
      const height = img.naturalHeight || img.height;

      if (isFile) {
        URL.revokeObjectURL(objectUrl);
      }

      if (!width || !height) {
        resolve({
          isValid: false,
          width: 0,
          height: 0,
          aspectRatio: 0,
          aspectRatioLabel: 'Tidak Valid',
          error: 'Dimensi gambar tidak terbaca.',
        });
        return;
      }

      const aspectRatio = Number((width / height).toFixed(2));
      const aspectRatioLabel = getAspectRatioLabel(aspectRatio);

      // Check 1: Minimum resolution
      if (width < MIN_BANNER_WIDTH || height < MIN_BANNER_HEIGHT) {
        resolve({
          isValid: false,
          width,
          height,
          aspectRatio,
          aspectRatioLabel,
          error: `Resolusi gambar terlalu kecil (${width}x${height}px). Minimal lebar ${MIN_BANNER_WIDTH}px dan tinggi ${MIN_BANNER_HEIGHT}px agar banner tampil tajam.`,
        });
        return;
      }

      // Check 2: Orientation & Aspect Ratio (Must be horizontal landscape)
      if (aspectRatio < MIN_ASPECT_RATIO) {
        let hint = 'Gambar berorientasi portrait atau kotak (1:1).';
        if (aspectRatio <= 1.05 && aspectRatio >= 0.95) {
          hint = 'Gambar berbentuk kotak sempurna (1:1).';
        } else if (aspectRatio < 1) {
          hint = 'Gambar berbentuk vertikal / portrait (tinggi > lebar).';
        }

        resolve({
          isValid: false,
          width,
          height,
          aspectRatio,
          aspectRatioLabel,
          error: `${hint} Banner promosi wajib berupa gambar horizontal/landscape (disarankan rasio 16:9 atau 21:9).`,
        });
        return;
      }

      resolve({
        isValid: true,
        width,
        height,
        aspectRatio,
        aspectRatioLabel,
      });
    };

    img.onerror = () => {
      if (isFile) {
        URL.revokeObjectURL(objectUrl);
      }
      resolve({
        isValid: false,
        width: 0,
        height: 0,
        aspectRatio: 0,
        aspectRatioLabel: 'Gagal Memuat',
        error: 'Berkas bukan gambar yang valid atau link URL gambar tidak dapat diakses.',
      });
    };

    img.src = objectUrl;
  });
}
