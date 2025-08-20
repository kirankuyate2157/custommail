// app/api/send/route.js
export async function POST(req) {
  const body = await req.json();

  // Fake latency
  await new Promise((r) => setTimeout(r, 800));

  // Very simple guard (client does zod already)
  if (!body?.to || !body?.subject || !body?.htmlBody || !body?.textBody) {
    return new Response(
      JSON.stringify({ ok: false, message: "Missing required fields" }),
      { status: 400 }
    );
  }

  // 15% random fail to simulate SMTP errors
  const failed = Math.random() < 0.15;
  if (failed) {
    return new Response(
      JSON.stringify({ ok: false, message: "SMTP: 550 mailbox unavailable" }),
      { status: 500 }
    );
  }

  // Success
  return Response.json({ ok: true, id: crypto.randomUUID() });
}
