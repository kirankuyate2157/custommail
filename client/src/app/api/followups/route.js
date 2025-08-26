// app/api/followups/route.js
import { NextResponse } from "next/server";
import { z } from "zod";

/**
 * Dummy in-memory follow-ups DB.
 * - resets on server restart — good for local/dev.
 * - followUp item structure:
 *   { id, email, pronoun, name, company, totalSent, success, failed, lastUpdate, history: [{id, templateId, title, time, status, note}], createdAt, updatedAt }
 */
let FOLLOWUPS = [
  {
    id: "f_1",
    email: "kritika@gmail.com",
    pronoun: "Mam",
    name: "Kritika Sharma",
    company: "Acme Inc",
    totalSent: 2,
    success: 2,
    failed: 0,
    lastUpdate: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    history: [
      {
        id: "h_1",
        templateId: "t_03",
        title: "Application for HR recruitment",
        time: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        status: "done",
      },
      {
        id: "h_2",
        templateId: "t_03",
        title: "Application for HR recruitment - follow up",
        time: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
        status: "done",
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "f_2",
    email: "pramod@example.com",
    pronoun: "Sir",
    name: "Pramod Kumar",
    company: "Other Corp",
    totalSent: 1,
    success: 0,
    failed: 1,
    lastUpdate: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    history: [
      {
        id: "h_3",
        templateId: "t_05",
        title: "Follow-up regarding interview",
        time: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
        status: "failed",
        note: "SMTP 550",
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Validation schemas
const ResendSchema = z.object({
  followUpId: z.string().min(1),
  templateId: z.string().min(1),
});

const ListQuery = z.object({
  q: z.string().optional(),
  page: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) || 1 : 1)),
  pageSize: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) || 10 : 10)),
  filter: z.enum(["all", "failed", "withAttachments"]).optional().default("all"),
});

function ok(data) {
  return NextResponse.json({ ok: true, data });
}
function bad(msg, status = 400) {
  return NextResponse.json({ ok: false, message: msg }, { status });
}

/**
 * GET /api/followups?q=...&page=1&pageSize=10&filter=all
 * returns paginated list
 */
export async function GET(req) {
  try {
    const url = new URL(req.url);
    const parsed = ListQuery.parse({
      q: url.searchParams.get("q") || undefined,
      page: url.searchParams.get("page") || undefined,
      pageSize: url.searchParams.get("pageSize") || undefined,
      filter: url.searchParams.get("filter") || undefined,
    });

    let items = [...FOLLOWUPS];

    // simple filtering by query (email, name, company)
    if (parsed.q) {
      const q = parsed.q.toLowerCase();
      items = items.filter(
        (it) =>
          (it.email || "").toLowerCase().includes(q) ||
          (it.name || "").toLowerCase().includes(q) ||
          (it.company || "").toLowerCase().includes(q)
      );
    }

    // filter example: failed only
    if (parsed.filter === "failed") {
      items = items.filter((it) => it.failed > 0);
    }
    if (parsed.filter === "withAttachments") {
      // In this dummy impl we don't store attachments for follow-ups; placeholder for future
      items = items.filter((it) => false);
    }

    // sort by lastUpdate desc
    items.sort((a, b) => new Date(b.lastUpdate) - new Date(a.lastUpdate));

    // pagination
    const total = items.length;
    const start = (parsed.page - 1) * parsed.pageSize;
    const paged = items.slice(start, start + parsed.pageSize);

    return ok({ items: paged, total, page: parsed.page, pageSize: parsed.pageSize });
  } catch (err) {
    return bad("Invalid query");
  }
}

/**
 * POST /api/followups/resend
 * Body: { followUpId, templateId }
 * Simulates sending an email to a recipient (random success/failure), updates history and counts.
 */
export async function POST(req) {
  try {
    const url = new URL(req.url);
    // support route /api/followups/resend by path inspection
    if (url.pathname.endsWith("/resend")) {
      const body = await req.json().catch(() => ({}));
      const parsed = ResendSchema.safeParse(body);
      if (!parsed.success) return bad("Invalid payload");

      // find followUp
      const f = FOLLOWUPS.find((x) => x.id === parsed.data.followUpId);
      if (!f) return bad("Follow-up not found", 404);

      // simulate send
      const isSuccess = Math.random() > 0.25; // 75% success
      const now = new Date().toISOString();
      const histItem = {
        id: `h_${Date.now()}`,
        templateId: parsed.data.templateId,
        title: `Template ${parsed.data.templateId}`,
        time: now,
        status: isSuccess ? "done" : "failed",
        note: isSuccess ? undefined : "Simulated SMTP error",
      };

      f.history = [histItem, ...(f.history || [])];
      f.totalSent = (f.totalSent || 0) + 1;
      if (isSuccess) f.success = (f.success || 0) + 1;
      else f.failed = (f.failed || 0) + 1;
      f.lastUpdate = now;
      f.updatedAt = now;

      return ok({ followUp: f, simulated: { isSuccess } });
    }

    // default: not allowed here, but accept create follow-up with minimal validation
    const body = await req.json().catch(() => ({}));
    if (!body || !body.email) return bad("Missing email field");
    const now = new Date().toISOString();
    const newF = {
      id: `f_${Date.now()}`,
      email: body.email,
      pronoun: body.pronoun || "",
      name: body.name || "",
      company: body.company || "",
      totalSent: 0,
      success: 0,
      failed: 0,
      lastUpdate: now,
      history: [],
      createdAt: now,
      updatedAt: now,
    };
    FOLLOWUPS.unshift(newF);
    return ok(newF, 201);
  } catch (err) {
    console.error(err);
    return bad("Server error", 500);
  }
}

/**
 * PUT /api/followups?id=...  (update follow-up metadata: name/company/pronoun)
 */
export async function PUT(req) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) return bad("Missing id", 422);
    const body = await req.json().catch(() => ({}));
    const idx = FOLLOWUPS.findIndex((f) => f.id === id);
    if (idx === -1) return bad("Not found", 404);

    const f = FOLLOWUPS[idx];
    f.name = typeof body.name === "string" ? body.name : f.name;
    f.company = typeof body.company === "string" ? body.company : f.company;
    f.pronoun = typeof body.pronoun === "string" ? body.pronoun : f.pronoun;
    f.updatedAt = new Date().toISOString();
    if (body.lastUpdate) f.lastUpdate = body.lastUpdate;
    FOLLOWUPS[idx] = f;
    return ok(f);
  } catch (err) {
    console.error(err);
    return bad("Server error", 500);
  }
}

/**
 * DELETE /api/followups?id=...
 */
export async function DELETE(req) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) return bad("Missing id", 422);
    const exists = FOLLOWUPS.some((x) => x.id === id);
    if (!exists) return bad("Not found", 404);
    FOLLOWUPS = FOLLOWUPS.filter((x) => x.id !== id);
    return ok({ id });
  } catch (err) {
    console.error(err);
    return bad("Server error", 500);
  }
}
