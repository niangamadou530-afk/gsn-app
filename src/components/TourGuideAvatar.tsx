"use client";

import { useId } from "react";
import { PREP_GUIDE_NAME, TourGuideAttitude } from "@/lib/prep-config";

interface TourGuideAvatarProps {
  attitude?: TourGuideAttitude;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function TourGuideAvatar({
  attitude = "accueil",
  size = "md",
  className = "",
}: TourGuideAvatarProps) {
  const gradientId = useId();

  const dimensions = {
    sm: "w-10 h-10",
    md: "w-14 h-14 sm:w-16 sm:h-16",
    lg: "w-20 h-20 sm:w-24 sm:h-24",
  }[size];

  // Badges symboliques selon l'attitude
  const attitudeBadge = {
    accueil: (
      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-orange-100 text-[#FF6B00] border border-white shadow-xs text-[10px] font-black">
        👋
      </span>
    ),
    montre: (
      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-[#005bbf] border border-white shadow-xs text-[10px] font-black">
        👉
      </span>
    ),
    encourage: (
      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 border border-white shadow-xs text-[10px] font-black">
        ✨
      </span>
    ),
    felicite: (
      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-100 text-amber-600 border border-white shadow-xs text-[10px] font-black">
        🎯
      </span>
    ),
  }[attitude];

  return (
    <div className={`relative shrink-0 select-none ${dimensions} ${className}`}>
      {/* Conteneur circulaire de portrait avec bordure PREP */}
      <div className="w-full h-full rounded-2xl overflow-hidden bg-gradient-to-b from-blue-50 to-orange-50 border-2 border-white shadow-md ring-2 ring-[#005bbf]/20 relative flex items-center justify-center">
        {/* Portrait vectoriel soigné de Moussa (jeune tuteur sénégalais) */}
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full object-cover transform translate-y-1 transition-transform motion-reduce:transform-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Dégradé peau naturelle foncée */}
            <radialGradient id={`skin-${gradientId}`} cx="50%" cy="40%" r="50%">
              <stop offset="0%" stopColor="#8D5524" />
              <stop offset="70%" stopColor="#6F3F19" />
              <stop offset="100%" stopColor="#552F12" />
            </radialGradient>
            {/* Dégradé polo PREP bleu officiel */}
            <linearGradient id={`polo-${gradientId}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#005bbf" />
              <stop offset="100%" stopColor="#003e85" />
            </linearGradient>
            {/* Ombre polo */}
            <linearGradient id={`collar-${gradientId}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#dbeafe" />
            </linearGradient>
          </defs>

          {/* Arrière-plan doux */}
          <circle cx="50" cy="50" r="48" fill="#F1F5F9" />

          {/* Torse & Polo PREP */}
          <path
            d="M 15 98 C 15 76 30 72 50 72 C 70 72 85 76 85 98 Z"
            fill={`url(#polo-${gradientId})`}
          />
          {/* Col de chemise blanc */}
          <polygon points="50,72 38,82 46,88 50,76" fill={`url(#collar-${gradientId})`} />
          <polygon points="50,72 62,82 54,88 50,76" fill={`url(#collar-${gradientId})`} />
          <polygon points="46,88 50,96 54,88" fill="#FF6B00" />

          {/* Cou */}
          <rect x="42" y="58" width="16" height="18" rx="4" fill="#552F12" />

          {/* Tête & Visage */}
          <ellipse cx="50" cy="46" rx="22" ry="25" fill={`url(#skin-${gradientId})`} />

          {/* Cheveux soignés courts */}
          <path
            d="M 28 42 C 28 22 36 16 50 16 C 64 16 72 22 72 42 C 70 28 62 23 50 23 C 38 23 30 28 28 42 Z"
            fill="#1E1611"
          />

          {/* Oreilles */}
          <ellipse cx="27" cy="46" rx="3.5" ry="5.5" fill="#6F3F19" />
          <ellipse cx="73" cy="46" rx="3.5" ry="5.5" fill="#6F3F19" />

          {/* Yeux chaleureux et bienveillants */}
          <ellipse cx="41" cy="43" rx="3" ry="2" fill="#FFFFFF" />
          <circle cx="41.5" cy="43" r="1.6" fill="#1A120B" />
          <circle cx="42" cy="42.4" r="0.6" fill="#FFFFFF" />

          <ellipse cx="59" cy="43" rx="3" ry="2" fill="#FFFFFF" />
          <circle cx="58.5" cy="43" r="1.6" fill="#1A120B" />
          <circle cx="59" cy="42.4" r="0.6" fill="#FFFFFF" />

          {/* Sourcils */}
          <path d="M 36 38 Q 41 35 46 38" stroke="#1A120B" strokeWidth="1.6" fill="none" strokeLinecap="round" />
          <path d="M 54 38 Q 59 35 64 38" stroke="#1A120B" strokeWidth="1.6" fill="none" strokeLinecap="round" />

          {/* Nez fin */}
          <path d="M 50 44 L 48 51 Q 50 53 52 51 Z" fill="#552F12" opacity="0.6" />

          {/* Sourire chaleureux */}
          {attitude === "felicite" ? (
            <path
              d="M 40 56 Q 50 67 60 56 Z"
              fill="#FFFFFF"
              stroke="#43220A"
              strokeWidth="1.2"
            />
          ) : (
            <path
              d="M 42 57 Q 50 63 58 57"
              stroke="#FFFFFF"
              strokeWidth="2.4"
              fill="none"
              strokeLinecap="round"
            />
          )}

          {/* Reflet lumineux sur la pommette */}
          <circle cx="40" cy="49" r="1.2" fill="#FFFFFF" opacity="0.15" />
          <circle cx="60" cy="49" r="1.2" fill="#FFFFFF" opacity="0.15" />
        </svg>
      </div>

      {/* Badge indicatif discret de posture en bas à droite */}
      <div className="absolute -bottom-1 -right-1 z-10 scale-90">
        {attitudeBadge}
      </div>
    </div>
  );
}
