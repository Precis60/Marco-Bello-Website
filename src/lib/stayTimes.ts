import { EARLY_LATE_FEE, formatAud } from "./rates";

/** 24-hour values stored on the booking. Labels are 12-hour. */
export const STANDARD_CHECK_IN = "14:00";
export const STANDARD_CHECK_OUT = "10:00";

export interface TimeSlot {
  value: string;
  label: string;
}

function formatHour(value: string): string {
  const [hourText, minuteText] = value.split(":");
  const hour = Number(hourText);
  const period = hour >= 12 ? "pm" : "am";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}:${minuteText}${period}`;
}

function toMinutes(value: string): number {
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
}

function fromMinutes(total: number): string {
  const hour = Math.floor(total / 60);
  const minute = total % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function buildSlots(start: string, end: string, standard: string, kind: "check-in" | "check-out"): TimeSlot[] {
  const fee = formatAud(EARLY_LATE_FEE);
  const slots: TimeSlot[] = [];
  const endMinutes = toMinutes(end);
  for (let minutes = toMinutes(start); minutes <= endMinutes; minutes += 30) {
    const value = fromMinutes(minutes);
    let label = formatHour(value);
    if (value === standard) label += " (standard)";
    else if (kind === "check-in" && value < standard) label += ` (early · ${fee})`;
    else if (kind === "check-out" && value > standard) label += ` (late · ${fee})`;
    slots.push({ value, label });
  }
  return slots;
}

/** 12:00pm through 8:00pm, every 30 minutes. 2:00pm is the standard check-in. */
export const CHECK_IN_SLOTS = buildSlots("12:00", "20:00", STANDARD_CHECK_IN, "check-in");

/** 7:00am through 12:00pm, every 30 minutes. 10:00am is the standard check-out. */
export const CHECK_OUT_SLOTS = buildSlots("07:00", "12:00", STANDARD_CHECK_OUT, "check-out");

export function isListedTime(value: string, slots: readonly TimeSlot[]): boolean {
  return slots.some((slot) => slot.value === value);
}
