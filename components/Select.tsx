"use client";

import { useState, useRef, useEffect } from "react";

interface SelectProps {
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export default function Select({
  name,
  value,
  onChange,
  options,
  placeholder = "Select...",
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={ref} className="relative">
      <input type="hidden" name={name} value={value} />
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-white/20 transition-colors flex items-center justify-between"
      >
        <span className={selected ? "text-white/90" : "text-white/30"}>
          {selected?.label || placeholder}
        </span>
        <svg
          className={`w-4 h-4 text-white/40 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-2 glass-strong rounded-xl overflow-hidden z-50 max-h-60 overflow-y-auto">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className="w-full px-4 py-2.5 text-left text-sm hover:bg-white/5 transition-colors"
              style={{
                color:
                  option.value === value
                    ? "rgba(255,255,255,0.9)"
                    : "rgba(255,255,255,0.6)",
                background:
                  option.value === value
                    ? "rgba(255,255,255,0.05)"
                    : "transparent",
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
