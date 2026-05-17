// app/api/analyze/route.js
// ─── Backend Proxy ───────────────────────────────────────────
// الـ ANTHROPIC_API_KEY موجود هنا على السيرفر فقط
// المستخدم مش بيشوفه خالص

export async function POST(request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return Response.json(
      { error: "ANTHROPIC_API_KEY غير مضبوط في بيئة السيرفر" },
      { status: 500 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "طلب غير صحيح" }, { status: 400 });
  }

  const { messages, max_tokens = 1500 } = body;

  if (!messages || !Array.isArray(messages)) {
    return Response.json({ error: "messages مطلوبة" }, { status: 400 });
  }

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5-20251001",
        max_tokens,
        messages,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return Response.json(
        { error: data?.error?.message || "خطأ من Anthropic API" },
        { status: res.status }
      );
    }

    return Response.json(data);
  } catch (err) {
    return Response.json(
      { error: `فشل الاتصال بـ Anthropic: ${err.message}` },
      { status: 502 }
    );
  }
}
