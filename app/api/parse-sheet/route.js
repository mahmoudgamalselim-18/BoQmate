// app/api/parse-sheet/route.js
// ─── Backend Proxy لقراءة الشيت ──────────────────────────────
// نفس الفكرة — max_tokens أكبر لأن الشيت ممكن يكون كبير

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

  const { messages } = body;

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
        model: "claude-3-5-sonnet-latest",
        max_tokens: 3000,
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
