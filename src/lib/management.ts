export interface ManagementUser {
  id: string;
  name: string;
  username: string;
  tabs: string[];
}

export const managementUsers: ManagementUser[] = [
  {
    id: "lucas",
    name: "Lucas Anderson",
    username: "Lucas2013",
    tabs: ["calendar", "contacts", "messenger", "tasks"],
  },
  {
    id: "mara",
    name: "Mara Sambucco",
    username: "Mara3222",
    tabs: ["blocks", "bookings", "calendar", "contacts", "expenses", "messenger", "prices", "tasks"],
  },
  {
    id: "jamie",
    name: "Jamie Anderson",
    username: "Precis1013",
    tabs: ["blocks", "bookings", "calendar", "contacts", "expenses", "messenger", "prices", "tasks"],
  },
];

export function getManagementUserByUsername(username: string): ManagementUser | undefined {
  return managementUsers.find((u) => u.username === username);
}

export function canAccessTab(user: ManagementUser, tab: string): boolean {
  return user.tabs.includes(tab);
}

export function validateManagementLogin(
  username: string,
  password: string,
  tab?: string,
): ManagementUser | null {
  const user = getManagementUserByUsername(username);
  if (!user) return null;

  const envPassword = process.env[`MANAGEMENT_PASSWORD_${user.id.toUpperCase()}`]?.trim();
  if (!envPassword || envPassword !== password) return null;
  if (tab && !canAccessTab(user, tab)) return null;

  return user;
}
