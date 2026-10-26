/**
 * Client-side image optimization for e-commerce product photos.
 * Downscales ultra-high-resolution iPhone/Android photos (e.g. 12-48MP, 10MB+)
 * to crisp web-standard dimensions (max 1600px) and compresses to ~300KB-800KB.
 * This guarantees fast uploads on mobile networks and prevents Vercel serverless 4.5MB payload limits.
 */
export interface OptimizedImageResult {
  blob: Blob;
  dataUrl: string;
  originalSize: number;
  optimizedSize: number;
  width: number;
  height: number;
  filename: string;
}

export async function optimizeProductImage(
  file: File,
  maxDimension = 1600,
  quality = 0.85
): Promise<OptimizedImageResult> {
  const originalSize = file.size;

  // If already a small file (< 250KB) or SVG, read directly without canvas processing
  if (file.type === 'image/svg+xml' || originalSize < 250 * 1024) {
    const dataUrl = await fileToDataUrl(file);
    return {
      blob: file,
      dataUrl,
      originalSize,
      optimizedSize: originalSize,
      width: 0,
      height: 0,
      filename: file.name
    };
  }

  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = img;

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        // Fallback to original if canvas context unavailable
        fileToDataUrl(file).then((dataUrl) => {
          resolve({
            blob: file,
            dataUrl,
            originalSize,
            optimizedSize: originalSize,
            width: img.width,
            height: img.height,
            filename: file.name
          });
        });
        return;
      }

      // High-quality image rendering
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      // Prefer JPEG for photos, PNG for transparent graphics
      const isPng = file.type === 'image/png';
      const outputMime = isPng ? 'image/png' : 'image/jpeg';
      const dataUrl = canvas.toDataURL(outputMime, quality);

      canvas.toBlob(
        (blob) => {
          const finalBlob = blob || file;
          resolve({
            blob: finalBlob,
            dataUrl,
            originalSize,
            optimizedSize: finalBlob.size,
            width,
            height,
            filename: file.name.replace(/\.[^.]+$/, isPng ? '.png' : '.jpg')
          });
        },
        outputMime,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      // If image decoding fails in Image(), fall back to reading original file as dataUrl
      fileToDataUrl(file).then((dataUrl) => {
        resolve({
          blob: file,
          dataUrl,
          originalSize,
          optimizedSize: originalSize,
          width: 0,
          height: 0,
          filename: file.name
        });
      });
    };

    img.src = objectUrl;
  });
}

function fileToDataUrl(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file as data URL'));
    reader.readAsDataURL(file);
  });
}
