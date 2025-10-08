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
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "c_2",
    email: "kritika.sharma@acmeinc.com",
    pronoun: "Mam",
    name: "Kritika Sharma",
    company: "Acme Inc",
    roles: "Recruiter",
    notes: "Interested in hiring full-stack developers",
    phone: "+91-9123456780",
    status: "contacted",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "c_3",
    email: "pramod.kumar@othercorp.com",
    pronoun: "Sir",
    name: "Pramod Kumar",
    company: "Other Corp",
    roles: "Tech Lead",
    notes: "Requested follow-up on interview",
    phone: "+91-9988776655",
    status: "pending",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "c_4",
    email: "anita.singh@techsolutions.com",
    pronoun: "Mam",
    name: "Anita Singh",
    company: "Tech Solutions",
    roles: "Project Manager",
    notes: "Potential client for software demo",
    phone: "+91-9012345678",
    status: "contacted",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "c_5",
    email: "rajesh.patel@innovatech.com",
    pronoun: "Sir",
    name: "Rajesh Patel",
    company: "Innovatech",
    roles: "CEO",
    notes: "Interested in collaboration",
    phone: "+91-9876123450",
    status: "contacted",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "c_6",
    email: "sara.johnson@bizco.com",
    pronoun: "Mam",
    name: "Sara Johnson",
    company: "BizCo",
    roles: "Finance Manager",
    notes: "Requested invoice details",
    phone: "+91-9123987650",
    status: "pending",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "c_7",
    email: "mohit.k@alphacorp.com",
    pronoun: "Sir",
    name: "Mohit Kumar",
    company: "AlphaCorp",
    roles: "Business Development",
    notes: "Interested in partnership",
    phone: "+91-9988123456",
    status: "contacted",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "c_8",
    email: "neha.sharma@enterprise.com",
    pronoun: "Mam",
    name: "Neha Sharma",
    company: "Enterprise Solutions",
    roles: "Operations Head",
    notes: "Schedule meeting for discussion",
    phone: "+91-9012987654",
    status: "pending",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "c_9",
    email: "vivek.reddy@techmart.com",
    pronoun: "Sir",
    name: "Vivek Reddy",
    company: "TechMart",
    roles: "Sales Manager",
    notes: "Follow-up on quotation",
    phone: "+91-9876567890",
    status: "contacted",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "c_10",
    email: "meera.kapoor@solutions.com",
    pronoun: "Mam",
    name: "Meera Kapoor",
    company: "Solutions Ltd",
    roles: "Technical Lead",
    notes: "Support required for product installation",
    phone: "+91-9123456789",
    status: "pending",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "c_11",
    email: "arjun.mehta@corptech.com",
    pronoun: "Sir",
    name: "Arjun Mehta",
    company: "CorpTech",
    roles: "Finance Head",
    notes: "Invoice pending follow-up",
    phone: "+91-9988771234",
    status: "contacted",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "c_12",
    email: "tanya.singh@bizcorp.com",
    pronoun: "Mam",
    name: "Tanya Singh",
    company: "BizCorp",
    roles: "Manager",
    notes: "Proposal follow-up",
    phone: "+91-9012345671",
    status: "contacted",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "c_13",
    email: "deepak.r@ventures.com",
    pronoun: "Sir",
    name: "Deepak R",
    company: "Ventures Pvt Ltd",
    roles: "Co-Founder",
    notes: "Interested in business inquiry",
    phone: "+91-9876123490",
    status: "pending",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "c_14",
    email: "shruti.k@innovators.com",
    pronoun: "Mam",
    name: "Shruti Kumar",
    company: "Innovators Inc",
    roles: "Product Manager",
    notes: "Demo request for software",
    phone: "+91-9123987412",
    status: "contacted",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "c_15",
    email: "vikram.singh@alpha.com",
    pronoun: "Sir",
    name: "Vikram Singh",
    company: "Alpha Solutions",
    roles: "CTO",
    notes: "Technical collaboration discussion",
    phone: "+91-9988774321",
    status: "pending",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "c_16",
    email: "priyanka.m@beta.com",
    pronoun: "Mam",
    name: "Priyanka Mehta",
    company: "Beta Tech",
    roles: "HR Executive",
    notes: "Recruitment discussion",
    phone: "+91-9012347890",
    status: "contacted",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "c_17",
    email: "rahul.k@omega.com",
    pronoun: "Sir",
    name: "Rahul Kapoor",
    company: "Omega Corp",
    roles: "Marketing Head",
    notes: "Follow-up for marketing campaign",
    phone: "+91-9876549870",
    status: "pending",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "c_18",
    email: "ananya.s@delta.com",
    pronoun: "Mam",
    name: "Ananya Singh",
    company: "Delta Ltd",
    roles: "Operations Manager",
    notes: "Discuss operational improvements",
    phone: "+91-9123454321",
    status: "contacted",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "c_19",
    email: "manish.p@theta.com",
    pronoun: "Sir",
    name: "Manish Patel",
    company: "Theta Solutions",
    roles: "CEO",
    notes: "Business partnership inquiry",
    phone: "+91-9988112233",
    status: "pending",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "c_20",
    email: "nisha.k@sigma.com",
    pronoun: "Mam",
    name: "Nisha Kapoor",
    company: "Sigma Pvt Ltd",
    roles: "Product Designer",
    notes: "Requested product design collaboration",
    phone: "+91-9011223344",
    status: "contacted",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
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
