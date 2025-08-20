// app/inbox/page.js
"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import dynamic from "next/dynamic";
import MarkdownIt from "markdown-it";
import { z } from "zod";
import { Toaster, toast } from "sonner";

// ---- Editors (dynamic to avoid SSR issues) ----
const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });
const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

// ---- Styles for editors ----
import "react-quill/dist/quill.snow.css";
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";

// ---- Simple validators (Zod) ----
const MailSendSchema = z.object({
  to: z
    .string()
    .email("Invalid recipient email")
    .min(5, "Recipient is required"),
  cc: z.string().optional(),
  bcc: z.string().optional(),
  subject: z.string().min(1, "Subject is required"),
  htmlBody: z.string().min(1, "Body is required"),
  textBody: z.string().min(1, "Body is required"),
  attachments: z
    .array(
      z.object({
        name: z.string(),
        size: z.number(),
        type: z.string().optional(),
      })
    )
    .optional(),
});

const md = new MarkdownIt();

// Helpers
const bytesToKB = (b) => `${Math.round(b / 1024)} KB`;
const escapeHtml = (txt) =>
  txt
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
const textToHtml = (txt) => `<p>${escapeHtml(txt).replace(/\n/g, "<br/>")}</p>`;

// ---- MAIN PAGE ----
export default function InboxPage() {
  // Inbox state
  const [loading, setLoading] = useState(true);
  const [mails, setMails] = useState([]);
  const [selectedMailId, setSelectedMailId] = useState(null);

  // Search + filter
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all"); // all | with-attachments

  // Compose state
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeMode, setComposeMode] = useState("html"); // html | markdown | text
  const [to, setTo] = useState("");
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState(""); // raw content for current mode
  const [files, setFiles] = useState([]); // File[]

  // Autosave (localStorage)
  const AUTOSAVE_KEY = "inbox_draft_autosave_v1";
  const autosaveTimer = useRef(null);

  // Fetch mails from dummy API
  const fetchMails = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/mails", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch mails");
      const data = await res.json();
      setMails(data.mails || []);
      setSelectedMailId((prev) => prev ?? data.mails?.[0]?.id ?? null);
    } catch (e) {
      toast.error("Unable to load inbox");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMails();
  }, [fetchMails]);

  const selectedMail = useMemo(
    () => mails.find((m) => m.id === selectedMailId) || null,
    [mails, selectedMailId]
  );

  const filteredMails = useMemo(() => {
    const q = query.trim().toLowerCase();
    return mails.filter((m) => {
      if (filter === "with-attachments" && !m.hasAttachments) return false;
      if (!q) return true;
      const hay = `${m.subject} ${m.fromName} ${m.fromEmail} ${
        m.bodyText || ""
      }`.toLowerCase();
      return hay.includes(q);
    });
  }, [mails, query, filter]);

  // Open compose
  const openCompose = useCallback(
    (prefill = {}) => {
      setComposeOpen(true);
      setComposeMode(prefill.mode || "html");
      setTo(prefill.to || "");
      setCc(prefill.cc || "");
      setBcc(prefill.bcc || "");
      setSubject(prefill.subject || "");
      setBody(prefill.body || "");
      setFiles([]);
    },
    [setComposeOpen]
  );

  // Reply / Forward
  const handleReply = () => {
    if (!selectedMail) return;
    openCompose({
      to: selectedMail.fromEmail,
      subject: selectedMail.subject.startsWith("Re:")
        ? selectedMail.subject
        : `Re: ${selectedMail.subject}`,
      body:
        composeMode === "html"
          ? `<p><br/></p><blockquote>${selectedMail.bodyHtml}</blockquote>`
          : composeMode === "markdown"
          ? `\n\n> ${selectedMail.bodyText
              .split("\n")
              .join("\n> ")}`
          : `\n\n--- Original message ---\n${selectedMail.bodyText}`,
    });
  };

  const handleForward = () => {
    if (!selectedMail) return;
    openCompose({
      to: "",
      subject: selectedMail.subject.startsWith("Fwd:")
        ? selectedMail.subject
        : `Fwd: ${selectedMail.subject}`,
      body:
        composeMode === "html"
          ? `<p><br/></p><blockquote>${selectedMail.bodyHtml}</blockquote>`
          : composeMode === "markdown"
          ? `\n\n> ${selectedMail.bodyText
              .split("\n")
              .join("\n> ")}`
          : `\n\n--- Forwarded message ---\n${selectedMail.bodyText}`,
    });
  };

  // Attachments (local only)
  const onPickFiles = (e) => {
    const picked = Array.from(e.target.files || []);
    setFiles((prev) => [...prev, ...picked]);
    e.target.value = ""; // reset
  };
  const removeFile = (name) =>
    setFiles((prev) => prev.filter((f) => f.name !== name));

  // Compose: convert body for SMTP
  const getPayloadForSend = () => {
    let htmlBody = "";
    let textBody = "";

    if (composeMode === "html") {
      htmlBody = body?.trim() || "";
      textBody = htmlBody
        .replace(/<style[\s\S]*?<\/style>/gi, "")
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<[^>]+>/g, "")
        .replace(/&nbsp;/g, " ")
        .trim();
    } else if (composeMode === "markdown") {
      htmlBody = md.render(body || "");
      textBody = (body || "").trim();
    } else {
      // text
      textBody = (body || "").trim();
      htmlBody = textToHtml(textBody);
    }
    return {
      to,
      cc,
      bcc,
      subject: subject?.trim() || "",
      htmlBody,
      textBody,
      attachments: files.map((f) => ({
        name: f.name,
        size: f.size,
        type: f.type,
      })),
    };
  };

  // Send via dummy API
  const handleSend = async () => {
    const payload = getPayloadForSend();

    const parsed = MailSendSchema.safeParse(payload);
    if (!parsed.success) {
      const first = parsed.error.errors[0]?.message || "Invalid input";
      toast.error(first);
      return;
    }

    toast.loading("Sending…", { id: "send" });
    try {
      const res = await fetch("/api/send", {
        method: "POST",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data?.message || "Send failed");
      }
      toast.success("Sent!", { id: "send" });
      // Clear draft on success
      localStorage.removeItem(AUTOSAVE_KEY);
      setComposeOpen(false);
      setBody("");
      setSubject("");
      setTo("");
      setCc("");
      setBcc("");
      setFiles([]);
      // Optionally refresh inbox
      fetchMails();
    } catch (e) {
      console.error(e);
      toast.error(e.message || "Failed to send", { id: "send" });
    }
  };

  // Autosave every 90s
  useEffect(() => {
    if (!composeOpen) return;
    // Load previous draft
    const prev = localStorage.getItem(AUTOSAVE_KEY);
    if (prev) {
      try {
        const d = JSON.parse(prev);
        setTo(d.to || "");
        setCc(d.cc || "");
        setBcc(d.bcc || "");
        setSubject(d.subject || "");
        setBody(d.body || "");
        setComposeMode(d.composeMode || "html");
      } catch {}
    }

    const tick = () => {
      const draft = {
        to,
        cc,
        bcc,
        subject,
        body,
        composeMode,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(draft));
      toast.message("Draft saved", { duration: 1000 });
    };
    autosaveTimer.current = setInterval(tick, 90 * 1000);

    return () => {
      if (autosaveTimer.current) clearInterval(autosaveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [composeOpen]);

  // Keyboard: C to compose, Esc to close
  useEffect(() => {
    const onKey = (e) => {
      if (e.key.toLowerCase() === "c" && !composeOpen) {
        openCompose();
      }
      if (e.key === "Escape" && composeOpen) {
        setComposeOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [composeOpen, openCompose]);

  // Responsive helper
  const isMobile =
    typeof window !== "undefined" && window.innerWidth < 768;

  return (
    <div className="min-h-screen max-h-screen bg-background text-foreground flex flex-col">
      <Toaster position="top-right" richColors closeButton />

      {/* Top bar */}
      <header className="flex items-center gap-3 p-3 border-b bg-background sticky top-0 z-10">
        <div className="relative">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search mail (subject, from, body)…"
            className="
              w-[48vw] max-w-[520px]
              border border-primary 
              rounded px-3 py-2 text-sm
              focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary
            "
          />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border rounded px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            aria-label="Filter"
          >
            <option value="all">All</option>
            <option value="with-attachments">With attachments</option>
          </select>
          <button
            onClick={() => openCompose()}
            className="px-3 py-2 rounded text-background bg-primary hover:bg-primary/90 text-sm"
          >
            + Compose (C)
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 flex min-h-0">
        {/* List panel */}
        <aside
          className={`${
            isMobile ? (composeOpen ? "hidden" : "block") : "block"
          } w-full md:w-[30%] border-r bg-background overflow-y-auto`}
        >
          {loading ? (
            <div className="p-6 text-sm text-muted">Loading…</div>
          ) : filteredMails.length === 0 ? (
            <div className="p-6 text-sm text-muted">
              No mails match your search.
            </div>
          ) : (
            filteredMails.map((m) => (
              <button
                key={m.id}
                className={`text-left w-full border-b p-3 hover:bg-muted focus:bg-muted outline-none ${
                  selectedMailId === m.id ? "bg-muted" : ""
                }`}
                onClick={() => setSelectedMailId(m.id)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-medium truncate">
                      {m.subject || "No subject"}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {m.fromName || m.fromEmail}
                    </div>
                  </div>
                  <div className="text-[11px] text-muted-foreground whitespace-nowrap">
                    {m.time}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {m.bodyText}
                </div>
                {m.hasAttachments && (
                  <div className="mt-2 text-[11px] inline-block rounded bg-muted px-2 py-0.5">
                    📎 Attachments
                  </div>
                )}
              </button>
            ))
          )}
        </aside>

        {/* Reader / Composer panel */}
        <main className="flex-1 overflow-y-auto p-4">
          {/* Reader */}
          {!composeOpen && selectedMail && (
            <article className="max-w-4xl mx-auto">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-xl font-semibold break-words">
                    {selectedMail.subject}
                  </h2>
                  <div className="text-sm text-muted-foreground mt-1">
                    From: {selectedMail.fromName} &lt;{selectedMail.fromEmail}
                    &gt;
                  </div>
                  <div className="text-xs text-muted-foreground">
                    To: {selectedMail.to}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {selectedMail.time}
                  </div>
                </div>
                <div className="shrink-0 flex gap-2">
                  <button
                    onClick={handleReply}
                    className="px-3 py-1.5 rounded border text-sm hover:bg-muted"
                  >
                    Reply
                  </button>
                  <button
                    onClick={handleForward}
                    className="px-3 py-1.5 rounded border text-sm hover:bg-muted"
                  >
                    Forward
                  </button>
                </div>
              </div>

              <div
                className="prose max-w-none mt-5"
                dangerouslySetInnerHTML={{ __html: selectedMail.bodyHtml }}
              />

              {selectedMail.attachments?.length > 0 && (
                <section className="mt-6">
                  <h3 className="font-medium mb-2">Attachments</h3>
                  <ul className="space-y-1">
                    {selectedMail.attachments.map((a) => (
                      <li
                        key={a.id}
                        className="flex items-center justify-between text-sm"
                      >
                        <a
                          href={a.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary hover:underline"
                        >
                          📎 {a.name}
                        </a>
                        <span className="text-muted-foreground">
                          {bytesToKB(a.size)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </article>
          )}

          {/* Composer */}
          {composeOpen && (
            <section className="bg-background rounded-lg flex flex-col border">
              {/* Header */}
              <div className="flex items-center justify-between px-3 py-2 border-b bg-muted rounded-t-lg">
                <div className="font-medium">New Message</div>
                <div className="flex items-center gap-2">
                  <ModeSwitcher mode={composeMode} setMode={setComposeMode} />
                  <button
                    onClick={() => setComposeOpen(false)}
                    className="px-2 py-1 rounded hover:bg-muted text-sm"
                    aria-label="Close compose"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Fields */}
              <div className="p-3 space-y-2 border-b">
                <Field label="To">
                  <input
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    placeholder="recipient@example.com"
                    className="w-full outline-none border-0 focus:ring-0"
                  />
                </Field>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <Field label="Cc">
                    <input
                      value={cc}
                      onChange={(e) => setCc(e.target.value)}
                      placeholder="optional"
                      className="w-full outline-none border-0 focus:ring-0"
                    />
                  </Field>
                  <Field label="Bcc">
                    <input
                      value={bcc}
                      onChange={(e) => setBcc(e.target.value)}
                      placeholder="optional"
                      className="w-full outline-none border-0 focus:ring-0"
                    />
                  </Field>
                </div>
                <Field label="Subject">
                  <input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Subject"
                    className="w-full outline-none border-0 focus:ring-0"
                  />
                </Field>
              </div>

              {/* Editor */}
              <div className="flex-1 h-full min-h-[360px] max-h-[460px] overflow-auto">
                {composeMode === "html" && (
                  <ReactQuill
                    theme="snow"
                    value={body}
                    onChange={setBody}
                    className="h-full"
                    style={{
                      height: "100%",
                      border: "none",
                      backgroundColor: "white",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  />
                )}

                {composeMode === "markdown" && (
                  <div data-color-mode="light" className="h-full">
                    <MDEditor value={body} onChange={setBody} height="100%" />
                  </div>
                )}

                {composeMode === "text" && (
                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    className="w-full h-full p-3 outline-none bg-white"
                    placeholder="Write your message…"
                  />
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between gap-3 px-3 py-2 border-t rounded-b-lg">
                <div className="flex items-center gap-2">
                  <label className="px-3 py-1.5 rounded border hover:bg-muted text-sm cursor-pointer">
                    Attach files
                    <input
                      type="file"
                      multiple
                      onChange={onPickFiles}
                      className="hidden"
                    />
                  </label>
                  {files.length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      {files.length} file(s) attached
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setComposeOpen(false)}
                    className="px-3 py-1.5 rounded border text-sm hover:bg-muted"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSend}
                    className="px-4 py-1.5 rounded bg-primary text-background text-sm hover:bg-primary/90"
                  >
                    Send
                  </button>
                </div>
              </div>

              {/* Attachment preview list */}
              {files.length > 0 && (
                <div className="px-3 pb-3">
                  <ul className="mt-2 space-y-1">
                    {files.map((f) => (
                      <li
                        key={f.name}
                        className="flex items-center justify-between text-sm border rounded px-2 py-1"
                      >
                        <span className="truncate">
                          📎 {f.name}{" "}
                          <span className="text-muted-foreground">
                            ({bytesToKB(f.size)})
                          </span>
                        </span>
                        <button
                          onClick={() => removeFile(f.name)}
                          className="text-red-600 hover:underline text-xs"
                        >
                          remove
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

// ---- Small UI helpers ----
function Field({ label, children }) {
  return (
    <div className="flex items-center gap-2 border rounded px-2 py-1">
      <span className="text-xs text-muted-foreground w-12">{label}</span>
      {children}
    </div>
  );
}

function ModeSwitcher({ mode, setMode }) {
  const Button = ({ val, children }) => (
    <button
      onClick={() => setMode(val)}
      className={`px-2 py-1 rounded text-sm ${
        mode === val
          ? "bg-primary text-background"
          : "border hover:bg-muted"
      }`}
      aria-pressed={mode === val}
    >
      {children}
    </button>
  );
  return (
    <div className="flex items-center gap-1">
      <Button val="html">HTML</Button>
      <Button val="markdown">Markdown</Button>
      <Button val="text">Text</Button>
    </div>
  );
}
















































// // app/inbox/page.js
// "use client";

// import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
// import dynamic from "next/dynamic";
// import MarkdownIt from "markdown-it";

// // ---- Editors (dynamic to avoid SSR issues) ----
// const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });
// const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

// // ---- Styles for editors ----
// import "react-quill/dist/quill.snow.css";
// // import "@uiw/react-md-editor/dist/mdeditor.css";

// const metadata = { title: "Inbox" };

// // ---- Sample data (replace with API later) ----
// const SAMPLE_MAILS = [
//   {
//     id: "1",
//     fromName: "Kritika Sharma",
//     fromEmail: "kritika@gmail.com",
//     to: "hr@company.com",
//     subject: "Application for xyz role",
//     time: "12:23 pm",
//     bodyHtml:
//       "<p>Dear Kritika ma'am,<br/>My name is Kiran Kuyate. I'm applying for the XYZ role. Please find my resume attached.</p>",
//     bodyText:
//       "Dear Kritika ma'am,\nMy name is Kiran Kuyate. I'm applying for the XYZ role. Please find my resume attached.",
//     hasAttachments: true,
//     attachments: [
//       { id: "a1", name: "resume.pdf", size: 128000, url: "#" },
//       { id: "a2", name: "cover_letter.docx", size: 56000, url: "#" },
//     ],
//   },
//   {
//     id: "2",
//     fromName: "Pramod Kumar",
//     fromEmail: "prmodk@gmail.com",
//     to: "hr@company.com",
//     subject: "Follow-up regarding interview",
//     time: "03:45 pm",
//     bodyHtml:
//       "<p>Respected Sir,</p><p>This is a gentle follow-up regarding my interview for the XYZ role. Kindly update me with the status.</p>",
//     bodyText:
//       "Respected Sir,\n\nThis is a gentle follow-up regarding my interview for the XYZ role. Kindly update me with the status.",
//     hasAttachments: false,
//     attachments: [],
//   },
// ];

// const md = new MarkdownIt();

// // Helpers
// const bytesToKB = (b) => `${Math.round(b / 1024)} KB`;
// const escapeHtml = (txt) =>
//   txt
//     .replaceAll("&", "&amp;")
//     .replaceAll("<", "&lt;")
//     .replaceAll(">", "&gt;")
//     .replaceAll('"', "&quot;");
// const textToHtml = (txt) => `<p>${escapeHtml(txt).replace(/\n/g, "<br/>")}</p>`;

// // ---- MAIN PAGE ----
// export default function InboxPage() {
//   // Inbox state
//   const [mails] = useState(SAMPLE_MAILS);
//   const [selectedMailId, setSelectedMailId] = useState(mails[0]?.id ?? null);
//   const selectedMail = useMemo(
//     () => mails.find((m) => m.id === selectedMailId) || null,
//     [mails, selectedMailId]
//   );

//   // Search + filter
//   const [query, setQuery] = useState("");
//   const [filter, setFilter] = useState("all"); // all | with-attachments

//   const filteredMails = useMemo(() => {
//     const q = query.trim().toLowerCase();
//     return mails.filter((m) => {
//       if (filter === "with-attachments" && !m.hasAttachments) return false;
//       if (!q) return true;
//       const hay =
//         `${m.subject} ${m.fromName} ${m.fromEmail} ${m.bodyText}`.toLowerCase();
//       return hay.includes(q);
//     });
//   }, [mails, query, filter]);

//   // Compose state
//   const [composeOpen, setComposeOpen] = useState(false);
//   const [composeMode, setComposeMode] = useState("html"); // html | markdown | text
//   const [to, setTo] = useState("");
//   const [cc, setCc] = useState("");
//   const [bcc, setBcc] = useState("");
//   const [subject, setSubject] = useState("");
//   const [body, setBody] = useState(""); // raw content for current mode
//   const [files, setFiles] = useState([]); // File[]

//   // Autosave (localStorage)
//   const AUTOSAVE_KEY = "inbox_draft_autosave_v1";
//   const autosaveTimer = useRef(null);

//   // Open compose
//   const openCompose = useCallback(
//     (prefill = {}) => {
//       setComposeOpen(true);
//       setComposeMode(prefill.mode || "html");
//       setTo(prefill.to || "");
//       setCc(prefill.cc || "");
//       setBcc(prefill.bcc || "");
//       setSubject(prefill.subject || "");
//       setBody(prefill.body || "");
//       setFiles([]);
//     },
//     [setComposeOpen]
//   );

//   // Reply / Forward
//   const handleReply = () => {
//     if (!selectedMail) return;
//     openCompose({
//       to: selectedMail.fromEmail,
//       subject: selectedMail.subject.startsWith("Re:")
//         ? selectedMail.subject
//         : `Re: ${selectedMail.subject}`,
//       body:
//         composeMode === "html"
//           ? `<p><br/></p><blockquote>${selectedMail.bodyHtml}</blockquote>`
//           : composeMode === "markdown"
//             ? `\n\n> ${selectedMail.bodyText.split("\n").join("\n> ")}`
//             : `\n\n--- Original message ---\n${selectedMail.bodyText}`,
//     });
//   };

//   const handleForward = () => {
//     if (!selectedMail) return;
//     openCompose({
//       to: "",
//       subject: selectedMail.subject.startsWith("Fwd:")
//         ? selectedMail.subject
//         : `Fwd: ${selectedMail.subject}`,
//       body:
//         composeMode === "html"
//           ? `<p><br/></p><blockquote>${selectedMail.bodyHtml}</blockquote>`
//           : composeMode === "markdown"
//             ? `\n\n> ${selectedMail.bodyText.split("\n").join("\n> ")}`
//             : `\n\n--- Forwarded message ---\n${selectedMail.bodyText}`,
//     });
//   };

//   // Attachments
//   const onPickFiles = (e) => {
//     const picked = Array.from(e.target.files || []);
//     setFiles((prev) => [...prev, ...picked]);
//     e.target.value = ""; // reset
//   };
//   const removeFile = (name) => setFiles((prev) => prev.filter((f) => f.name !== name));

//   // Compose: convert body for SMTP
//   const getPayloadForSend = () => {
//     let htmlBody = "";
//     let textBody = "";

//     if (composeMode === "html") {
//       htmlBody = body;
//       // derive text from html (simple strip)
//       textBody = body
//         .replace(/<br\s*\/?>/gi, "\n")
//         .replace(/<[^>]+>/g, "")
//         .replace(/&nbsp;/g, " ")
//         .trim();
//     } else if (composeMode === "markdown") {
//       htmlBody = md.render(body);
//       textBody = body; // raw md as fallback
//     } else {
//       // text
//       textBody = body;
//       htmlBody = textToHtml(body);
//     }
//     return {
//       to,
//       cc,
//       bcc,
//       subject,
//       htmlBody,
//       textBody,
//       attachments: files.map((f) => ({ name: f.name, size: f.size, type: f.type })),
//     };
//   };

//   // Send (wire to backend later)
//   const handleSend = () => {
//     const payload = getPayloadForSend();
//     // TODO: POST to your API /smtp/send
//     console.log("SENDING PAYLOAD →", payload);
//     // Clear draft on success
//     localStorage.removeItem(AUTOSAVE_KEY);
//     setComposeOpen(false);
//   };

//   // Autosave every 90s
//   useEffect(() => {
//     if (!composeOpen) return;
//     // Load previous draft
//     const prev = localStorage.getItem(AUTOSAVE_KEY);
//     if (prev) {
//       try {
//         const d = JSON.parse(prev);
//         setTo(d.to || "");
//         setCc(d.cc || "");
//         setBcc(d.bcc || "");
//         setSubject(d.subject || "");
//         setBody(d.body || "");
//         setComposeMode(d.composeMode || "html");
//       } catch { }
//     }

//     const tick = () => {
//       const draft = {
//         to,
//         cc,
//         bcc,
//         subject,
//         body,
//         composeMode,
//         savedAt: new Date().toISOString(),
//       };
//       localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(draft));
//     };
//     autosaveTimer.current = setInterval(tick, 90 * 1000);

//     return () => {
//       if (autosaveTimer.current) clearInterval(autosaveTimer.current);
//     };
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [composeOpen]);

//   // Keyboard: C to compose, Esc to close
//   useEffect(() => {
//     const onKey = (e) => {
//       if (e.key.toLowerCase() === "c" && !composeOpen) {
//         openCompose();
//       }
//       if (e.key === "Escape" && composeOpen) {
//         setComposeOpen(false);
//       }
//     };
//     window.addEventListener("keydown", onKey);
//     return () => window.removeEventListener("keydown", onKey);
//   }, [composeOpen, openCompose]);

//   // Responsive behavior: if no selection on mobile, select first filtered
//   useEffect(() => {
//     if (!selectedMailId && filteredMails.length) {
//       setSelectedMailId(filteredMails[0].id);
//     }
//   }, [filteredMails, selectedMailId]);

//   // UI helpers
//   const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

//   return (
//     <div className="min-h-screen max-h-screen bg-muted flex flex-col">
//       {/* Top bar */}
//       <header className="flex items-center gap-3 p-3 border-b bg-background">
      
//        <div className="relative">
//   <input
//     value={query}
//     onChange={(e) => setQuery(e.target.value)}
//     placeholder="Search mail (subject, from, body)…"
//     className="
//       w-[48vw] max-w-[520px]
//       border border-primary 
//       rounded px-3 py-2 text-sm
//       focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary
//     "
//   />
// </div>
//         <div className="ml-auto flex items-center gap-2">
          
//           <select
//             value={filter}
//             onChange={(e) => setFilter(e.target.value)}
//             className="border rounded px-2 py-2 text-sm"
//             aria-label="Filter"
//           >
//             <option value="all">All</option>
//             <option value="with-attachments">With attachments</option>
//           </select>
//           <button
//             onClick={() => openCompose()}
//             className="px-3 py-2 rounded text-background bg-primary hover:bg-primary hover:opacity-90 text-sm"
//           >
//             + Compose (C)
//           </button>
//         </div>
//       </header>

//       {/* Content */}
//       <div className="flex-1 flex min-h-0">
//         {/* List panel */}
//         <aside
//           className={`${isMobile ? (composeOpen ? "hidden" : "block") : "block"
//             } w-full md:w-[30%] border-r bg-background overflow-y-auto`}
//         >
//           {filteredMails.length === 0 ? (
//             <div className="p-6 text-sm text-muted0">No mails match your search.</div>
//           ) : (
//             filteredMails.map((m) => (
//               <button
//                 key={m.id}
//                 className={`text-left w-full border-b p-3 hover:bg-gray-100 focus:bg-gray-100 outline-none ${selectedMailId === m.id ? "bg-gray-100" : ""
//                   }`}
//                 onClick={() => setSelectedMailId(m.id)}
//               >
//                 <div className="flex items-start justify-between gap-2">
//                   <div className="min-w-0">
//                     <div className="font-medium truncate">{m.subject || "No subject"}</div>
//                     <div className="text-xs text-gray-600 truncate">
//                       {m.fromName || m.fromEmail}
//                     </div>
//                   </div>
//                   <div className="text-[11px] text-muted0 backgroundspace-nowrap">{m.time}</div>
//                 </div>
//                 <div className="text-xs text-muted0 mt-1 line-clamp-2">
//                   {m.bodyText}
//                 </div>
//                 {m.hasAttachments && (
//                   <div className="mt-2 text-[11px] inline-block rounded bg-gray-100 px-2 py-0.5">
//                     📎 Attachments
//                   </div>
//                 )}
//               </button>
//             ))
//           )}
//         </aside>

//         {/* Reader / Composer panel */}
//         <main className="flex-1 overflow-y-auto p-4">
//           {/* Reader */}
//           {!composeOpen && selectedMail && (
//             <article className="max-w-4xl mx-auto">
//               <div className="flex items-start justify-between gap-3">
//                 <div className="min-w-0">
//                   <h2 className="text-xl font-semibold break-words">{selectedMail.subject}</h2>
//                   <div className="text-sm text-gray-600 mt-1">
//                     From: {selectedMail.fromName} &lt;{selectedMail.fromEmail}&gt;
//                   </div>
//                   <div className="text-xs text-muted">To: {selectedMail.to}</div>
//                   <div className="text-xs text-gray-400">{selectedMail.time}</div>
//                 </div>
//                 <div className="shrink-0 flex gap-2">
//                   <button
//                     onClick={handleReply}
//                     className="px-3 py-1.5 rounded border text-sm hover:bg-muted"
//                   >
//                     Reply
//                   </button>
//                   <button
//                     onClick={handleForward}
//                     className="px-3 py-1.5 rounded border text-sm hover:bg-muted"
//                   >
//                     Forward
//                   </button>
//                 </div>
//               </div>

//               <div
//                 className="prose max-w-none mt-5"
//                 dangerouslySetInnerHTML={{ __html: selectedMail.bodyHtml }}
//               />

//               {selectedMail.attachments?.length > 0 && (
//                 <section className="mt-6">
//                   <h3 className="font-medium mb-2">Attachments</h3>
//                   <ul className="space-y-1">
//                     {selectedMail.attachments.map((a) => (
//                       <li key={a.id} className="flex items-center justify-between text-sm">
//                         <a
//                           href={a.url}
//                           target="_blank"
//                           rel="noreferrer"
//                           className="text-primary hover:underline"
//                         >
//                           📎 {a.name}
//                         </a>
//                         <span className="text-muted0">{bytesToKB(a.size)}</span>
//                       </li>
//                     ))}
//                   </ul>
//                 </section>
//               )}
//             </article>
//           )}

//           {/* Composer (docked modal style on desktop; full screen on mobile) */}
//           {composeOpen && (
//             <section
//               className="  bg-background  rounded-lg  flex flex-col"
//             // role="dialog"
//             // aria-modal="true"
//             >
//               {/* Header */}
//               <div className="flex items-center justify-between px-3 py-2 border-b bg-muted rounded-t-lg">
//                 <div className="font-medium">New Message</div>
//                 <div className="flex items-center gap-2">
//                   <ModeSwitcher mode={composeMode} setMode={setComposeMode} />
//                   <button
//                     onClick={() => setComposeOpen(false)}
//                     className="px-2 py-1 rounded hover:bg-gray-200 text-sm"
//                     aria-label="Close compose"
//                   >
//                     ✕
//                   </button>
//                 </div>
//               </div>

//               {/* Fields */}
//               <div className="p-3 space-y-2 border-b">
//                 <Field label="To">
//                   <input
//                     value={to}
//                     onChange={(e) => setTo(e.target.value)}
//                     placeholder="recipient@example.com"
//                     className="w-full outline-none"
//                   />
//                 </Field>
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
//                   <Field label="Cc">
//                     <input
//                       value={cc}
//                       onChange={(e) => setCc(e.target.value)}
//                       placeholder="optional"
//                       className="w-full outline-none"
//                     />
//                   </Field>
//                   <Field label="Bcc">
//                     <input
//                       value={bcc}
//                       onChange={(e) => setBcc(e.target.value)}
//                       placeholder="optional"
//                       className="w-full outline-none"
//                     />
//                   </Field>
//                 </div>
//                 <Field label="Subject">
//                   <input
//                     value={subject}
//                     onChange={(e) => setSubject(e.target.value)}
//                     placeholder="Subject"
//                     className="w-full outline-none"
//                   />
//                 </Field>
//               </div>

//               {/* Editor */}
//               <div className="flex-1 h-full min-h-[400px]   max-h-[440px] overflow-auto">
//                 {composeMode === "html" && (
//                   <ReactQuill
//                     theme="snow"
//                     value={body}
//                     onChange={setBody}
//                     className="h-full"
//                     style={{
//                       height: "100%",
//                       border: "none",
//                       backgroundColor: "white",
//                       display: "flex",
//                       flexDirection: "column",
//                     }}
//                   />
//                 )}

//                 {composeMode === "markdown" && (
//                   <div data-color-mode="light" className="h-full">
//                     <MDEditor value={body} onChange={setBody} height="100%" />
//                   </div>
//                 )}

//                 {composeMode === "text" && (
//                   <textarea
//                     value={body}
//                     onChange={(e) => setBody(e.target.value)}
//                     className="w-full h-full p-3 outline-none bg-white"
//                     placeholder="Write your message…"
//                   />
//                 )}
//               </div>


//               {/* Footer */}
//               <div className="flex items-center justify-between gap-3 px-3 py-2 border-t rounded-b-lg">
//                 <div className="flex items-center gap-2">
//                   <label className="px-3 py-1.5 rounded border hover:bg-muted text-sm cursor-pointer">
//                     Attach files
//                     <input
//                       type="file"
//                       multiple
//                       onChange={onPickFiles}
//                       className="hidden"
//                     />
//                   </label>
//                   {files.length > 0 && (
//                     <div className="text-xs text-gray-600">
//                       {files.length} file(s) attached
//                     </div>
//                   )}
//                 </div>
//                 <div className="flex items-center gap-2">
//                   <button
//                     onClick={() => setComposeOpen(false)}
//                     className="px-3 py-1.5 rounded border text-sm hover:bg-muted"
//                   >
//                     Cancel
//                   </button>
//                   <button
//                     onClick={handleSend}
//                     className="px-4 py-1.5 rounded bg-primary text-background text-sm hover:bg-primary hover:opacity-90"
//                   >
//                     Send
//                   </button>
//                 </div>
//               </div>

//               {/* Attachment preview list */}
//               {files.length > 0 && (
//                 <div className="px-3 pb-3">
//                   <ul className="mt-2 space-y-1">
//                     {files.map((f) => (
//                       <li
//                         key={f.name}
//                         className="flex items-center justify-between text-sm border rounded px-2 py-1"
//                       >
//                         <span className="truncate">
//                           📎 {f.name} <span className="text-muted0">({bytesToKB(f.size)})</span>
//                         </span>
//                         <button
//                           onClick={() => removeFile(f.name)}
//                           className="text-red-600 hover:underline text-xs"
//                         >
//                           remove
//                         </button>
//                       </li>
//                     ))}
//                   </ul>
//                 </div>
//               )}
//             </section>
//           )}
//         </main>
//       </div>
//     </div>
//   );
// }

// // ---- Small UI helpers ----
// function Field({ label, children }) {
//   return (
//     <div className="flex items-center gap-2 border rounded px-2 py-1">
//       <span className="text-xs text-muted0 w-12">{label}</span>
//       {children}
//     </div>
//   );
// }

// function ModeSwitcher({ mode, setMode }) {
//   const Button = ({ val, children }) => (
//     <button
//       onClick={() => setMode(val)}
//       className={`px-2 py-1 rounded text-sm ${mode === val ? "bg-primary text-background" : "border hover:bg-gray-100"
//         }`}
//       aria-pressed={mode === val}
//     >
//       {children}
//     </button>
//   );
//   return (
//     <div className="flex items-center gap-1">
//       <Button val="html">HTML</Button>
//       <Button val="markdown">Markdown</Button>
//       <Button val="text">Text</Button>
//     </div>
//   );
// }

