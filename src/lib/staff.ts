export interface StaffMember {
  id: string;
  name: string;
  role: string;
}

export const staff: StaffMember[] = [
  { id: "lucas-anderson", name: "Lucas Anderson", role: "Junior Property Manager" },
  { id: "jamie-anderson", name: "Jamie Anderson", role: "Property Manager" },
  { id: "mara-sambucco", name: "Mara Sambucco", role: "Home Owner" },
];

export function getStaffMember(id: string): StaffMember | undefined {
  return staff.find((member) => member.id === id);
}

/** Initials used for message avatars, e.g. "Lucas Anderson" as "LA". */
export function staffInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
