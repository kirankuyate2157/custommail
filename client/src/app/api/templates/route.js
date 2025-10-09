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
    mode: "html",
    attachments: [
      { id: "a1", name: "resume.pdf", size: 128000, type: "application/pdf" },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "t2",
    name: "Data Analyst Role",
    subject: "Application for Data Analyst",
    body: "Hello [Hiring_Manager],\n\nI am writing to apply for the [role] position at [company]...",
    mode: "text",
    attachments: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "t3",
    name: "Follow-Up Interview",
    subject: "Follow-Up Regarding Interview",
    body: "<p>Dear [Hiring_Manager],<br/>I wanted to follow up regarding my interview for the [role] position at [company]...</p>",
    mode: "html",
    attachments: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "t4",
    name: "Meeting Request",
    subject: "Request to Schedule Meeting",
    body: "Hi [Recipient],\n\nI would like to schedule a meeting to discuss [topic]. Please let me know your availability.",
    mode: "text",
    attachments: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "t5",
    name: "Business Proposal",
    subject: "Proposal for Business Collaboration",
    body: "<p>Hello [Recipient],<br/>We would like to propose a business collaboration between [company] and [recipientCompany]. Please find the proposal attached.</p>",
    mode: "html",
    attachments: [
      { id: "a2", name: "proposal.pdf", size: 150000, type: "application/pdf" },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "t6",
    name: "Product Inquiry",
    subject: "Inquiry about Product Features",
    body: "Dear [Support_Team],\n\nI am interested in [product] and would like to know more about its features and pricing.",
    mode: "text",
    attachments: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "t7",
    name: "Thank You Note",
    subject: "Thank You for Your Time",
    body: "<p>Hi [Recipient],<br/>Thank you for taking the time to speak with me about [topic]. I really appreciate it.</p>",
    mode: "html",
    attachments: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "t8",
    name: "Job Offer Response",
    subject: "Response to Job Offer",
    body: "Dear [Hiring_Manager],\n\nThank you for offering me the [role] position. I am delighted to accept and look forward to joining [company].",
    mode: "text",
    attachments: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "t9",
    name: "Invoice Reminder",
    subject: "Reminder: Pending Invoice",
    body: "<p>Dear [Client],<br/>This is a friendly reminder regarding invoice #[invoiceNumber] which is pending. Kindly process the payment at your earliest convenience.</p>",
    mode: "html",
    attachments: [
      { id: "a3", name: "invoice.pdf", size: 110000, type: "application/pdf" },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "t10",
    name: "Technical Support Request",
    subject: "Assistance Required for Technical Issue",
    body: "Hi [Support_Team],\n\nI am facing an issue with [product/service]. Please assist me in resolving it.",
    mode: "text",
    attachments: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "t11",
    name: "Networking Request",
    subject: "Let's Connect & Explore Opportunities",
    body: `
    <p>Hi [Recipient],</p>

    <p>I hope this message finds you well.</p>

    <p>My name is [Your Name], and I came across your profile/company while exploring [specific industry/field]. I am very interested in connecting with you to learn more about your work and explore potential opportunities for collaboration, guidance, or knowledge sharing.</p>

    <p>I believe that connecting with professionals like you could be mutually beneficial, whether it’s discussing innovative ideas, sharing industry insights, or exploring future projects together.</p>

    <p>If you have some time in the coming days, I would love to schedule a brief call or meeting at your convenience. I am flexible with timings and can adjust as per your availability.</p>

    <p>Looking forward to connecting with you.</p>

    <p>Best regards,<br/>
    [Your Name]<br/>
    [Your Role/Title]<br/>
    [Your Company/Organization]<br/>
    [Email / Phone]</p>
  `,
    mode: "html",
    attachments: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "t12",
    name: "Event Invitation",
    subject: "Invitation to [Event_Name]",
    body: "Dear [Recipient],\n\nYou are cordially invited to attend [Event_Name] hosted by [company]. Please RSVP by [date].",
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
  attachments: z
    .array(
      z.object({
        name: z.string(),
        size: z.number().optional(),
        type: z.string().optional(),
      })
    )
    .optional(),
});

const updateSchema = z.object({
  name: z.string().min(3).optional(),
  subject: z.string().optional(),
  content: z.string().min(10).optional(),
  mode: z.enum(["html", "markdown", "text"]).optional(),
  attachments: z
    .array(
      z.object({
        name: z.string(),
        size: z.number().optional(),
        type: z.string().optional(),
      })
    )
    .optional(),
});

export async function GET() {
  // return sorted by updatedAt desc
  const list = [...TEMPLATES].sort(
    (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
  );
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
  if (!parse.success)
    return bad(parse.error.errors.map((e) => e.message).join(", "));

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
  if (!parse.success)
    return bad(parse.error.errors.map((e) => e.message).join(", "));

  const idx = TEMPLATES.findIndex((t) => t.id === id);
  if (idx === -1) return bad("Template not found", 404);

  const old = TEMPLATES[idx];
  const updated = {
    ...old,
    name: typeof parse.data.name === "string" ? parse.data.name : old.name,
    subject:
      typeof parse.data.subject === "string" ? parse.data.subject : old.subject,
    body:
      typeof parse.data.content === "string" ? parse.data.content : old.body,
    mode: parse.data.mode || old.mode,
    attachments: Array.isArray(parse.data.attachments)
      ? parse.data.attachments
      : old.attachments,
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
