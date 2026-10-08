"use client";

import { useState } from "react";

export interface YoutubeVideoItem {
  videoId: string;
  title: string;
  thumbnail: string;
}

/**
 * Décode les entités HTML fréquentes retournées par l'API YouTube
 */
export function decodeHtmlEntities(str: string): string {
  if (!str) return "";
  return str
    .replace(/&amp;/g, "&")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, dec) => {
      try {
        return String.fromCharCode(Number(dec));
      } catch {
        return "";
      }
    });
}

const SERIE_PATTERNS: { regex: RegExp; label: string }[] = [
  { regex: /(?:^|[^a-z0-9])(?:s[eé]rie\s+)?s1(?:$|[^a-z0-9])/i, label: "Série S1" },
  { regex: /(?:^|[^a-z0-9])(?:s[eé]rie\s+)?s2(?:$|[^a-z0-9])/i, label: "Série S2" },
  { regex: /(?:^|[^a-z0-9])(?:s[eé]rie\s+)?s3(?:$|[^a-z0-9])/i, label: "Série S3" },
  { regex: /(?:^|[^a-z0-9])(?:s[eé]rie\s+)?s4(?:$|[^a-z0-9])/i, label: "Série S4" },
  { regex: /(?:^|[^a-z0-9])(?:s[eé]rie\s+)?s5(?:$|[^a-z0-9])/i, label: "Série S5" },
  { regex: /(?:^|[^a-z0-9])(?:s[eé]rie\s+)?l1(?:$|[^a-z0-9])/i, label: "Série L1" },
  { regex: /(?:^|[^a-z0-9])(?:s[eé]rie\s+)?l2(?:$|[^a-z0-9])/i, label: "Série L2" },
  { regex: /(?:^|[^a-z0-9])(?:s[eé]rie\s+)?l'?1(?:$|[^a-z0-9])/i, label: "Série L'1" },
  { regex: /(?:^|[^a-z0-9])(?:s[eé]rie\s+)?l-ar(?:$|[^a-z0-9])/i, label: "Série L-AR" },
  { regex: /(?:^|[^a-z0-9])(?:s[eé]rie\s+)?steg(?:$|[^a-z0-9])/i, label: "Série STEG" },
  { regex: /(?:^|[^a-z0-9])(?:s[eé]rie\s+)?stidd(?:$|[^a-z0-9])/i, label: "Série STIDD" },
  { regex: /(?:^|[^a-z0-9])(?:s[eé]rie\s+)?t1(?:$|[^a-z0-9])/i, label: "Série T1" },
  { regex: /(?:^|[^a-z0-9])(?:s[eé]rie\s+)?t2(?:$|[^a-z0-9])/i, label: "Série T2" },
  { regex: /(?:^|[^a-z0-9])(?:s[eé]rie\s+)?f6(?:$|[^a-z0-9])/i, label: "Série F6" },
  { regex: /(?:^|[^a-z0-9])bfem(?:$|[^a-z0-9])/i, label: "BFEM" },
];

/**
 * Détecte si le titre d'une vidéo mentionne une série ou un examen officiel
 */
export function detectSerieInTitle(title: string): string | null {
  if (!title) return null;
  for (const p of SERIE_PATTERNS) {
    if (p.regex.test(title)) {
      return p.label;
    }
  }
  return null;
}

/**
 * Trie les vidéos en favorisant celles dont le titre mentionne la série de l'élève
 */
export function sortVideosByStudentSerie<T extends { title: string }>(
  videos: T[],
  studentSerie?: string | null
): T[] {
  if (!videos || videos.length === 0 || !studentSerie) return videos;
  const target = studentSerie.trim().toUpperCase();

  return [...videos].sort((a, b) => {
    const aDetected = detectSerieInTitle(a.title);
    const bDetected = detectSerieInTitle(b.title);

    const aMatch = aDetected ? aDetected.toUpperCase().includes(target) : false;
    const bMatch = bDetected ? bDetected.toUpperCase().includes(target) : false;

    if (aMatch && !bMatch) return -1;
    if (!aMatch && bMatch) return 1;
    return 0;
  });
}

/**
 * Retourne l'URL de miniature haute résolution YouTube
 */
function getBestThumbnailUrl(videoId: string, fallbackThumb?: string): string {
  if (!videoId) return fallbackThumb || "";
  // Tente maxresdefault, sinon retombe sur hqdefault ou la miniature fournie
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

interface VideoCardProps {
  video: YoutubeVideoItem;
  matiereOrChapitre?: string;
  onPlay: (videoId: string) => void;
  isPlaying?: boolean;
}

export function VideoCard({
  video,
  matiereOrChapitre,
  onPlay,
  isPlaying = false,
}: VideoCardProps) {
  const [imageError, setImageError] = useState(false);
  const [thumbSrc, setThumbSrc]     = useState(
    getBestThumbnailUrl(video.videoId, video.thumbnail)
  );

  const cleanTitle = decodeHtmlEntities(video.title);
  const detectedSerie = detectSerieInTitle(cleanTitle);

  const handleThumbError = () => {
    if (video.thumbnail && thumbSrc !== video.thumbnail) {
      setThumbSrc(video.thumbnail);
    } else {
      setImageError(true);
    }
  };

  return (
    <article
      className="relative w-full h-[210px] sm:h-[220px] rounded-[24px] overflow-hidden shadow-md shadow-slate-900/5 bg-slate-900 group transition-all duration-150 active:scale-[0.98] motion-reduce:transform-none motion-reduce:transition-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-[#005bbf]"
      style={{ aspectRatio: "16/10" }}
    >
      {/* 1. Miniature en arrière-plan */}
      {!imageError ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={thumbSrc}
          alt={cleanTitle}
          loading="lazy"
          onError={handleThumbError}
          className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none group-hover:scale-105 transition-transform duration-300 motion-reduce:transform-none"
        />
      ) : (
        /* Fond dégradé bleu officiel GSN en cas de miniature manquante */
        <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-[#005bbf] to-[#002244] flex items-center justify-center select-none">
          <span className="material-symbols-outlined text-[64px] text-white/20">
            play_circle
          </span>
        </div>
      )}

      {/* 2. Dégradé sombre du bas vers le haut pour garantir la lisibilité */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />

      {/* 3. Pastilles en haut (matière/chapitre + série éventuelle) */}
      <div className="absolute top-3 left-3 right-3 flex items-center gap-2 flex-wrap z-10 pointer-events-none">
        {matiereOrChapitre && (
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/85 backdrop-blur-md text-slate-900 text-[12px] font-bold shadow-xs truncate max-w-[190px]">
            {decodeHtmlEntities(matiereOrChapitre)}
          </span>
        )}
        {detectedSerie && (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#FF6B00]/90 backdrop-blur-md text-white text-[11px] font-extrabold shadow-xs">
            {detectedSerie}
          </span>
        )}
      </div>

      {/* 4. Bouton central translucide */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
        <div className="w-12 h-12 rounded-full bg-white/25 backdrop-blur-md border border-white/30 text-white flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:bg-white/40 transition-all duration-200 motion-reduce:transform-none">
          <span
            className="material-symbols-outlined text-[28px] translate-x-0.5"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            play_arrow
          </span>
        </div>
      </div>

      {/* 5. Bas de carte : Titre à gauche + Bouton "Regarder" à droite */}
      <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-3 z-20">
        {/* Titre blanc sur 2 lignes max */}
        <h3
          title={cleanTitle}
          className="text-white font-bold text-[16px] sm:text-[18px] leading-snug line-clamp-2 drop-shadow-sm flex-1 min-w-0"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          {cleanTitle}
        </h3>

        {/* Bouton "Regarder" en pastille bleu nuit (hauteur >= 44px) */}
        <button
          type="button"
          onClick={() => onPlay(video.videoId)}
          aria-label={`Regarder la vidéo : ${cleanTitle}`}
          className="shrink-0 h-[44px] min-h-[44px] px-4 rounded-full bg-[#0a192f] hover:bg-[#002244] active:bg-[#00172e] text-white text-xs font-extrabold shadow-md flex items-center gap-1.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-white"
        >
          <span
            className="material-symbols-outlined text-[18px]"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            play_arrow
          </span>
          <span>Regarder</span>
        </button>
      </div>
    </article>
  );
}

/**
 * Carte squelette affichée pendant le chargement des vidéos
 */
export function VideoCardSkeleton() {
  return (
    <div
      className="relative w-full h-[210px] sm:h-[220px] rounded-[24px] overflow-hidden bg-slate-200 animate-pulse shadow-sm"
      style={{ aspectRatio: "16/10" }}
    >
      <div className="absolute top-3 left-3 w-28 h-6 bg-slate-300 rounded-full" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-12 h-12 rounded-full bg-slate-300" />
      </div>
      <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-3">
        <div className="space-y-2 flex-1">
          <div className="w-4/5 h-4 bg-slate-300 rounded-md" />
          <div className="w-3/5 h-4 bg-slate-300 rounded-md" />
        </div>
        <div className="w-24 h-[44px] bg-slate-300 rounded-full shrink-0" />
      </div>
    </div>
  );
}
