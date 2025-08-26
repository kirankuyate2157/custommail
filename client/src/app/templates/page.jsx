
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import MarkdownIt from "markdown-it";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Toaster, toast } from "sonner";
import { FiPlus, FiSave, FiTrash2, FiLoader } from "react-icons/fi";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";

// dynamic editors (no SSR)
const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });
const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

// editor CSS imports (ensure installed)
import "react-quill/dist/quill.snow.css";
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";

const md = new MarkdownIt();

const MIN_NAME = 3;
const MIN_BODY = 10;

// client-side zod schema for validation before sending to API
const SaveSchema = z.object({
  name: z.string().min(MIN_NAME),
  subject: z.string().optional(),
  content: z.string().min(MIN_BODY),
  mode: z.enum(["html", "markdown", "text"]),
  attachments: z.array(z.object({ name: z.string(), size: z.number().optional(), type: z.string().optional() })).optional(),
});

const fmtTime = (iso) => new Date(iso).toLocaleString([], { hour: "2-digit", minute: "2-digit" });

export default function TemplatesPage() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  // editor fields
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [mode, setMode] = useState("html"); // html | markdown | text
  const [files, setFiles] = useState([]); // File[] for preview / metadata

  const dirtyRef = useRef(false);

  // load templates
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/templates", { cache: "no-store" });
        const json = await res.json();
        if (!json.ok) throw new Error(json.message || "Failed to load templates");
        setList(json.data);
        setSelectedId(json.data[0]?.id ?? null);
      } catch (e) {
        toast.error(e.message || "Failed to load templates");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const selected = useMemo(() => list.find((t) => t.id === selectedId) || null, [list, selectedId]);

  // hydrate editor when selected changes
  useEffect(() => {
    if (!selected) {
      setName("");
      setSubject("");
      setBody("");
      setMode("html");
      setFiles([]);
      dirtyRef.current = false;
      return;
    }
    setName(selected.name || "");
    setSubject(selected.subject || "");
    setBody(selected.body || "");
    setMode(selected.mode || "html");
    setFiles(selected.attachments ? [...selected.attachments] : []);
    dirtyRef.current = false;
  }, [selectedId]); // eslint-disable-line

  // client validation
  const errors = useMemo(() => {
    const errs = {};
    if ((name || "").trim().length < MIN_NAME) errs.name = `Name must be at least ${MIN_NAME} characters.`;
    if ((body || "").trim().length < MIN_BODY) errs.body = `Body must be at least ${MIN_BODY} characters.`;
    return errs;
  }, [name, body]);

  const isValid = Object.keys(errors).length === 0;

  // New template
  const onNew = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const payload = { name: "New Template", subject: "", content: "Write your template here...", mode: "html", attachments: [] };
      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.message || "Could not create template");
      setList((prev) => [json.data, ...prev]);
      setSelectedId(json.data.id);
      toast.success("Template created");
    } catch (e) {
      toast.error(e.message || "Create failed");
    } finally {
      setBusy(false);
    }
  };

  // Save / Update
  const onSave = async () => {
    if (!selected) return;
    const payload = { name: (name || "").trim(), subject: (subject || "").trim(), content: body || "", mode, attachments: files.map((f) => ({ name: f.name, size: f.size, type: f.type })) };
    const parsed = SaveSchema.safeParse(payload);
    if (!parsed.success) {
      toast.error(parsed.error.errors[0]?.message || "Validation failed");
      return;
    }
    if (busy) return;
    setBusy(true);

    const id = selected.id;
    const prev = list;
    // optimistic update
    setList((cur) => cur.map((t) => (t.id === id ? { ...t, name: payload.name, subject: payload.subject, body: payload.content, mode: payload.mode, attachments: payload.attachments, updatedAt: new Date().toISOString() } : t)));
    dirtyRef.current = false;

    try {
      const res = await fetch(`/api/templates?id=${encodeURIComponent(id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: payload.name, subject: payload.subject, content: payload.content, mode: payload.mode, attachments: payload.attachments }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.message || "Save failed");
      // reflect server version
      setList((cur) => cur.map((t) => (t.id === id ? json.data : t)));
      toast.success("Saved");
    } catch (e) {
      setList(prev);
      dirtyRef.current = true;
      toast.error(e.message || "Save failed (rolled back)");
    } finally {
      setBusy(false);
    }
  };

  // Delete
  const onDelete = async () => {
    if (!selected) return;
    if (busy) return;
    const id = selected.id;
    const prev = list;
    setList((cur) => cur.filter((t) => t.id !== id));
    setSelectedId((cur) => (cur === id ? null : cur));

    setBusy(true);
    try {
      const res = await fetch(`/api/templates?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.ok) throw new Error(json.message || "Delete failed");
      toast.success("Deleted");
    } catch (e) {
      setList(prev);
      setSelectedId(id);
      toast.error(e.message || "Delete failed (rolled back)");
    } finally {
      setBusy(false);
    }
  };

  // Files: pick multiple, only keep metadata for dummy API (real upload later)
  const onPickFiles = (e) => {
    const picked = Array.from(e.target.files || []);
    if (picked.length === 0) return;
    setFiles((prev) => [...prev, ...picked]);
    dirtyRef.current = true;
    e.target.value = "";
  };
  const removeFile = (idx) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
    dirtyRef.current = true;
  };

  // mark dirty
  const markDirty = () => {
    if (!dirtyRef.current) dirtyRef.current = true;
  };

  // keyboard shortcuts (Ctrl/Cmd+S save, N new)
  useEffect(() => {
    const onKey = (e) => {
      const ctrl = e.ctrlKey || e.metaKey;
      if (ctrl && e.key.toLowerCase() === "s") {
        e.preventDefault();
        onSave();
      }
      if (!ctrl && e.key.toLowerCase() === "n") {
        onNew();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, name, subject, body, mode, files, busy]); // eslint-disable-line

  return (
    <div className="h-dvh min-h-screen bg-background text-foreground flex">
      <Toaster richColors closeButton position="top-right" />

      {/* LEFT */}
      <aside className="w-full md:w-[30%] border-r bg-background">
        <div className="flex items-center justify-between px-3 py-3 border-b">
          <h2 className="text-base font-semibold">Templates</h2>
          <Button disabled={busy} onClick={onNew} size="sm" className="gap-2">
            <FiPlus /> New
          </Button>
        </div>

        <div className="overflow-y-auto h-[calc(100dvh-56px)]">
          {loading ? (
            <div className="p-6 text-sm text-muted-foreground flex items-center gap-2"><FiLoader className="animate-spin" /> Loading…</div>
          ) : list.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground">No templates yet. Click “New”.</div>
          ) : (
            <ul>
              <AnimatePresence initial={false}>
                {list.map((t) => (
                  <motion.li key={t.id} layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    <button className={`w-full text-left px-3 py-3 border-b hover:bg-muted/60 focus:bg-muted/60 outline-none ${selectedId === t.id ? "bg-muted" : ""}`} onClick={() => setSelectedId(t.id)}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="font-medium truncate">{t.name || "Untitled"}</div>
                          <div className="text-xs text-muted-foreground truncate">{t.subject || "No subject"}</div>
                        </div>
                        <div className="text-[11px] text-muted-foreground whitespace-nowrap">{fmtTime(t.updatedAt)}</div>
                      </div>
                    </button>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          )}
        </div>
      </aside>

      {/* RIGHT */}
      <main className="flex-1 px-4 md:px-6 overflow-y-auto">
        {!selected ? (
          <div className="text-sm text-muted-foreground">Select a template to edit.</div>
        ) : (
          <Card className="max-w-4xl  mx-auto">
            <CardContent className="px-4 md:px-6 space-y-4">
              {/* name & subject */}
              <div className="space-y-1">
                <Input value={name} onChange={(e) => { setName(e.target.value); markDirty(); }} placeholder="Template name" className={errors.name ? "border-destructive" : ""} />
                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
              </div>

              <Input value={subject} onChange={(e) => { setSubject(e.target.value); markDirty(); }} placeholder="Template subject (optional)" />

              {/* mode switch */}
              <div className="flex gap-2 text-sm">
                <Button size="sm" variant={mode === "html" ? "default" : "outline"} onClick={() => setMode("html")}>HTML</Button>
                <Button size="sm" variant={mode === "markdown" ? "default" : "outline"} onClick={() => setMode("markdown")}>Markdown</Button>
                <Button size="sm" variant={mode === "text" ? "default" : "outline"} onClick={() => setMode("text")}>Text</Button>
              </div>

              {/* Editor */}
              <div className="space-y-1">
                <div className="flex-1 h-full min-h-[300px] max-h-[460px] overflow-auto border rounded bg-white">
                  {/* HTML */}
                  {mode === "html" && (
                    <ReactQuill theme="snow" value={body} onChange={(val) => { setBody(val); markDirty(); }} style={{ height: "100%", border: "none", backgroundColor: "white", display: "flex", flexDirection: "column", minHeight: "100%" }} />
                  )}

                  {/* Markdown */}
                  {mode === "markdown" && (
                    <div data-color-mode="light" className="h-full min-h-full">
                      <MDEditor value={body} onChange={(val) => { setBody(val || ""); markDirty(); }} height="100%" />
                    </div>
                  )}

                  {/* Text */}
                  {mode === "text" && (
                    <Textarea value={body} onChange={(e) => { setBody(e.target.value); markDirty(); }} className="w-full h-full min-h-[400px] p-3 outline-none bg-white" placeholder="Write your template…" />
                  )}
                </div>

                {errors.body && <p className="text-xs text-destructive">{errors.body}</p>}

                <p className="text-[11px] text-muted-foreground">Tip: Use placeholders like <code>[name]</code>, <code>[company]</code>, <code>[role]</code>. They will be replaced when sending.</p>
              </div>

              {/* Attachments (client side metadata) */}
              <div className="flex items-center justify-between gap-3 px-0 py-2">
                <div className="flex items-center gap-2">
                  <label className="px-3 py-1.5 rounded border hover:bg-muted text-sm cursor-pointer">
                    Attach files
                    <input type="file" multiple onChange={onPickFiles} className="hidden" />
                  </label>
                  {files.length > 0 && (
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      {files.map((f, i) => (
                        <div key={i} className="px-2 py-1 bg-muted rounded flex items-center gap-2">
                          <span className="truncate max-w-[200px]">{f.name}</span>
                          <button onClick={() => removeFile(i)} className="text-destructive text-xs">✕</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* actions */}
                <div className="flex gap-2">
                  <div className="text-xs text-muted-foreground">{dirtyRef.current ? "Unsaved changes" : "All changes saved"}</div>
                  <Button variant="destructive" onClick={onDelete} disabled={busy} className="gap-2"><FiTrash2 /> Delete</Button>
                  <Button onClick={onSave} disabled={busy || !isValid} className="gap-2">{busy ? <FiLoader className="animate-spin" /> : <FiSave />} Save</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}


