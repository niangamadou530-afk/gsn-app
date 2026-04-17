import { NextResponse } from "next/server";
import Groq from "groq-sdk";

const LYCEES_SN = `
MEILLEURS LYCÉES PUBLICS DU SÉNÉGAL :
- Lycée Blaise Diagne (Dakar) : excellence académique, séries L et S, fort taux de réussite au BAC
- Lycée Lamine Guèye (Dakar) : séries L, S, G — très réputé à Dakar
- Lycée Thierno Mamadou Tall (Thiès) : fort en série S
- Lycée Charles de Gaulle (Saint-Louis) : séries L et S, ancienne tradition
- Lycée de Ziguinchor : excellent résultats en Casamance, séries L et S
- Lycée El Hadj Ibrahima Niasse (Kaolack) : fort en série S
- Lycée Gaston Berger (Saint-Louis) : séries scientifiques
- Lycée Malick Sy (Thiès) : séries L et T

MEILLEURS LYCÉES PRIVÉS DU SÉNÉGAL :
- Cours Sainte-Marie de Hann (Dakar) : séries L, S, G — très sélectif
- Lycée Notre-Dame de Dakar : sérieux et résultats solides
- Lycée Kennedy (Dakar) : séries S et L, encadrement rigoureux
- Institut Sainte-Jeanne d'Arc (Dakar) : séries L et G
- Lycée El Bosco (Dakar) : séries S et T
- Prytanée Militaire de Saint-Louis : discipline, séries S — admission sur concours

SÉRIES AU LYCÉE :
- Série L (Littéraire) : Philosophie, Français, Histoire-Géographie, Langues — pour profils littéraires et langues
- Série S (Scientifique) : Maths, Sciences Physiques, SVT — pour profils scientifiques et techniques
`;

const ETABLISSEMENTS_SN = `
UNIVERSITÉS PUBLIQUES DU SÉNÉGAL :
- UCAD (Université Cheikh Anta Diop, Dakar) : médecine, pharmacie, droit, lettres, sciences, économie, philosophie
- UGB (Université Gaston Berger, Saint-Louis) : sciences et technologies, droit, sociologie, lettres
- UASZ (Université Assane Seck, Ziguinchor) : sciences, lettres, droit, géographie
- UDT (Université du Sine-Saloum, Kaolack) : sciences, lettres, sciences de l'éducation
- Université de Thiès (UT) : ingénierie, technologies, agronomie

GRANDES ÉCOLES PUBLIQUES :
- ESP (École Supérieure Polytechnique, Dakar/Thiès) : génie civil, génie électrique, informatique, génie mécanique — Sélection sur concours, BAC S recommandé
- ENSEPT : enseignement professionnel et technique
- ENSP : police et sécurité
- ENSEA : statistique et économie appliquée
- ENSIAS : ingénierie et systèmes d'information

GRANDES ÉCOLES PRIVÉES RECONNUES :
- ISM (Institut Supérieur de Management) : management, RH, marketing, finance
- Sup de Co Dakar : commerce, marketing, management international, logistique
- ISCAM : management, communication, audit
- IAM (Institut Africain de Management) : gestion, entrepreneuriat, finance
- ESTI (École Supérieure des Technologies de l'Information) : informatique, réseaux, cybersécurité
- CESAG : finance, comptabilité, management — reconnu UEMOA
- 3iL Africa : informatique, réseaux, cybersécurité
- IPSL (Institut Polytechnique Saint-Louis) : génie, technologies

GSN LEARN (formations professionnelles certifiantes 4-6 mois) :
- Développement Web : HTML, CSS, JavaScript, React, Next.js
- Marketing Digital : SEO, réseaux sociaux, Google Ads, analytics
- Finance & Comptabilité : SYSCOHADA, Excel avancé, finance
- Design Graphique : Adobe Suite, Figma, identité visuelle
- Maintenance Informatique : hardware, networking, Windows Server
- Entrepreneuriat : business plan, pitch, financement
`;

