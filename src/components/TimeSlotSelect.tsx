import type { TimeSlot } from "@/lib/stayTimes";

export function TimeSlotSelect({
  id,
  value,
  onChange,
  slots,
  describedBy,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  slots: readonly TimeSlot[];
  describedBy?: string;
}) {
  return (
    <select
      id={id}
      className="input"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      aria-describedby={describedBy}
      required
    >
      {slots.map((slot) => (
        <option key={slot.value} value={slot.value}>
          {slot.label}
        </option>
      ))}
    </select>
  );
}
