/** Shared vocabulary for logging and assigning work around the farm. */

export const AREAS = [
  "Main house",
  "Vineyard tiny home",
  "Vineyard",
  "Orchard",
  "Gardens & lawns",
  "Sheds & equipment",
  "Fences & boundaries",
  "Driveway & access",
  "Water & irrigation",
  "Other",
];

export const WORK_TYPES = [
  "Mowing & slashing",
  "Pruning & hedging",
  "Planting",
  "Irrigation",
  "Cleaning",
  "Maintenance & repair",
  "Inspection",
  "Rubbish & green waste",
  "Contractor supervision",
  "Guest turnover",
  "Admin",
  "Other",
];

export const TASK_STATUSES = [
  { value: "open", label: "To do" },
  { value: "in-progress", label: "In progress" },
  { value: "done", label: "Complete" },
];

export const TASK_PRIORITIES = [
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

export function statusLabel(status: string) {
  return TASK_STATUSES.find((s) => s.value === status)?.label ?? status;
}

/** "90" minutes as "1h 30m", for display alongside logged work. */
export function formatMinutes(minutes: number) {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`;
}
