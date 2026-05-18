// app/api/analyze/route.js

export async function POST(request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return Response.json(
      { error: "ANTHROPIC_API_KEY غير مضبوط في بيئة السيرفر" },
      { status: 500 }
    );
  }

  let body;
  try { body = await request.json(); } catch {
    return Response.json({ error: "طلب غير صحيح" }, { status: 400 });
  }

  const { messages, max_tokens = 2000 } = body;

  if (!messages || !Array.isArray(messages)) {
    return Response.json({ error: "messages مطلوبة" }, { status: 400 });
  }

  try {
    // نضيف assistant prefill بـ { عشان نجبر الـ Claude يبدأ بـ JSON مباشرة
    const messagesWithPrefill = [
      ...messages,
      { role: "assistant", content: "{" }
    ];

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens,
        system: "أنت API متخصص في تحليل بنود مقايسات الإنشاءات. أرجع JSON فقط بدون أي نص إضافي. لا تكتب أي شرح أو مقدمة. الرد يبدأ بـ { مباشرة.",
        messages: messagesWithPrefill,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return Response.json(
        { error: data?.error?.message || "خطأ من Anthropic API" },
        { status: res.status }
      );
    }

    // الرد جاء بعد الـ prefill { — نضيف { في الأول عشان يكون JSON كامل
    if (data.content?.[0]?.text) {
      data.content[0].text = "{" + data.content[0].text;
    }

    return Response.json(data);
  } catch (err) {
    return Response.json(
      { error: `فشل الاتصال بـ Anthropic: ${err.message}` },
      { status: 502 }
    );
  }
}
