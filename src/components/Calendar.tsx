"use client";

import { DayPicker, type DayPickerProps } from "react-day-picker";
import "react-day-picker/style.css";

/** Wraps react-day-picker so every calendar on the site picks up the brand styling. */
export function Calendar({ className, ...props }: DayPickerProps) {
  return (
    <DayPicker
      showOutsideDays
      weekStartsOn={1}
      className={`calendar${className ? ` ${className}` : ""}`}
      {...props}
    />
  );
}
