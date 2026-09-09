export interface StaffMember {
  id: string;
  name: string;
  role: string;
}

export const staff: StaffMember[] = [
  { id: "lucas-anderson", name: "Lucas Anderson", role: "Junior Property Manager" },
  { id: "jamie-anderson", name: "Jamie Anderson", role: "Property Manager" },
  { id: "mara-sambucco", name: "Mara Sambucco", role: "Home Owner" },
  { id: "shane-campbell", name: "Shane Campbell", role: "Contractor" },
  { id: "general-contractor", name: "General Contractor", role: "Contractor" },
  { id: "landscape-contractor", name: "Landscape Contractor", role: "Contractor" },
  { id: "plumbing-contractor", name: "Plumbing Contractor", role: "Contractor" },
  { id: "electrical-contractor", name: "Electrical Contractor", role: "Contractor" },
  { id: "maintenance-contractor", name: "Maintenance Contractor", role: "Contractor" },
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
