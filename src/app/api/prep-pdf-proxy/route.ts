import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Liste blanche stricte des domaines sources d'annales officielles autorisées
 */
const ALLOWED_PDF_HOSTS = [
  "hriyttxrymwysdfvudsp.supabase.co", // Storage Supabase officiel du projet GSN
  "officedubac.sn",                  // Office du Baccalauréat du Sénégal
  "www.officedubac.sn",
  "epreuvesetcorriges.com",          // Annales & corrigés d'examens
  "www.epreuvesetcorriges.com",
  "sunudaara.com",                   // Ressources pédagogiques sénégalaises
  "www.sunudaara.com",
  "sujetcorrige.com",                // Annales officielles
  "www.sujetcorrige.com",
  "niangprogrammeur.com",            // Dépôt d'annales
  "www.niangprogrammeur.com",
];

export const MAX_PDF_SIZE_BYTES = 25 * 1024 * 1024; // 25 Mo

function isAllowedUrl(urlStr: string): boolean {
  try {
    const parsed = new URL(urlStr);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return false;
    const hostname = parsed.hostname.toLowerCase();
    return ALLOWED_PDF_HOSTS.some(
      allowed => hostname === allowed || hostname.endsWith("." + allowed)
    );
  } catch {
    return false;
  }
}

/**
 * Proxy et accélérateur de chargement des PDF d'annales officielles
 * - Liste blanche stricte des domaines d'annales autorisés
 * - Limite de taille maximale (25 Mo)
 * - Cache HTTP agressif (7 jours) pour économiser la data des élèves sur connexion 3G/4G
 */
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  const directUrl = req.nextUrl.searchParams.get("url");

  let targetUrl: string | null = null;
  let filename = "document.pdf";

  if (id) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data, error } = await supabase
      .from("epreuves_bac")
      .select("url_storage, nom_fichier")
      .eq("id", id)
      .maybeSingle();

    if (error || !data?.url_storage) {
      return NextResponse.json({ error: "Document non trouvé" }, { status: 404 });
    }

    targetUrl = data.url_storage;
    if (data.nom_fichier) filename = data.nom_fichier;
  } else if (directUrl) {
    targetUrl = decodeURIComponent(directUrl);
    const lastSlash = targetUrl.lastIndexOf("/");
    if (lastSlash !== -1) {
      filename = targetUrl.slice(lastSlash + 1) || filename;
    }
  } else {
    return NextResponse.json({ error: "Paramètre id ou url manquant" }, { status: 400 });
  }

  if (!targetUrl) {
    return NextResponse.json({ error: "URL introuvable" }, { status: 404 });
  }

  // Vérification stricte de la liste blanche de domaines
  if (!isAllowedUrl(targetUrl)) {
    return NextResponse.json(
      { error: "Accès refusé : domaine non autorisé dans la liste blanche des annales." },
      { status: 403 }
    );
  }

  try {
    const pdfResponse = await fetch(targetUrl, {
      headers: {
        "Accept": "application/pdf,*/*",
      },
      next: { revalidate: 604800 }, // Cache Next.js 7 jours
    });

    if (!pdfResponse.ok) {
      return NextResponse.json({ error: "Fichier distant introuvable" }, { status: 404 });
    }

    // Vérifier la taille déclarée dans les en-têtes
    const contentLength = pdfResponse.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > MAX_PDF_SIZE_BYTES) {
      return NextResponse.json(
        { error: "Fichier PDF trop volumineux (taille maximale autorisée : 25 Mo)" },
        { status: 413 }
      );
    }

    const pdfBuffer = await pdfResponse.arrayBuffer();

    // Vérifier la taille réelle du buffer
    if (pdfBuffer.byteLength > MAX_PDF_SIZE_BYTES) {
      return NextResponse.json(
        { error: "Fichier PDF trop volumineux (taille maximale autorisée : 25 Mo)" },
        { status: 413 }
      );
    }

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
        // Cache navigateur et proxy : 7 jours, révalidation silencieuse en arrière-plan
        "Cache-Control": "public, max-age=604800, stale-while-revalidate=86400, immutable",
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Erreur de chargement du PDF" }, { status: 500 });
  }
}
