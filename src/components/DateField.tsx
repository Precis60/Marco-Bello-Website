"use client";

import { useEffect, useRef, useState } from "react";

import { Calendar } from "@/components/Calendar";
import { formatDate, isoDate } from "@/lib/format";

function parseIso(value: string) {
  const [year, month, day] = isoDate(value).split("-").map(Number);
  if (!year || !month || !day) return undefined;
  return new Date(year, month - 1, day);
}

function toIso(date: Date) {
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/** A calendar date picker that replaces the browser's native `input[type=date]` popup. */
export function DateField({
  id,
  label,
  value,
  onChange,
  min,
  placeholder = "Select a date",
  disabled,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  min?: string;
  placeholder?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = value ? parseIso(value) : undefined;
  const minDate = min ? parseIso(min) : undefined;

  useEffect(() => {
    if (!open) return;

    const closeOnOutsideClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const closeOnEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <label className="field-label" htmlFor={id}>
        {label}
      </label>
      <button
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className={`input flex items-center justify-between gap-3 text-left ${
          disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
        } ${open ? "border-brand ring-2 ring-brand/20" : ""}`}
      >
        <span className={value ? "" : "text-muted-2"}>
          {value ? formatDate(value) : placeholder}
        </span>
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="size-4 shrink-0 text-muted"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.6}
        >
          <rect x="3" y="5" width="18" height="16" rx="3" />
          <path d="M8 3v4M16 3v4M3 10h18" />
        </svg>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={label}
          className="absolute left-0 z-30 mt-2 rounded-2xl border border-black/10 bg-surface p-4 shadow-[0_12px_32px_rgba(22,22,22,0.14)]"
        >
          <Calendar
            mode="single"
            selected={selected}
            defaultMonth={selected ?? minDate}
            disabled={minDate ? { before: minDate } : undefined}
            onSelect={(date) => {
              if (!date) return;
              onChange(toIso(date));
              setOpen(false);
            }}
          />
          {value && (
            <button
              type="button"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
              className="mt-2 w-full text-xs font-semibold text-muted hover:text-foreground"
            >
              Clear date
            </button>
          )}
        </div>
      )}
    </div>
  );
}
