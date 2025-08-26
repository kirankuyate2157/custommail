// app/api/contacts/route.js
import { NextResponse } from "next/server";
import { z } from "zod";

/**
 * Dummy in-memory contacts DB — resets on server restart.
 * Contact shape:
 *  { id, email, pronoun, name, company, roles, notes, phone, status, createdAt, updatedAt }
 */
let CONTACTS = [
  {
    id: "c_1",
    email: "john.doe@techfusion.com",
    pronoun: "Sir",
    name: "John Doe",
    company: "TechFusion Pvt Ltd",
    roles: "HR Manager",
    notes: "Reached via LinkedIn, positive tone",
    phone: "+91-9876543210",
    status: "contacted",
    createdAt: new Date("2025-08-19T10:15:23.000Z").toISOString(),
    updatedAt: new Date("2025-08-19T12:32:18.000Z").toISOString(),
  },
];

// Zod schemas
const ContactSchema = z.object({
  email: z.string().email(),
  pronoun: z.string().optional(),
  name: z.string().min(1),
  company: z.string().optional(),
  roles: z.string().optional(),
  notes: z.string().optional(),
  phone: z.string().optional(),
  status: z.string().optional(),
});

const BulkUploadSchema = z.object({
  rows: z.array(ContactSchema),
});

// Helpers
const uid = (pref = "c") => `${pref}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

function ok(data) {
  return NextResponse.json({ ok: true, data });
}
function bad(msg, status = 400) {
  return NextResponse.json({ ok: false, message: msg }, { status });
}

/**
 * GET /api/contacts?q=&page=&pageSize=
 * POST /api/contacts  -> create single
 * POST /api/contacts/bulk -> bulk insert rows: { rows: [...] }
 * PUT /api/contacts?id=... -> update
 * DELETE /api/contacts?id=... -> delete
 */
export async function GET(req) {
  try {
    const url = new URL(req.url);
    const q = url.searchParams.get("q")?.toLowerCase() || "";
    const page = parseInt(url.searchParams.get("page") || "1", 10) || 1;
    const pageSize = parseInt(url.searchParams.get("pageSize") || "20", 10) || 20;

    let items = [...CONTACTS];

    if (q) {
      items = items.filter((c) => {
        const hay = `${c.email} ${c.name} ${c.company} ${c.roles} ${c.notes}`.toLowerCase();
        return hay.includes(q);
      });
    }

    items.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    const total = items.length;
    const start = (page - 1) * pageSize;
    const paged = items.slice(start, start + pageSize);

    return ok({ items: paged, total, page, pageSize });
  } catch (err) {
    console.error(err);
    return bad("Failed to list contacts", 500);
  }
}

export async function POST(req) {
  try {
    const url = new URL(req.url);
    if (url.pathname.endsWith("/bulk")) {
      const body = await req.json().catch(() => ({}));
      const parsed = BulkUploadSchema.safeParse(body);
      if (!parsed.success) return bad("Invalid bulk payload: " + parsed.error.message);

      const results = { inserted: [], skipped: [] };
      for (const r of parsed.data.rows) {
        // skip duplicate email
        if (CONTACTS.some((c) => c.email.toLowerCase() === r.email.toLowerCase())) {
          results.skipped.push({ reason: "duplicate", email: r.email });
          continue;
        }
        const now = new Date().toISOString();
        const obj = {
          id: uid("c"),
          email: r.email,
          pronoun: r.pronoun || "",
          name: r.name,
          company: r.company || "",
          roles: r.roles || "",
          notes: r.notes || "",
          phone: r.phone || "",
          status: r.status || "new",
          createdAt: now,
          updatedAt: now,
        };
        CONTACTS.unshift(obj);
        results.inserted.push(obj);
      }
      return ok(results);
    }

    // single create
    const body = await req.json().catch(() => ({}));
    const parsed = ContactSchema.safeParse(body);
    if (!parsed.success) return bad("Invalid contact data: " + parsed.error.message);

    // check duplicate
    if (CONTACTS.some((c) => c.email.toLowerCase() === parsed.data.email.toLowerCase())) {
      return bad("Email already exists", 409);
    }
    const now = new Date().toISOString();
    const newContact = {
      id: uid("c"),
      ...parsed.data,
      status: parsed.data.status || "new",
      createdAt: now,
      updatedAt: now,
    };
    CONTACTS.unshift(newContact);
    return ok(newContact);
  } catch (err) {
    console.error(err);
    return bad("Failed to create contact", 500);
  }
}

export async function PUT(req) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) return bad("Missing id", 422);
    const body = await req.json().catch(() => ({}));
    const parsed = ContactSchema.partial().safeParse(body);
    if (!parsed.success) return bad("Invalid update: " + parsed.error.message);

    const idx = CONTACTS.findIndex((c) => c.id === id);
    if (idx === -1) return bad("Not found", 404);

    CONTACTS[idx] = {
      ...CONTACTS[idx],
      ...parsed.data,
      updatedAt: new Date().toISOString(),
    };
    return ok(CONTACTS[idx]);
  } catch (err) {
    console.error(err);
    return bad("Failed to update contact", 500);
  }
}

export async function DELETE(req) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) return bad("Missing id", 422);
    const exists = CONTACTS.some((c) => c.id === id);
    if (!exists) return bad("Not found", 404);
    CONTACTS = CONTACTS.filter((c) => c.id !== id);
    return ok({ id });
  } catch (err) {
    console.error(err);
    return bad("Failed to delete", 500);
  }
}
