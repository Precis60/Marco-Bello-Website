import crypto from "crypto";

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

export function getManagementUserById(id: string): ManagementUser | undefined {
  return managementUsers.find((u) => u.id === id);
}

export function canAccessTab(user: { tabs: string[] }, tab: string): boolean {
  return user.tabs.includes(tab);
}

/** Verify a PBKDF2-SHA512 hash stored as "saltHex:hashHex". */
function verifyPbkdf2Hash(password: string, stored: string): boolean {
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;

  try {
    const salt = Buffer.from(saltHex, "hex");
    const expected = Buffer.from(hashHex, "hex");
    const derived = crypto.pbkdf2Sync(password, salt, 100000, expected.length, "sha512");
    return crypto.timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

export function validateManagementLogin(
  username: string,
  password: string,
  tab?: string,
): ManagementUser | null {
  const user = getManagementUserByUsername(username);
  if (!user) {
    console.error("Management login: unknown username", username);
    return null;
  }

  const envKey = `MANAGEMENT_HASH_${user.id.toUpperCase()}`;
  const storedHash = process.env[envKey]?.trim();
  if (!storedHash) {
    console.error(`Management login: ${envKey} is not set`);
    return null;
  }

  if (!storedHash.includes(":") || storedHash.split(":").length !== 2) {
    console.error(`Management login: ${envKey} format is invalid`);
    return null;
  }

  if (!verifyPbkdf2Hash(password, storedHash)) {
    console.error(`Management login: ${envKey} did not match the supplied password`);
    return null;
  }

  if (tab && !canAccessTab(user, tab)) {
    console.error(`Management login: user ${user.id} has no access to tab ${tab}`);
    return null;
  }

  return user;
}
