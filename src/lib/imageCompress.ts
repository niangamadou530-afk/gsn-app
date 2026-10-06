/**
 * Compression et optimisation d'image côté client (navigateur)
 * Réduit le poids d'une photo de smartphone (5-12 Mo) à ~300-500 Ko
 * pour un téléversement ultra-rapide et compatible avec le modèle Groq Vision.
 */

export interface CompressedImageResult {
  base64: string;
  mimeType: string;
  previewUrl: string;
  originalSizeBytes: number;
  compressedSizeBytes: number;
}

export async function compressImageClient(
  file: File,
  maxDimension = 1600,
  quality = 0.85
): Promise<CompressedImageResult> {
  const originalSizeBytes = file.size;

  return new Promise((resolve) => {
    // Si ce n'est pas une image (ex: PDF ou texte), fallback direct
    if (!file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => {
        const b64 = (reader.result as string).split(",")[1] || "";
        resolve({
          base64: b64,
          mimeType: file.type || "application/octet-stream",
          previewUrl: "",
          originalSizeBytes,
          compressedSizeBytes: originalSizeBytes,
        });
      };
      reader.onerror = () => {
        resolve({
          base64: "",
          mimeType: file.type || "application/octet-stream",
          previewUrl: "",
          originalSizeBytes,
          compressedSizeBytes: 0,
        });
      };
      reader.readAsDataURL(file);
      return;
    }

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let width = img.width;
      let height = img.height;

      // Calcul du ratio de redimensionnement
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        // Fallback sans compression si le contexte canvas échoue
        fallbackReadFile(file, resolve);
        return;
      }

      // Fond blanc pour éviter un fond noir sur les PNG transparents convertis en JPEG
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      const mimeType = "image/jpeg";
      const dataUrl = canvas.toDataURL(mimeType, quality);
      const b64 = dataUrl.split(",")[1] || "";
      const approxCompressedBytes = Math.round((b64.length * 3) / 4);

      resolve({
        base64: b64,
        mimeType,
        previewUrl: dataUrl,
        originalSizeBytes,
        compressedSizeBytes: approxCompressedBytes,
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      fallbackReadFile(file, resolve);
    };

    img.src = objectUrl;
  });
}

function fallbackReadFile(
  file: File,
  resolve: (res: CompressedImageResult) => void
) {
  const reader = new FileReader();
  reader.onload = () => {
    const dataUrl = reader.result as string;
    const b64 = dataUrl.split(",")[1] || "";
    resolve({
      base64: b64,
      mimeType: file.type || "image/jpeg",
      previewUrl: dataUrl,
      originalSizeBytes: file.size,
      compressedSizeBytes: file.size,
    });
  };
  reader.onerror = () => {
    resolve({
      base64: "",
      mimeType: file.type || "image/jpeg",
      previewUrl: "",
      originalSizeBytes: file.size,
      compressedSizeBytes: 0,
    });
  };
  reader.readAsDataURL(file);
}
