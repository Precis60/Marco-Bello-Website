"use client";

import { useEffect, useMemo, useState } from "react";

import { AdminLogin } from "@/components/AdminLogin";

interface Contact {
  id: number;
  first_name: string;
  last_name: string;
  company: string | null;
  position: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
}

interface ContactForm {
  firstName: string;
  lastName: string;
  company: string;
  position: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
}

const EMPTY_FORM: ContactForm = {
  firstName: "",
  lastName: "",
  company: "",
  position: "",
  email: "",
  phone: "",
  address: "",
  notes: "",
};

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

/** The A–Z bucket a contact sorts into, with anything else grouped under "#". */
function initial(contact: Contact) {
  const letter = contact.last_name.trim().charAt(0).toUpperCase();
  return LETTERS.includes(letter) ? letter : "#";
}

export default function AdminContactsPage() {
  const [token, setToken] = useState("");
  const [authenticated, setAuthenticated] = useState(false);

  const [contacts, setContacts] = useState<Contact[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [letter, setLetter] = useState<string | null>(null);

  const [form, setForm] = useState<ContactForm>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const login = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthenticated(true);
  };

  const loadContacts = async () => {
    const res = await fetch("/api/contacts", { headers: { "x-admin-token": token } });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Couldn’t load contacts.");
      setContacts(null);
      return;
    }
    const data = await res.json();
    setContacts(data.contacts ?? []);
    setError(null);
  };

  useEffect(() => {
    if (!authenticated) return;
    loadContacts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticated]);

  const usedLetters = useMemo(() => new Set((contacts ?? []).map((c) => initial(c))), [contacts]);

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (contacts ?? []).filter((c) => {
      if (letter && initial(c) !== letter) return false;
      if (!query) return true;
      return [
        c.first_name,
        c.last_name,
        c.company,
        c.position,
        c.email,
        c.phone,
        c.address,
        c.notes,
      ]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(query));
    });
  }, [contacts, search, letter]);

  const grouped = useMemo(() => {
    const groups = new Map<string, Contact[]>();
    for (const contact of visible) {
      const key = initial(contact);
      const group = groups.get(key);
      if (group) group.push(contact);
      else groups.set(key, [contact]);
    }
    return [...groups.entries()].sort(([a], [b]) => {
      if (a === "#") return 1;
      if (b === "#") return -1;
      return a.localeCompare(b);
    });
  }, [visible]);

  const updateForm = (field: keyof ContactForm, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const saveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const res = await fetch("/api/contacts", {
      method: editingId === null ? "POST" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, id: editingId ?? undefined, ...form }),
    });

    if (res.ok) {
      setForm(EMPTY_FORM);
      setEditingId(null);
      await loadContacts();
    } else {
      const data = await res.json();
      setError(data.error ?? "Couldn’t save that contact.");
    }
    setSaving(false);
  };

  const startEditing = (contact: Contact) => {
    setEditingId(contact.id);
    setForm({
      firstName: contact.first_name,
      lastName: contact.last_name,
      company: contact.company ?? "",
      position: contact.position ?? "",
      email: contact.email ?? "",
      phone: contact.phone ?? "",
      address: contact.address ?? "",
      notes: contact.notes ?? "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const removeContact = async (id: number) => {
    setError(null);
    const res = await fetch("/api/contacts", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, id }),
    });
    if (res.ok) {
      if (editingId === id) {
        setEditingId(null);
        setForm(EMPTY_FORM);
      }
      await loadContacts();
    } else {
      setError("Couldn’t delete that contact.");
    }
  };

  if (!authenticated) {
    return (
      <AdminLogin
        token={token}
        onTokenChange={setToken}
        onSubmit={login}
        description="Enter the admin token to manage the contact book."
        error={error}
      />
    );
  }

  return (
    <>
      <section className="card">
        <h2 className="card-title">{editingId === null ? "Add a contact" : "Edit contact"}</h2>
        <p className="card-subtitle">
          Contacts are listed alphabetically by last name. Only the name is required.
        </p>

        <form onSubmit={saveContact} className="mt-8 grid gap-5 sm:grid-cols-2">
          <div>
            <label className="field-label" htmlFor="contact-first">
              First name
            </label>
            <input
              id="contact-first"
              className="input"
              value={form.firstName}
              onChange={(e) => updateForm("firstName", e.target.value)}
              required
            />
          </div>
          <div>
            <label className="field-label" htmlFor="contact-last">
              Last name
            </label>
            <input
              id="contact-last"
              className="input"
              value={form.lastName}
              onChange={(e) => updateForm("lastName", e.target.value)}
              required
            />
          </div>
          <div>
            <label className="field-label" htmlFor="contact-company">
              Company
            </label>
            <input
              id="contact-company"
              className="input"
              value={form.company}
              onChange={(e) => updateForm("company", e.target.value)}
              placeholder="e.g. Hunter Electrical"
            />
          </div>
          <div>
            <label className="field-label" htmlFor="contact-position">
              Position
            </label>
            <input
              id="contact-position"
              className="input"
              value={form.position}
              onChange={(e) => updateForm("position", e.target.value)}
              placeholder="e.g. Site foreman"
            />
          </div>
          <div>
            <label className="field-label" htmlFor="contact-email">
              Email
            </label>
            <input
              id="contact-email"
              className="input"
              type="email"
              value={form.email}
              onChange={(e) => updateForm("email", e.target.value)}
            />
          </div>
          <div>
            <label className="field-label" htmlFor="contact-phone">
              Phone number
            </label>
            <input
              id="contact-phone"
              className="input"
              type="tel"
              value={form.phone}
              onChange={(e) => updateForm("phone", e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="field-label" htmlFor="contact-address">
              Address
            </label>
            <input
              id="contact-address"
              className="input"
              value={form.address}
              onChange={(e) => updateForm("address", e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="field-label" htmlFor="contact-notes">
              Notes (optional)
            </label>
            <textarea
              id="contact-notes"
              className="input"
              rows={2}
              value={form.notes}
              onChange={(e) => updateForm("notes", e.target.value)}
            />
          </div>

          <div className="mt-2 flex flex-wrap justify-end gap-3 border-t border-black/10 pt-5 sm:col-span-2">
            {editingId !== null && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setEditingId(null);
                  setForm(EMPTY_FORM);
                }}
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving || !form.firstName.trim() || !form.lastName.trim()}
            >
              {saving ? "Saving…" : editingId === null ? "Add contact" : "Save changes"}
            </button>
          </div>
        </form>

        {error && (
          <p className="mt-6 rounded-xl border border-red-600/20 bg-red-600/10 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}
      </section>

      <section className="card">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <h2 className="card-title">Contact book</h2>
            <p className="card-subtitle">
              {contacts === null
                ? "Loading…"
                : `${visible.length} of ${contacts.length} contact${contacts.length === 1 ? "" : "s"}`}
            </p>
          </div>
          <div className="w-full sm:w-72">
            <label className="field-label" htmlFor="contact-search">
              Search
            </label>
            <input
              id="contact-search"
              className="input"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name, company, email or phone"
            />
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-1 border-y border-black/10 py-3">
          <button
            onClick={() => setLetter(null)}
            className={`min-w-8 rounded-lg px-2 py-1 text-xs font-semibold transition-colors ${
              letter === null ? "bg-brand text-white" : "text-muted hover:bg-black/[0.05]"
            }`}
          >
            All
          </button>
          {[...LETTERS, "#"].map((option) => {
            const available = usedLetters.has(option);
            return (
              <button
                key={option}
                onClick={() => setLetter(option)}
                disabled={!available}
                className={`min-w-8 rounded-lg px-2 py-1 text-xs font-semibold transition-colors ${
                  letter === option
                    ? "bg-brand text-white"
                    : available
                      ? "text-foreground hover:bg-black/[0.05]"
                      : "cursor-not-allowed text-muted-2 opacity-40"
                }`}
              >
                {option}
              </button>
            );
          })}
        </div>

        {contacts === null ? (
          <p className="mt-6 text-sm text-muted">Loading contacts…</p>
        ) : visible.length === 0 ? (
          <p className="mt-6 text-sm text-muted">
            {contacts.length === 0 ? "No contacts yet." : "No contacts match that filter."}
          </p>
        ) : (
          <div className="mt-6 space-y-8">
            {grouped.map(([groupLetter, groupContacts]) => (
              <div key={groupLetter}>
                <h3 className="text-xs font-semibold tracking-[0.18em] text-muted uppercase">
                  {groupLetter}
                </h3>
                <div className="mt-3 overflow-x-auto rounded-xl border border-black/10">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Position</th>
                        <th>Company</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Address</th>
                        <th className="text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupContacts.map((contact) => (
                        <tr key={contact.id}>
                          <td className="font-semibold whitespace-nowrap">
                            {contact.last_name}, {contact.first_name}
                            {contact.notes && (
                              <div className="mt-1 text-xs font-normal text-muted">
                                {contact.notes}
                              </div>
                            )}
                          </td>
                          <td className="text-muted">{contact.position ?? "—"}</td>
                          <td className="text-muted">{contact.company ?? "—"}</td>
                          <td className="text-muted">
                            {contact.email ? (
                              <a className="hover:underline" href={`mailto:${contact.email}`}>
                                {contact.email}
                              </a>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td className="whitespace-nowrap text-muted">
                            {contact.phone ? (
                              <a className="hover:underline" href={`tel:${contact.phone}`}>
                                {contact.phone}
                              </a>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td className="text-muted">{contact.address ?? "—"}</td>
                          <td>
                            <div className="flex justify-end gap-3 whitespace-nowrap">
                              <button
                                onClick={() => startEditing(contact)}
                                className="text-xs font-semibold hover:underline"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => removeContact(contact.id)}
                                className="text-xs font-semibold text-red-600 hover:underline"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