export async function POST(request: Request) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "GROQ_API_KEY manquante" }, { status: 500 });

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "FormData invalide" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  const examType = (formData.get("examType") as string) || "BAC";
  const serie = (formData.get("serie") as string) || "";

  if (!file) return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });

  const groq = new Groq({ apiKey });
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const fileType = file.type;

  const orientationPrompt = (extractedText: string) => {
    if (examType === "BFEM") {
      return `Tu es un conseiller d'orientation expert au Sénégal.
Analyse ce bulletin général annuel d'un élève de 3e préparant le BFEM sénégalais.

Contenu du document :
${extractedText}

${LYCEES_SN}

Extrait les matières et notes du document, calcule la moyenne générale.
Oriente UNIQUEMENT vers les séries L (littéraire) et S (scientifique) au lycée selon le profil de l'élève.
Recommande 4 à 6 lycées parmi les meilleurs du Sénégal adaptés au profil.

Retourne UNIQUEMENT ce JSON valide (sans markdown) :
{
  "moyenne": 13.5,
  "mention": "Assez bien",
  "orientation_principale": "Série S (Sciences) recommandée",
  "notes_extraites": {"Maths": 15, "Français": 12},
  "etablissements_recommandes": [
    {
      "nom": "Lycée Blaise Diagne",
      "type": "Lycée public",
      "filiere": "Série S",
      "pourquoi": "Tes résultats en Maths et Sciences sont excellents.",
      "conditions_acces": "Inscription sur dossier, résultats BFEM requis",
      "lien_gsn": false
    }
  ],
  "parcours_gsn_learn": [],
  "message_personnalise": "Avec ta moyenne de X/20..."
}

Règles :
- mention : "Passable" (<10), "Assez bien" (10-12), "Bien" (12-14), "Très bien" (14-16), "Excellent" (>16)
- Oriente vers Série S si points forts en Maths/Sciences, Série L si points forts en Français/Histoire
- Tout en français`;
    }

    return `Tu es un conseiller d'orientation expert au Sénégal.
Analyse ce relevé de notes ou relevé de BAC du ${examType}${serie ? " série " + serie : ""} sénégalais.

Contenu du document :
${extractedText}

${ETABLISSEMENTS_SN}

Extrait les matières et notes du document, calcule la moyenne pondérée selon les coefficients officiels du BAC sénégalais.
Recommande les meilleures universités et grandes écoles avec les facultés et filières précises adaptées au profil.

Retourne UNIQUEMENT ce JSON valide (sans markdown) :
{
  "moyenne": 13.5,
  "mention": "Assez bien",
  "orientation_principale": "Sciences et Technologies",
  "notes_extraites": {"Maths": 15, "Français": 12},
  "etablissements_recommandes": [
    {
      "nom": "ESP - École Supérieure Polytechnique",
      "type": "Grande École publique",
      "filiere": "Génie Informatique",
      "pourquoi": "Tes résultats en Maths et Sciences sont excellents.",
      "conditions_acces": "Concours national, mention BAC recommandée",
      "lien_gsn": true
    }
  ],
  "parcours_gsn_learn": ["Développement Web", "Maintenance Informatique"],
  "message_personnalise": "Avec ta moyenne de X/20 et ta série..."
}

Règles :
- mention : "Passable" (<10), "Assez bien" (10-12), "Bien" (12-14), "Très bien" (14-16), "Excellent" (>16)
- Recommande 4 à 6 établissements pertinents avec faculté et filière précises
- lien_gsn = true si GSN Learn complète ou prépare à cette filière
- Tout en français`;
  };

  try {
    let content: string;

    if (fileType.startsWith("image/")) {
      const base64 = buffer.toString("base64");
      const mimeType = fileType as "image/jpeg" | "image/png" | "image/gif" | "image/webp";
      const completion = await groq.chat.completions.create({
        messages: [{
          role: "user",
          content: [
            { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64}` } },
            { type: "text", text: orientationPrompt("(voir image du relevé ci-dessus)") },
          ],
        }],
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        max_tokens: 2000,
        temperature: 0.2,
      });
      content = completion.choices[0]?.message?.content ?? "";
    } else {
      // PDF or text file
      const text = buffer.toString("utf-8")
        .replace(/[^\x20-\x7E\n]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 3000);

      const completion = await groq.chat.completions.create({
        messages: [
          { role: "system", content: "Tu es une API JSON. Réponds uniquement avec du JSON valide, sans markdown." },
          { role: "user", content: orientationPrompt(text || "Document PDF — extrait les informations visibles.") },
        ],
        model: "llama-3.1-8b-instant",
        max_tokens: 2000,
        temperature: 0.2,
      });
      content = completion.choices[0]?.message?.content ?? "";
    }

    const cleaned = content.replace(/```json|```/g, "").trim();
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Pas de JSON dans la réponse");

    const result = JSON.parse(match[0]);
    return NextResponse.json(result);
  } catch (error: unknown) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error("prep-orientation error:", detail);
    return NextResponse.json({ error: `Groq error: ${detail}` }, { status: 502 });
  }
}
