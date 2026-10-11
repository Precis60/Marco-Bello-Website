"use client";

import { useState, type FormEvent } from "react";

import { assignLocation } from "@/lib/navigate";
import { EMAIL } from "@/lib/site";

export function EnquiryForm({
  idPrefix,
  topics,
  defaultTopic,
  submitLabel = "Send enquiry",
  extraNote,
}: {
  idPrefix: string;
  topics: { value: string; label: string }[];
  defaultTopic?: string;
  submitLabel?: string;
  extraNote?: string;
}) {
  const [sentHint, setSentHint] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "");
    const email = String(formData.get("email") ?? "");
    const phone = String(formData.get("phone") ?? "");
    const topic = String(formData.get("topic") ?? "");
    const dates = String(formData.get("dates") ?? "");
    const message = String(formData.get("message") ?? "");
    const topicLabel = topics.find((item) => item.value === topic)?.label ?? topic;
    const subject = `Enquiry from ${name} — ${topicLabel}`;
    const body = [
      `Name: ${name}`,
      `Email: ${email}`,
      `Phone: ${phone || "—"}`,
      `Topic: ${topicLabel}`,
      dates ? `Dates: ${dates}` : "",
      "",
      message,
    ]
      .filter((line) => line !== "")
      .join("\n");
    setSentHint(true);
    assignLocation(`mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-black/10 bg-surface p-6">
      <div className="grid gap-4">
        <div>
          <label htmlFor={`${idPrefix}-name`} className="text-xs font-semibold tracking-[0.18em] uppercase text-muted">
            Name
          </label>
          <input id={`${idPrefix}-name`} className="input" name="name" required autoComplete="name" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor={`${idPrefix}-email`} className="text-xs font-semibold tracking-[0.18em] uppercase text-muted">
              Email
            </label>
            <input id={`${idPrefix}-email`} className="input" name="email" type="email" required autoComplete="email" />
          </div>
          <div>
            <label htmlFor={`${idPrefix}-phone`} className="text-xs font-semibold tracking-[0.18em] uppercase text-muted">
              Phone
            </label>
            <input id={`${idPrefix}-phone`} className="input" name="phone" type="tel" autoComplete="tel" />
          </div>
        </div>
        <div>
          <label htmlFor={`${idPrefix}-topic`} className="text-xs font-semibold tracking-[0.18em] uppercase text-muted">
            What is this about?
          </label>
          <select
            id={`${idPrefix}-topic`}
            className="input"
            name="topic"
            defaultValue={defaultTopic ?? topics[0]?.value}
            required
          >
            {topics.map((topic) => (
              <option key={topic.value} value={topic.value}>
                {topic.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={`${idPrefix}-dates`} className="text-xs font-semibold tracking-[0.18em] uppercase text-muted">
            Dates, if you have them
          </label>
          <input id={`${idPrefix}-dates`} className="input" name="dates" placeholder="Check-in and check-out" />
        </div>
        <div>
          <label htmlFor={`${idPrefix}-message`} className="text-xs font-semibold tracking-[0.18em] uppercase text-muted">
            Message
          </label>
          <textarea id={`${idPrefix}-message`} className="input min-h-32" name="message" required />
        </div>
        <button type="submit" className="btn btn-primary">
          {submitLabel}
        </button>
        <p className="text-xs leading-5 text-muted">
          This opens your email app with the enquiry addressed to {EMAIL}. Nothing is charged from this form.
          {extraNote ? ` ${extraNote}` : ""}
        </p>
        {sentHint && (
          <p className="text-xs leading-5 text-muted">
            If your email app did not open, write to {EMAIL} and include the details above.
          </p>
        )}
      </div>
    </form>
  );
}
