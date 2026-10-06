import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Proxy et accélérateur de chargement des PDF d'annales officielles
 * - Cache HTTP agressif (7 jours) pour économiser la data des élèves sur connexion 3G/4G
 * - Prise en charge des requêtes par ID ou par URL directe
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

    const pdfBuffer = await pdfResponse.arrayBuffer();

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
