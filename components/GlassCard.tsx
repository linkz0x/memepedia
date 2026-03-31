"use client";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  strong?: boolean;
}

export default function GlassCard({
  children,
  className = "",
  strong = false,
}: GlassCardProps) {
  return (
    <div
      className={`${strong ? "glass-strong" : "glass"} rounded-2xl ${className}`}
    >
      {children}
    </div>
  );
}
