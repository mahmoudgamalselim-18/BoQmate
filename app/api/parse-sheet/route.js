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
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
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
  } catch (error) {
  console.error("Anthropic API Raw Error:", error);
  
  let clearMessage = "خطأ في الاتصال بسيرفر كلود";
  
  // إذا كان الخطأ راجع من طلب fetch يدوي وتفاصيله مستخبة جوه كائن الخطأ
  if (error.error && error.error.message) {
    clearMessage = error.error.message;
  } else if (error.message) {
    clearMessage = error.message;
  } else if (typeof error === 'object') {
    clearMessage = JSON.stringify(error);
  }

  return NextResponse.json({ error: clearMessage }, { status: 500 });
}
}
