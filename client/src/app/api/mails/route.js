// app/api/mails/route.js
export async function GET() {
  // Simulate latency
  await new Promise((r) => setTimeout(r, 300));

  const mails = [
    {
      id: "1",
      fromName: "Kritika Sharma",
      fromEmail: "kritika@gmail.com",
      to: "hr@company.com",
      subject: "Application for XYZ role",
      time: "12:23 pm",
      bodyHtml:
        "<p>Dear Kritika ma'am,<br/>My name is Kiran Kuyate. I'm applying for the XYZ role. Please find my resume attached.</p>",
      bodyText:
        "Dear Kritika ma'am,\nMy name is Kiran Kuyate. I'm applying for the XYZ role. Please find my resume attached.",
      hasAttachments: true,
      attachments: [
        { id: "a1", name: "resume.pdf", size: 128000, url: "#" },
        { id: "a2", name: "cover_letter.docx", size: 56000, url: "#" },
      ],
    },
    {
      id: "2",
      fromName: "Pramod Kumar",
      fromEmail: "pramodk@gmail.com",
      to: "hr@company.com",
      subject: "Follow-up regarding interview",
      time: "03:45 pm",
      bodyHtml:
        "<p>Respected Sir,</p><p>This is a gentle follow-up regarding my interview for the XYZ role. Kindly update me with the status.</p>",
      bodyText:
        "Respected Sir,\n\nThis is a gentle follow-up regarding my interview for the XYZ role. Kindly update me with the status.",
      hasAttachments: false,
      attachments: [],
    },
    {
      id: "3",
      fromName: "Anita Singh",
      fromEmail: "anita.singh@techsolutions.com",
      to: "info@techsolutions.com",
      subject: "Product inquiry",
      time: "09:15 am",
      bodyHtml:
        "<p>Hello Team,<br/>I am interested in your software product. Could you please provide pricing and features?</p>",
      bodyText:
        "Hello Team,\nI am interested in your software product. Could you please provide pricing and features?",
      hasAttachments: false,
      attachments: [],
    },
    {
      id: "4",
      fromName: "Rajesh Patel",
      fromEmail: "rajesh@innovatech.com",
      to: "sales@innovatech.com",
      subject: "Request for demo",
      time: "11:30 am",
      bodyHtml:
        "<p>Hi Team,<br/>I'd like to schedule a demo for your platform. Please suggest suitable timings.</p>",
      bodyText:
        "Hi Team,\nI'd like to schedule a demo for your platform. Please suggest suitable timings.",
      hasAttachments: false,
      attachments: [],
    },
    {
      id: "5",
      fromName: "Sara Johnson",
      fromEmail: "sara.johnson@bizco.com",
      to: "support@bizco.com",
      subject: "Contract renewal request",
      time: "02:10 pm",
      bodyHtml:
        "<p>Dear Support,<br/>Our current contract is ending soon. Kindly guide on renewal procedures.</p>",
      bodyText:
        "Dear Support,\nOur current contract is ending soon. Kindly guide on renewal procedures.",
      hasAttachments: true,
      attachments: [{ id: "a3", name: "contract.pdf", size: 95000, url: "#" }],
    },
    {
      id: "6",
      fromName: "Mohit Kumar",
      fromEmail: "mohit.k@alphacorp.com",
      to: "partnership@alphacorp.com",
      subject: "Business collaboration proposal",
      time: "04:50 pm",
      bodyHtml:
        "<p>Hello Team,<br/>We would like to propose a collaboration between our companies. Please find the proposal attached.</p>",
      bodyText:
        "Hello Team,\nWe would like to propose a collaboration between our companies. Please find the proposal attached.",
      hasAttachments: true,
      attachments: [{ id: "a4", name: "proposal.pdf", size: 150000, url: "#" }],
    },
    {
      id: "7",
      fromName: "Neha Sharma",
      fromEmail: "neha.s@enterprise.com",
      to: "contact@enterprise.com",
      subject: "Meeting request",
      time: "10:25 am",
      bodyHtml:
        "<p>Hi,<br/>I would like to arrange a meeting to discuss potential services your company offers.</p>",
      bodyText:
        "Hi,\nI would like to arrange a meeting to discuss potential services your company offers.",
      hasAttachments: false,
      attachments: [],
    },
    {
      id: "8",
      fromName: "Vivek Reddy",
      fromEmail: "vivek.r@techmart.com",
      to: "sales@techmart.com",
      subject: "Follow-up on quotation",
      time: "01:40 pm",
      bodyHtml:
        "<p>Dear Sales Team,<br/>I wanted to follow up on the quotation sent last week. Awaiting your response.</p>",
      bodyText:
        "Dear Sales Team,\nI wanted to follow up on the quotation sent last week. Awaiting your response.",
      hasAttachments: false,
      attachments: [],
    },
    {
      id: "9",
      fromName: "Meera Kapoor",
      fromEmail: "meera.k@solutions.com",
      to: "support@solutions.com",
      subject: "Technical support request",
      time: "05:05 pm",
      bodyHtml:
        "<p>Hi Support,<br/>Facing issues with the product installation. Please assist.</p>",
      bodyText:
        "Hi Support,\nFacing issues with the product installation. Please assist.",
      hasAttachments: true,
      attachments: [{ id: "a5", name: "screenshot.png", size: 78000, url: "#" }],
    },
    {
      id: "10",
      fromName: "Arjun Mehta",
      fromEmail: "arjun.m@corptech.com",
      to: "finance@corptech.com",
      subject: "Invoice reminder",
      time: "11:55 am",
      bodyHtml:
        "<p>Dear Finance Team,<br/>This is a gentle reminder regarding the pending invoice. Please confirm payment.</p>",
      bodyText:
        "Dear Finance Team,\nThis is a gentle reminder regarding the pending invoice. Please confirm payment.",
      hasAttachments: true,
      attachments: [{ id: "a6", name: "invoice.pdf", size: 110000, url: "#" }],
    },
    {
      id: "11",
      fromName: "Tanya Singh",
      fromEmail: "tanya.s@bizcorp.com",
      to: "manager@bizcorp.com",
      subject: "Proposal follow-up",
      time: "03:20 pm",
      bodyHtml:
        "<p>Hi Manager,<br/>Following up on the proposal sent earlier. Kindly review and provide feedback.</p>",
      bodyText:
        "Hi Manager,\nFollowing up on the proposal sent earlier. Kindly review and provide feedback.",
      hasAttachments: false,
      attachments: [],
    },
    {
      id: "12",
      fromName: "Deepak R",
      fromEmail: "deepak.r@ventures.com",
      to: "contact@ventures.com",
      subject: "Business inquiry",
      time: "09:50 am",
      bodyHtml:
        "<p>Hello Team,<br/>I am interested in exploring potential business opportunities. Let's schedule a call.</p>",
      bodyText:
        "Hello Team,\nI am interested in exploring potential business opportunities. Let's schedule a call.",
      hasAttachments: false,
      attachments: [],
    },
  ];


  return Response.json({ ok: true, mails });
}
