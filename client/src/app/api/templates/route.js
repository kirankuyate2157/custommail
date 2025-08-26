// app/api/templates/route.js
import { NextResponse } from "next/server";
import { z } from "zod";

/**
 * In-memory DB for dev. Resets on server restart.
 * Fields:
 *  - id, name, subject, body (string: HTML/MD/Text depending on mode saved), mode, attachments, createdAt, updatedAt
 */
let TEMPLATES = [
  {
    id: "t1",
    name: "Full Stack Role",
    subject: "Application for Full Stack Engineer",
    body: "<p>Dear [Hiring_Manager],<br/>I am applying for the [role] position at [company]...</p>",
    mode: "html", // html | markdown | text
    attachments: [
      // attachments saved only as metadata in dummy API
      { id: "a1", name: "resume.pdf", size: 128000, type: "application/pdf" },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "t2",
    name: "Data Analyst Role",
    subject: "Application for Data Analyst",
    body: "Hello [Hiring_Manager],\n\nI am writing to apply for the [role] position ...\n",
    mode: "text",
    attachments: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// small helpers
const bad = (message, status = 400) =>
  NextResponse.json({ ok: false, message }, { status });
const ok = (data, status = 200) =>
  NextResponse.json({ ok: true, data }, { status });

const createSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  subject: z.string().optional(),
  content: z.string().min(10, "Template body must be at least 10 characters"),
  mode: z.enum(["html", "markdown", "text"]).optional().default("html"),
  attachments: z.array(
    z.object({ name: z.string(), size: z.number().optional(), type: z.string().optional() })
  ).optional(),
});

const updateSchema = z.object({
  name: z.string().min(3).optional(),
  subject: z.string().optional(),
  content: z.string().min(10).optional(),
  mode: z.enum(["html", "markdown", "text"]).optional(),
  attachments: z.array(
    z.object({ name: z.string(), size: z.number().optional(), type: z.string().optional() })
  ).optional(),
});

export async function GET() {
  // return sorted by updatedAt desc
  const list = [...TEMPLATES].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  return ok(list);
}

export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return bad("Invalid JSON");
  }

  const parse = createSchema.safeParse(body);
  if (!parse.success) return bad(parse.error.errors.map((e) => e.message).join(", "));

  const now = new Date().toISOString();
  const item = {
    id: `t_${Date.now()}`,
    name: parse.data.name,
    subject: parse.data.subject || "",
    body: parse.data.content,
    mode: parse.data.mode,
    attachments: parse.data.attachments || [],
    createdAt: now,
    updatedAt: now,
  };
  TEMPLATES.unshift(item);
  return ok(item, 201);
}

export async function PUT(req) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return bad("Missing template id", 422);

  let body;
  try {
    body = await req.json();
  } catch {
    return bad("Invalid JSON");
  }

  const parse = updateSchema.safeParse(body);
  if (!parse.success) return bad(parse.error.errors.map((e) => e.message).join(", "));

  const idx = TEMPLATES.findIndex((t) => t.id === id);
  if (idx === -1) return bad("Template not found", 404);

  const old = TEMPLATES[idx];
  const updated = {
    ...old,
    name: typeof parse.data.name === "string" ? parse.data.name : old.name,
    subject: typeof parse.data.subject === "string" ? parse.data.subject : old.subject,
    body: typeof parse.data.content === "string" ? parse.data.content : old.body,
    mode: parse.data.mode || old.mode,
    attachments: Array.isArray(parse.data.attachments) ? parse.data.attachments : old.attachments,
    updatedAt: new Date().toISOString(),
  };

  TEMPLATES[idx] = updated;
  return ok(updated);
}

export async function DELETE(req) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return bad("Missing template id", 422);
  const exists = TEMPLATES.some((t) => t.id === id);
  if (!exists) return bad("Template not found", 404);
  TEMPLATES = TEMPLATES.filter((t) => t.id !== id);
  return ok({ id });
}

