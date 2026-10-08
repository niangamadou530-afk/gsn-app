"use client";

import { useState } from "react";

export interface YoutubeVideoItem {
  videoId: string;
  title: string;
  thumbnail: string;
}

/**
 * Décode les entités HTML dans les titres renvoyés par l'API YouTube
 * (&amp; -> &, &#39; -> ', &quot; -> ", etc.)
 */
export function decodeHtmlEntities(str: string): string {
  if (!str) return "";
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, dec) => {
      try {
        return String.fromCharCode(Number(dec));
      } catch {
        return "";
      }
    });
}

/**
 * Détecte si le titre d'une vidéo mentionne une série d'examen
 * Ex : "S1", "S2", "L2", "L'1", "Tle S", "Terminale S2", etc.
 */
export function extractSeriesFromTitle(title: string): string | null {
  if (!title) return null;
  const match = title.match(
    /\b(S1|S2|S3|L1|L2|L'1|L’1|L-AR|STEG|STIDD|Tle\s*S|Tle\s*L|Terminale\s*S|Terminale\s*L)\b/i
  );
  return match ? match[0].toUpperCase() : null;
}

/**
 * Classe les vidéos : celles mentionnant la série de l'élève en premier
 */
export function sortVideosByStudentSerie(
  videos: YoutubeVideoItem[],
  studentSerie?: string
): YoutubeVideoItem[] {
  if (!studentSerie || !videos || videos.length <= 1) return videos || [];
  const cleanSerie = studentSerie.trim().toUpperCase();
  const regex = new RegExp(`\\b${cleanSerie}\\b|\\bSérie\\s*${cleanSerie}\\b`, "i");

  return [...videos].sort((a, b) => {
    const aMatch = regex.test(a.title);
    const bMatch = regex.test(b.title);
    if (aMatch && !bMatch) return -1;
    if (!aMatch && bMatch) return 1;
    return 0;
  });
}

interface VideoCardProps {
  video: YoutubeVideoItem;
  matiere?: string;
  chapitre?: string;
  studentSerie?: string;
  isPlaying?: boolean;
  onWatch?: (videoId: string) => void;
}

export function VideoCard({
  video,
  matiere,
  chapitre,
  studentSerie,
  isPlaying = false,
  onWatch,
}: VideoCardProps) {
  const [imageError, setImageError] = useState(false);
  const cleanTitle = decodeHtmlEntities(video.title);
  const detectedSerie = extractSeriesFromTitle(cleanTitle) || (studentSerie ? studentSerie.toUpperCase() : null);
  const badgeLabel = chapitre || matiere || "Cours & Exercices";

  const handleAction = () => {
    if (onWatch) {
      onWatch(video.videoId);
    } else {
      window.open(`https://www.youtube.com/watch?v=${video.videoId}`, "_blank", "noopener,noreferrer");
    }
  };

  if (isPlaying) {
    return (
      <div className="w-full aspect-[16/10] min-h-[200px] max-h-[260px] sm:max-h-none rounded-[24px] overflow-hidden bg-black shadow-md border border-slate-200/50">
        <iframe
          src={`https://www.youtube.com/embed/${video.videoId}?autoplay=1`}
          title={cleanTitle}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <div
      onClick={handleAction}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleAction();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`Regarder la vidéo : ${cleanTitle}`}
      className="relative w-full aspect-[16/10] min-h-[200px] max-h-[240px] sm:max-h-none rounded-[24px] overflow-hidden shadow-md shadow-slate-900/10 cursor-pointer group select-none motion-safe:transition-transform motion-safe:active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-[#FF6B00] focus-visible:outline-none border border-slate-200/40 bg-slate-900"
    >
      {/* ── Miniature avec lazy loading et repli gracieux ── */}
      {!imageError && video.thumbnail ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={video.thumbnail}
          alt={cleanTitle}
          loading="lazy"
          onError={() => setImageError(true)}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        /* Repli : Fond dégradé bleu GSN avec icône */
        <div className="w-full h-full bg-gradient-to-br from-[#005bbf] to-[#002b66] flex items-center justify-center">
          <span className="material-symbols-outlined text-[48px] text-white/50">
            smart_display
          </span>
        </div>
      )}

      {/* ── Dégradé sombre du bas vers le haut pour une lisibilité parfaite ── */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/45 to-transparent pointer-events-none" />

      {/* ── Pastilles arrondies en haut (fond blanc semi-transparent, texte sombre, 12 px) ── */}
      <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center gap-2 flex-wrap z-10 pointer-events-none">
        <span className="px-3 py-1 rounded-full bg-white/85 backdrop-blur-xs text-slate-900 font-bold text-[12px] shadow-xs truncate max-w-[70%]">
          {badgeLabel}
        </span>
        {detectedSerie && (
          <span className="px-2.5 py-1 rounded-full bg-white/85 backdrop-blur-xs text-slate-900 font-extrabold text-[12px] shadow-xs uppercase">
            {detectedSerie}
          </span>
        )}
      </div>

      {/* ── Icône de lecture translucide au centre ── */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
        <div className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-xs text-white flex items-center justify-center border border-white/25 shadow-sm group-hover:scale-110 motion-safe:transition-transform">
          <span
            className="material-symbols-outlined text-[26px] ml-0.5 text-white"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            play_arrow
          </span>
        </div>
      </div>

      {/* ── Titre en gras blanc, en bas à gauche, max 2 lignes, 18 px ── */}
      <div className="absolute bottom-3.5 left-3.5 right-36 z-10 pointer-events-none">
        <h4 className="font-bold text-white text-[18px] leading-snug line-clamp-2 drop-shadow-xs font-['Plus_Jakarta_Sans',sans-serif]">
          {cleanTitle}
        </h4>
      </div>

      {/* ── Bouton « Regarder » en pastille bleu nuit (min 44 px), en bas à droite ── */}
      <div className="absolute bottom-3.5 right-3.5 z-10">
        <button
          type="button"
          tabIndex={-1}
          aria-hidden="true"
          className="min-h-[44px] h-[44px] px-4 rounded-full bg-[#0a192f] hover:bg-[#002b66] text-white font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
        >
          <span
            className="material-symbols-outlined text-[18px] text-white"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            play_arrow
          </span>
          <span>Regarder</span>
        </button>
      </div>
    </div>
  );
}

/**
 * Carte squelette pour l'état de chargement
 */
export function VideoCardSkeleton() {
  return (
    <div className="relative w-full aspect-[16/10] min-h-[200px] max-h-[240px] sm:max-h-none rounded-[24px] overflow-hidden bg-slate-200 animate-pulse shadow-md shadow-slate-900/5">
      <div className="absolute top-3.5 left-3.5 flex gap-2">
        <div className="h-6 w-24 rounded-full bg-slate-300" />
        <div className="h-6 w-12 rounded-full bg-slate-300" />
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-12 h-12 rounded-full bg-slate-300" />
      </div>
      <div className="absolute bottom-3.5 left-3.5 right-36 space-y-2">
        <div className="h-4 w-5/6 bg-slate-300 rounded-md" />
        <div className="h-4 w-3/5 bg-slate-300 rounded-md" />
      </div>
      <div className="absolute bottom-3.5 right-3.5">
        <div className="h-[44px] w-28 rounded-full bg-slate-300" />
      </div>
    </div>
  );
}

/**
 * Section complète de vidéos recommandées
 * - Gouttières 16 px (px-4)
 * - Mobile : 1 colonne | Web : grille 2 ou 3 colonnes
 */
export function VideoSection({
  videos,
  loading = false,
  matiere,
  chapitre,
  studentSerie,
  videoPlaying,
  setVideoPlaying,
}: {
  videos: YoutubeVideoItem[];
  loading?: boolean;
  matiere?: string;
  chapitre?: string;
  studentSerie?: string;
  videoPlaying?: string | null;
  setVideoPlaying?: (id: string | null) => void;
}) {
  if (!loading && (!videos || videos.length === 0)) return null;

  const sortedVideos = sortVideosByStudentSerie(videos || [], studentSerie);

  return (
    <div className="px-4 pb-6 space-y-3.5 w-full">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-[#FF6B00] text-[20px]">
          smart_display
        </span>
        <h3 className="text-xs font-extrabold text-slate-600 uppercase tracking-wider font-['Plus_Jakarta_Sans',sans-serif]">
          Vidéos recommandées
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <>
            <VideoCardSkeleton />
            <VideoCardSkeleton />
            <VideoCardSkeleton />
          </>
        ) : (
          sortedVideos.map((v) => (
            <VideoCard
              key={v.videoId}
              video={v}
              matiere={matiere}
              chapitre={chapitre}
              studentSerie={studentSerie}
              isPlaying={videoPlaying === v.videoId}
              onWatch={(id) => {
                if (setVideoPlaying) {
                  setVideoPlaying(videoPlaying === id ? null : id);
                } else {
                  window.open(`https://www.youtube.com/watch?v=${id}`, "_blank", "noopener,noreferrer");
                }
              }}
            />
          ))
        )}
      </div>
    </div>
  );
}
