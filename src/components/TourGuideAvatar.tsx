"use client";

import React from "react";
import { TourGuideAttitude } from "@/lib/prep-config";
import { MascotGuide } from "./MascotGuide";

interface TourGuideAvatarProps {
  attitude?: TourGuideAttitude;
  size?: "sm" | "md" | "lg";
  className?: string;
}

/**
 * Adaptateur de rétrocompatibilité pour l'avatar du guide,
 * s'appuyant sur le nouveau composant de mascotte Prépy.
 */
export function TourGuideAvatar({
  attitude = "accueil",
  size = "md",
  className = "",
}: TourGuideAvatarProps) {
  return (
    <MascotGuide
      attitude={attitude}
      size={size}
      className={className}
      withShadow={true}
      withHalo={size !== "sm"}
      interactive={true}
    />
  );
}
