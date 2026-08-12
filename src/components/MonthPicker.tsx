"use client";

export const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** Month and year selects, kept in step with a single `Date` cursor. */
export function MonthPicker({
  month,
  onChange,
  idPrefix = "month-picker",
}: {
  month: Date;
  onChange: (month: Date) => void;
  idPrefix?: string;
}) {
  const years = Array.from({ length: 7 }, (_, i) => new Date().getFullYear() - 1 + i);

  return (
    <div className="flex gap-3">
      <div>
        <label className="field-label" htmlFor={`${idPrefix}-month`}>
          Month
        </label>
        <select
          id={`${idPrefix}-month`}
          className="input"
          value={month.getMonth()}
          onChange={(e) => onChange(new Date(month.getFullYear(), Number(e.target.value), 1))}
        >
          {MONTH_NAMES.map((name, index) => (
            <option key={name} value={index}>
              {name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="field-label" htmlFor={`${idPrefix}-year`}>
          Year
        </label>
        <select
          id={`${idPrefix}-year`}
          className="input"
          value={month.getFullYear()}
          onChange={(e) => onChange(new Date(Number(e.target.value), month.getMonth(), 1))}
        >
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
