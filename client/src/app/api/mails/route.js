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
      to: "partnership@kwaysmail.com",
      subject: "Exploring Collaboration Opportunities – K-Kways Mail (In Development)",
      time: "04:50 pm",
      bodyHtml: `
    <p>Dear K-Kways Team,</p>

    <p>I hope you're doing well.</p>

    <p>We recently came across early previews of <strong>K-Kways Mail</strong>, and we’re genuinely impressed with the direction it’s taking — especially considering it’s still in active development. The idea of building a <strong>modern, secure, and India-focused mail management platform</strong> is extremely promising.</p>

    <p>From what we understand, K-Kways Mail aims to go beyond traditional mail clients by introducing features such as:</p>

    <ul>
      <li><strong>Smart Templates</strong> for quick professional communication</li>
      <li><strong>Bulk Contacts</strong> and <strong>Mail Scheduler</strong> for organized outreach</li>
      <li><strong>Follow-up Tracking</strong> and <strong>Smart Filtering</strong> to avoid missed replies</li>
      <li>Support for multiple accounts (Gmail, Outlook, and others)</li>
      <li>Personal, Team, and Pro usage modes for different needs</li>
      <li>Secure server-side data storage with privacy in mind</li>
      <li>Desktop version in progress for extended accessibility</li>
    </ul>

    <p>We believe once this platform matures, it can bring great value to <strong>students, job seekers, marketing professionals, startups, and business teams</strong> who need a cleaner, smarter, and more personalized mail experience.</p>

    <p>We’d love to explore early collaboration or potential integration discussions once your next development phase is live. Please find a brief overview of our proposal attached for your reference.</p>

    <p>Best regards,<br/>
    <strong>Mohit Kumar</strong><br/>
    Partnerships & Alliances<br/>
    AlphaCorp Innovations Pvt. Ltd.<br/>
    <a href="mailto:mohit.k@alphacorp.com">mohit.k@alphacorp.com</a></p>
  `,
      bodyText:
        "Dear K-Kways Team,\n\nWe recently came across early previews of K-Kways Mail and are impressed by its vision — building a modern, India-focused email platform.\n\nFeatures like smart templates, bulk contact management, scheduler, follow-ups, multi-account support, and secure server-side storage show strong potential.\n\nWe’d love to discuss early collaboration once the next dev phase is ready.\n\nBest regards,\nMohit Kumar\nAlphaCorp Innovations Pvt. Ltd.",
      hasAttachments: true,
      attachments: [
        { id: "a4", name: "AlphaCorp_KKways_Partnership_Overview.pdf", size: 155000, url: "#" }
      ],
    },
    {
      id: "62",
      fromName: "Mohit Kumar",
      fromEmail: "mohit.k@alphacorp.com",
      to: "hello@kwaysmail.in",
      subject: "Exploring Collaboration with Kways Mail Platform 🇮🇳",
      time: "04:50 pm",
      bodyHtml: `
    <p>Hello Kways Team,<br/><br/>
    I recently came across your new <strong>Indian-developed mail application</strong> project and was genuinely impressed by its vision and upcoming features.<br/><br/>
    The concept of a <strong>modern, secure, and intelligent email client</strong> — built in India and for Indian users — feels both timely and essential.<br/><br/>
    As mentioned, your ongoing development focuses on:<br/>
    <ul>
      <li>Smart filtering for priority and follow-up mails</li>
      <li>Templated replies & quick drafts</li>
      <li>Bulk contact management and scheduling</li>
      <li>Integrated own mailbox + support for third-party accounts (Outlook, Gmail, etc.)</li>
      <li>AI-powered reminders, follow-ups, and auto-sorting</li>
      <li>Secure data storage with server-side encryption</li>
      <li>Personal, Team, and Pro plans in development</li>
      <li>Upcoming Desktop App for seamless workflow</li>
    </ul>
    It’s exciting to see how this platform will empower <strong>students, marketing professionals, business owners, and teams</strong> with one unified communication tool.<br/><br/>
    I also appreciate your initiative of building an <strong>Indian mail ecosystem</strong> — tailored for our nation’s needs, ensuring data privacy and independence. 
    Such projects can play a key role in shaping India’s digital future.<br/><br/>
    Would love to connect and explore potential collaboration or contribution opportunities.<br/><br/>
    Regards,<br/>
    Mohit Kumar<br/>
    AlphaCorp Pvt. Ltd.
    </p>
    <hr/>
    <p style="font-size: 0.9em; color: gray;">
      📩 This email was sent via the <strong>Kways Mail (Beta)</strong> – a new-age Indian mail platform currently under development. 
      Our goal: <em>“Build for India. Scale for the world.”</em>
    </p>
  `,
      hasAttachments: true,
      attachments: [{ id: "a4", name: "proposal.pdf", size: 150000, url: "#" }],
    }
    ,
    ,
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
