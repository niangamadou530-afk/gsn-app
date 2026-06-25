import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID manquant" }, { status: 400 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error } = await supabase
    .from("epreuves_bac")
    .select("url_storage, nom_fichier")
    .eq("id", id)
    .single();

  if (error || !data?.url_storage) {
    return NextResponse.json({ error: "Document non trouvé" }, { status: 404 });
  }

  const pdfResponse = await fetch(data.url_storage);
  if (!pdfResponse.ok) {
    return NextResponse.json({ error: "Fichier introuvable" }, { status: 404 });
  }

  const pdfBuffer = await pdfResponse.arrayBuffer();

  return new NextResponse(pdfBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${data.nom_fichier || "document.pdf"}"`,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
