"use client";

import { useEffect, useRef, useState } from "react";

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "down" | "left" | "right" | "none";
}

export function Reveal({
  children,
  className = "",
  delay = 0,
  direction = "up",
}: RevealProps) {
  const [isVisible, setIsVisible] = useState(() => {
    if (typeof window !== "undefined") {
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }
    return false;
  });
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isVisible) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (elementRef.current) {
            observer.unobserve(elementRef.current);
          }
        }
      },
      {
        threshold: 0.1,
        rootMargin: "0px 0px -40px 0px",
      }
    );

    const currentEl = elementRef.current;
    if (currentEl) {
      observer.observe(currentEl);
    }

    return () => {
      if (currentEl) {
        observer.unobserve(currentEl);
      }
    };
  }, []);

  const getTransformStyle = () => {
    if (isVisible) return "translate-x-0 translate-y-0 opacity-100";

    switch (direction) {
      case "up":
        return "translate-y-6 opacity-0";
      case "down":
        return "-translate-y-6 opacity-0";
      case "left":
        return "translate-x-6 opacity-0";
      case "right":
        return "-translate-x-6 opacity-0";
      case "none":
        return "opacity-0";
      default:
        return "translate-y-6 opacity-0";
    }
  };

  return (
    <div
      ref={elementRef}
      style={{
        transitionDuration: "500ms",
        transitionDelay: `${delay}ms`,
      }}
      className={`transition-all ease-out ${getTransformStyle()} ${className}`}
    >
      {children}
    </div>
  );
}
