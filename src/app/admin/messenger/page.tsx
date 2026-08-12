"use client";

import { useEffect, useRef, useState } from "react";

import { AdminLogin } from "@/components/AdminLogin";
import { staff, staffInitials } from "@/lib/staff";

interface Message {
  id: number;
  sender_id: string;
  recipient_id: string | null;
  body: string;
  created_at: string;
}

const VIEWER_STORAGE_KEY = "bmf-messenger-viewer";
const POLL_INTERVAL_MS = 8000;

const timeFormatter = new Intl.DateTimeFormat("en-AU", { hour: "numeric", minute: "2-digit" });
const dayFormatter = new Intl.DateTimeFormat("en-AU", {
  weekday: "long",
  day: "numeric",
  month: "short",
});

function senderName(id: string) {
  return staff.find((member) => member.id === id)?.name ?? id;
}

export default function AdminMessengerPage() {
  const [token, setToken] = useState("");
  const [authenticated, setAuthenticated] = useState(false);

  const [viewerId, setViewerId] = useState<string | null>(null);
  const [channel, setChannel] = useState<string | null>(null); // null = whole team
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const threadRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem(VIEWER_STORAGE_KEY);
    if (saved && staff.some((member) => member.id === saved)) setViewerId(saved);
  }, []);

  const chooseViewer = (id: string) => {
    setViewerId(id);
    window.localStorage.setItem(VIEWER_STORAGE_KEY, id);
    if (channel === id) setChannel(null);
  };

  const loadMessages = async () => {
    if (!viewerId) return;
    const params = new URLSearchParams({ viewerId });
    if (channel) params.set("withId", channel);

    const res = await fetch(`/api/messages?${params}`, { headers: { "x-admin-token": token } });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Couldn’t load messages.");
      setMessages(null);
      return;
    }
    const data = await res.json();
    setMessages(data.messages ?? []);
    setError(null);
  };

  useEffect(() => {
    if (!authenticated || !viewerId) return;
    loadMessages();
    const timer = setInterval(loadMessages, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticated, viewerId, channel]);

  useEffect(() => {
    const thread = threadRef.current;
    if (thread) thread.scrollTop = thread.scrollHeight;
  }, [messages]);

  const login = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthenticated(true);
  };

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewerId) return;
    setSending(true);
    setError(null);

    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, senderId: viewerId, recipientId: channel, body: draft }),
    });

    if (res.ok) {
      setDraft("");
      await loadMessages();
    } else {
      const data = await res.json();
      setError(data.error ?? "Couldn’t send that message.");
    }
    setSending(false);
  };

  const removeMessage = async (id: number) => {
    if (!viewerId) return;
    setError(null);
    const res = await fetch("/api/messages", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, id, senderId: viewerId }),
    });
    if (res.ok) await loadMessages();
    else setError("Couldn’t delete that message.");
  };

  if (!authenticated) {
    return (
      <AdminLogin
        token={token}
        onTokenChange={setToken}
        onSubmit={login}
        description="Enter the admin token to open the staff messenger."
        error={error}
      />
    );
  }

  if (!viewerId) {
    return (
      <section className="card mx-auto max-w-lg">
        <h2 className="card-title">Who are you?</h2>
        <p className="card-subtitle">
          Pick your name so messages are sent under it. This is remembered on this device.
        </p>
        <ul className="mt-8 space-y-3">
          {staff.map((member) => (
            <li key={member.id}>
              <button
                onClick={() => chooseViewer(member.id)}
                className="flex w-full items-center gap-4 rounded-xl border border-black/10 p-4 text-left transition-colors hover:bg-black/[0.03]"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand/15 text-sm font-semibold">
                  {staffInitials(member.name)}
                </span>
                <span>
                  <span className="block text-sm font-semibold">{member.name}</span>
                  <span className="block text-xs text-muted">{member.role}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  const others = staff.filter((member) => member.id !== viewerId);
  const channelTitle = channel ? senderName(channel) : "Team channel";

  let lastDay = "";

  return (
    <section className="card">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <h2 className="card-title">Staff messenger</h2>
          <p className="card-subtitle">
            Signed in as {senderName(viewerId)}. Messages are visible to anyone with the admin
            token.
          </p>
        </div>
        <button
          onClick={() => {
            window.localStorage.removeItem(VIEWER_STORAGE_KEY);
            setViewerId(null);
            setMessages(null);
          }}
          className="text-xs font-semibold text-muted hover:text-foreground"
        >
          Switch user
        </button>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[16rem_1fr]">
        <nav aria-label="Conversations" className="space-y-2">
          <button
            onClick={() => setChannel(null)}
            aria-current={channel === null ? "true" : undefined}
            className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
              channel === null
                ? "border-brand bg-brand/10"
                : "border-black/10 hover:bg-black/[0.03]"
            }`}
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-black/[0.06] text-xs font-semibold">
              ALL
            </span>
            <span>
              <span className="block text-sm font-semibold">Team channel</span>
              <span className="block text-xs text-muted">Everyone</span>
            </span>
          </button>

          {others.map((member) => (
            <button
              key={member.id}
              onClick={() => setChannel(member.id)}
              aria-current={channel === member.id ? "true" : undefined}
              className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
                channel === member.id
                  ? "border-brand bg-brand/10"
                  : "border-black/10 hover:bg-black/[0.03]"
              }`}
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand/15 text-xs font-semibold">
                {staffInitials(member.name)}
              </span>
              <span>
                <span className="block text-sm font-semibold">{member.name}</span>
                <span className="block text-xs text-muted">{member.role}</span>
              </span>
            </button>
          ))}
        </nav>

        <div className="flex min-h-[28rem] flex-col rounded-2xl border border-black/10">
          <div className="border-b border-black/10 px-5 py-4">
            <p className="text-sm font-semibold">{channelTitle}</p>
            <p className="text-xs text-muted">
              {channel ? "Direct message" : "Visible to all three staff"}
            </p>
          </div>

          <div ref={threadRef} className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
            {messages === null ? (
              <p className="text-sm text-muted">Loading…</p>
            ) : messages.length === 0 ? (
              <p className="text-sm text-muted">No messages yet. Start the conversation below.</p>
            ) : (
              messages.map((message) => {
                const mine = message.sender_id === viewerId;
                const sentAt = new Date(message.created_at);
                const day = dayFormatter.format(sentAt);
                const showDay = day !== lastDay;
                lastDay = day;

                return (
                  <div key={message.id}>
                    {showDay && (
                      <p className="mb-4 text-center text-[11px] font-semibold tracking-[0.14em] text-muted uppercase">
                        {day}
                      </p>
                    )}
                    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div className="max-w-[85%]">
                        {!mine && (
                          <p className="mb-1 text-xs font-semibold text-muted">
                            {senderName(message.sender_id)}
                          </p>
                        )}
                        <div
                          className={`rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap ${
                            mine ? "bg-brand text-white" : "bg-black/[0.05]"
                          }`}
                        >
                          {message.body}
                        </div>
                        <div
                          className={`mt-1 flex items-center gap-3 text-[11px] text-muted ${
                            mine ? "justify-end" : ""
                          }`}
                        >
                          <span>{timeFormatter.format(sentAt)}</span>
                          {mine && (
                            <button
                              onClick={() => removeMessage(message.id)}
                              className="font-semibold hover:text-red-600"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <form onSubmit={send} className="border-t border-black/10 p-4">
            <label className="field-label sr-only" htmlFor="message-body">
              Message
            </label>
            <textarea
              id="message-body"
              className="input"
              rows={2}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (draft.trim() && !sending) send(e);
                }
              }}
              placeholder={`Message ${channelTitle}…`}
            />
            <div className="mt-3 flex items-center justify-between gap-4">
              <p className="text-xs text-muted">Enter to send, Shift+Enter for a new line.</p>
              <button type="submit" className="btn btn-primary" disabled={sending || !draft.trim()}>
                {sending ? "Sending…" : "Send"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {error && (
        <p className="mt-6 rounded-xl border border-red-600/20 bg-red-600/10 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}
    </section>
  );
}
