/**
 * Extraction de texte sécurisée pour documents PDF
 * Gère les PDFs standards, détecte les PDFs scannés (images sans couche de texte)
 * et protège contre les plantages sur PDFs corrompus ou verrouillés.
 */

export interface PdfExtractionSuccess {
  success: true;
  text: string;
  pages: number;
}

export interface PdfExtractionFailure {
  success: false;
  error: string;
  isScanned?: boolean;
}

export type PdfExtractionResult = PdfExtractionSuccess | PdfExtractionFailure;

export async function extractTextFromPdfBuffer(buffer: Buffer): Promise<PdfExtractionResult> {
  try {
    // Dynamic require pour compatibilité maximale avec l'environnement Node.js serverless
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfModule = require("pdf-parse");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const PDFParse = pdfModule.PDFParse || (pdfModule.default && (pdfModule.default as any).PDFParse) || pdfModule;

    if (typeof PDFParse !== "function") {
      return {
        success: false,
        error: "Impossible d'initialiser le parseur PDF sur le serveur.",
      };
    }

    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    const totalPages = typeof result?.total === "number" ? result.total : 1;
    await parser.destroy();

    const rawText = (result?.text ?? "")
      // Retirer les marqueurs de page du parseur (ex: -- 1 of 3 --)
      .replace(/--\s*\d+\s+of\s+\d+\s*--/gi, "")
      .replace(/\r\n/g, "\n")
      .trim();

    // Détecter un PDF scanné (page d'images sans texte sélectionnable)
    // Moins de 35 caractères alphanumériques sur l'ensemble du document = image scannée
    const alphanumericCount = (rawText.match(/[a-zA-Z0-9àâäéèêëîïôöùûüçÀÂÄÉÈÊËÎÏÔÖÙÛÜÇ]/g) || []).length;

    if (alphanumericCount < 35) {
      return {
        success: false,
        isScanned: true,
        error: "Ce PDF est une image : envoie plutôt une photo nette ou colle le texte.",
      };
    }

    // Normalisation du texte extrait
    const cleanedText = rawText
      .replace(/[ \t]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    return {
      success: true,
      text: cleanedText,
      pages: totalPages,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[PdfTextExtractor] Erreur de lecture PDF:", message);

    if (
      message.toLowerCase().includes("password") ||
      message.toLowerCase().includes("encrypted") ||
      message.toLowerCase().includes("locked")
    ) {
      return {
        success: false,
        error: "Ce fichier PDF est protégé par mot de passe ou verrouillé. Merci d'envoyer un PDF non protégé ou de coller le texte.",
      };
    }

    return {
      success: false,
      error: "Ce fichier PDF est illisible ou corrompu. Merci d'envoyer un document valide, une photo nette ou de coller le texte.",
    };
  }
}
