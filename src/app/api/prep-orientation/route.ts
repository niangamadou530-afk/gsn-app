import { NextResponse } from "next/server";
import Groq from "groq-sdk";

const ETABLISSEMENTS = `
Universités publiques (Sénégal) :
- UCAD (Université Cheikh Anta Diop, Dakar) : médecine, droit, lettres, sciences, économie
- UGB (Université Gaston Berger, Saint-Louis) : sciences appliquées, droit, sociologie
- UASZ (Université Assane Seck, Ziguinchor) : sciences, lettres, droit
- UDT (Université du Sine Saloum El-Hadji Ibrahima Niasse, Kaolack) : sciences, lettres

Grandes Écoles publiques :
- ESP (École Supérieure Polytechnique, Dakar) : génie civil, électronique, informatique, mécanique
- ENSEPT (École Nationale Supérieure de l'Enseignement Professionnel et Technique) : formations techniques
- ENSP (École Nationale Supérieure de Police) : sciences juridiques, sécurité

Écoles privées reconnues :
- ISM (Institut Supérieur de Management) : management, marketing, finance, RH
- Sup de Co Dakar : commerce, marketing, management international
- ISCAM : management, communication, audit
- Institut Africain de Management (IAM) : gestion, entrepreneuriat
- Ecole Supérieure des Technologies de l'Information (ESTI) : informatique, systèmes
- CESAG (Centre Africain d'Études Supérieures en Gestion) : finance, comptabilité, management
- 3iL Africa : informatique, réseaux, cybersécurité
- Université Cheikh Anta Diop privée (UCAD privée) : santé, droit, économie

GSN Learn (formations professionnelles certifiantes) :
- Développement Web (6 mois) : HTML, CSS, JavaScript, React, Next.js
- Marketing Digital (4 mois) : SEO, réseaux sociaux, Google Ads, analytics
- Finance & Comptabilité (5 mois) : comptabilité SYSCOHADA, Excel avancé, finance
- Design Graphique (4 mois) : Adobe Suite, Figma, identité visuelle
- Maintenance Informatique (4 mois) : hardware, networking, Windows Server
- Entrepreneuriat (3 mois) : business plan, pitch, financement, gestion
`;

export async function POST(request: Request) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "GROQ_API_KEY manquante" }, { status: 500 });

  const body = await request.json().catch(() => ({}));
  const { examType = "BAC", serie = "S1", country = "Sénégal", grades = {} } = body;

  if (!grades || Object.keys(grades).length === 0) {
    return NextResponse.json({ error: "Notes manquantes" }, { status: 400 });
  }

  const gradesText = Object.entries(grades as Record<string, number>)
    .map(([subj, note]) => `${subj}: ${note}/20`)
    .join(", ");

  const prompt = `Tu es un conseiller d'orientation expert en ${country}.
Un élève a passé le ${examType}${serie ? " série " + serie : ""} avec les notes suivantes : ${gradesText}.

${ETABLISSEMENTS}

Analyse le profil de cet élève et génère des recommandations d'orientation.
Calcule la moyenne générale, détermine la mention, et recommande les meilleures formations.

Retourne UNIQUEMENT ce JSON valide (sans markdown) :
{
  "moyenne": 13.5,
  "mention": "Assez bien",
  "orientation_principale": "Sciences et Technologies",
  "etablissements_recommandes": [
    {
      "nom": "ESP - École Supérieure Polytechnique",
      "type": "Grande École publique",
      "filiere": "Génie Informatique",
      "pourquoi": "Tes notes en Maths et Physique sont excellentes.",
      "conditions_acces": "Concours direct, dossier avec mention BAC",
      "lien_gsn": true
    }
  ],
  "parcours_gsn_learn": ["Développement Web", "Maintenance Informatique"],
  "message_personnalise": "Avec ta moyenne de X/20 et ta série S1, tu as de solides bases pour..."
}

Règles :
- Recommande 4 à 6 établissements pertinents selon les notes
- lien_gsn = true si GSN Learn peut compléter ou préparer à cette filière
- mention : "Passable" (<10), "Assez bien" (10-12), "Bien" (12-14), "Très bien" (14-16), "Excellent" (>16)
- Adapte selon le pays : ${country}
- Tout en français`;

  try {
    const groq = new Groq({ apiKey });
    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: "Tu es une API JSON. Réponds uniquement avec du JSON valide, sans markdown." },
        { role: "user", content: prompt },
      ],
      model: "llama3-8b-8192",
      max_tokens: 2000,
      temperature: 0.3,
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    const cleaned = raw.replace(/```json|```/g, "").trim();
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
