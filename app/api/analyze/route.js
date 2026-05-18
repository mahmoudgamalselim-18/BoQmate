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
        system: `أنت API متخصص في تحليل بنود مقايسات الإنشاءات المصرية.
قواعد صارمة يجب اتباعها:
1. أرجع JSON فقط — لا تكتب أي نص قبل أو بعده
2. لا تستخدم markdown أو backticks أو أي تنسيق
3. ابدأ ردك بـ { مباشرة وانته بـ }
4. إذا كان البند معقداً، حلله إلى أبسط مكوناته وأرجع JSON صحيح
5. لا تعتذر ولا تشرح — فقط JSON`,
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

    // استخرج الـ JSON من الرد حتى لو فيه نص إضافي
    if (data.content?.[0]?.text) {
      const text = data.content[0].text;
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        data.content[0].text = match[0];
      }
    }

    return Response.json(data);
  } catch (err) {
    return Response.json(
      { error: `فشل الاتصال بـ Anthropic: ${err.message}` },
      { status: 502 }
    );
  }
}
