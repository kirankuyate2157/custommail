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
      subject: "Application for xyz role",
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
      fromEmail: "prmodk@gmail.com",
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
  ];

  return Response.json({ ok: true, mails });
}
