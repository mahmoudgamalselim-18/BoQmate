// app/api/analyze/route.js
// ─────────────────────────────────────────────────────────────
// 1. يجيب أقرب recipes من reference_boq
// 2. يبني prompt مع examples حقيقية من شغل المكتب
// 3. يبعت لـ Claude عشان يسعّر بدقة 95%+
// ─────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `أنت مهندس تكاليف خبير في السوق المصري.
مهمتك: تسعير بنود المقايسات الإنشائية بدقة عالية.

القواعد الصارمة:
1. أرجع JSON فقط — لا نص قبله أو بعده
2. ابدأ ردك بـ { مباشرة
3. استخدم أسعار السوق المصري الحالية المقدمة لك
4. إذا وُجدت أمثلة مرجعية، استخدم نفس طريقة التفكيك والنسب
5. احسب: (خامات × waste_factor) + (مصنعيات/عمالة) + (معدات) = التكلفة المباشرة

الـ JSON المطلوب:
{
  "itemName": "اسم البند",
  "quantity": الكمية,
  "unit": "الوحدة",
  "unitCost": تكلفة الوحدة بالجنيه,
  "totalCost": إجمالي التكلفة,
  "breakdown": {
    "materials": [{"name": "...", "qty": 0, "unit": "...", "unitPrice": 0, "total": 0}],
    "labor": [{"name": "...", "qty": 0, "unit": "...", "unitPrice": 0, "total": 0}],
    "equipment": [{"name": "...", "qty": 0, "unit": "...", "unitPrice": 0, "total": 0}]
  },
  "confidence": "high|medium|low",
  "notes": "ملاحظات"
}`;

function buildReferenceContext(recipes, resources, marketPrices) {
  if (!recipes || recipes.length === 0) return '';

  let ctx = '\n\n=== أمثلة مرجعية من مشاريع سابقة ===\n';

  for (const rec of recipes.slice(0, 2)) {
    ctx += `\nمثال: ${rec.description.slice(0, 80)}\n`;
    ctx += `الوحدة: ${rec.unit}\n`;
    const r = rec.recipe;

    if (r.materials?.length > 0) {
      ctx += 'الخامات:\n';
      for (const m of r.materials) {
        const res = resources[m.resource_id];
        const currentPrice = res?.current_price || m.ref_price_snapshot || 0;
        const mktPrice = marketPrices[m.desc] || currentPrice;
        ctx += `  - ${m.desc}: ${m.qty} ${m.unit} × waste ${m.waste_factor} | سعر السوق: ${mktPrice} ج.م\n`;
      }
    }

    if (r.labor?.length > 0) {
      ctx += 'مصنعيات/عمالة:\n';
      for (const l of r.labor) {
        const res = resources[l.resource_id];
        const rate = res?.current_price || l.ref_daily_cost_snapshot || 0;
        ctx += `  - ${l.desc}: ${l.qty_per_unit} ${l.unit} | معدل: ${rate} ج.م\n`;
      }
    }

    if (r.equipment?.length > 0) {
      ctx += 'معدات:\n';
      for (const e of r.equipment.slice(0, 3)) {
        const res = resources[e.resource_id];
        const rate = res?.current_price || e.ref_daily_cost_snapshot || 0;
        ctx += `  - ${e.desc}: ${e.qty_per_unit} ${e.unit} | معدل: ${rate} ج.م\n`;
      }
    }

    ctx += `هامش الربح: ${((r.markup?.profit_pct || 0.35) * 100).toFixed(0)}%\n`;
  }

  return ctx;
}

export async function POST(request) {
  const apiKey      = process.env.ANTHROPIC_API_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  if (!apiKey) {
    return Response.json({ error: "ANTHROPIC_API_KEY غير مضبوط" }, { status: 500 });
  }

  let body;
  try { body = await request.json(); } catch {
    return Response.json({ error: "طلب غير صحيح" }, { status: 400 });
  }

  const { messages, max_tokens = 2000 } = body;
  if (!messages || !Array.isArray(messages)) {
    return Response.json({ error: "messages مطلوبة" }, { status: 400 });
  }

  // ── 1. استخرج وصف البند من آخر message ───────────────────
  const lastMessage = messages[messages.length - 1];
  const itemDescription = typeof lastMessage?.content === 'string'
    ? lastMessage.content
    : JSON.stringify(lastMessage?.content || '');

  // ── 2. جيب الـ reference recipes من Supabase ──────────────
  let referenceContext = '';
  try {
    const refRes = await fetch(`${supabaseUrl.replace(/\/$/, '')}/rest/v1/reference_boq?limit=3`, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    });

    // Search by keywords
    const keywords = itemDescription
      .replace(/[^\u0600-\u06FFa-zA-Z0-9\s]/g, ' ')
      .trim()
      .split(/\s+/)
      .filter(w => w.length > 2)
      .slice(0, 4);

    if (keywords.length > 0) {
      const likeClause = keywords.map(w => `keywords.ilike.*${w}*`).join(',');
      const searchRes = await fetch(
        `${supabaseUrl}/rest/v1/reference_boq?or=(${likeClause})&limit=3`,
        {
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
          },
        }
      );

      if (searchRes.ok) {
        const recipes = await searchRes.json();

        if (recipes?.length > 0) {
          // Fetch resource prices
          const resourceIds = new Set();
          recipes.forEach(rec => {
            const r = rec.recipe;
            [...(r.materials||[]),...(r.labor||[]),...(r.equipment||[])]
              .forEach(c => c.resource_id && resourceIds.add(c.resource_id));
          });

          let resources = {};
          if (resourceIds.size > 0) {
            const ids = Array.from(resourceIds).join(',');
            const resRes = await fetch(
              `${supabaseUrl}/rest/v1/global_resources?resource_id=in.(${ids})&select=resource_id,name,current_price`,
              { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } }
            );
            if (resRes.ok) {
              const resData = await resRes.json();
              resData.forEach(r => { resources[r.resource_id] = { current_price: parseFloat(r.current_price)||0, name: r.name }; });
            }
          }

          // Fetch market prices
          const matWords = [];
          recipes.forEach(rec => (rec.recipe.materials||[]).forEach(m => {
            const w = m.desc.split(' ')[0];
            if (w.length > 2) matWords.push(w);
          }));

          let marketPrices = {};
          if (matWords.length > 0) {
            const nf = [...new Set(matWords)].slice(0,6).map(n=>`name.ilike.*${n}*`).join(',');
            const mRes = await fetch(
              `${supabaseUrl}/rest/v1/global_prices?or=(${nf})&select=name,price&limit=15`,
              { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } }
            );
            if (mRes.ok) {
              const mData = await mRes.json();
              mData.forEach(i => { marketPrices[i.name] = parseFloat(i.price)||0; });
            }
          }

          referenceContext = buildReferenceContext(recipes, resources, marketPrices);
        }
      }
    }
  } catch (e) {
    console.error('Reference search error:', e.message);
  }

  // ── 3. Build enhanced system prompt ───────────────────────
  const enhancedSystem = SYSTEM_PROMPT + referenceContext;

  // ── 4. Call Claude ─────────────────────────────────────────
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
        system: enhancedSystem,
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

    // Extract JSON from response
    if (data.content?.[0]?.text) {
      const text = data.content[0].text;
      const match = text.match(/\{[\s\S]*\}/);
      if (match) data.content[0].text = match[0];
    }

    return Response.json(data);

  } catch (err) {
    return Response.json(
      { error: `فشل الاتصال بـ Anthropic: ${err.message}` },
      { status: 502 }
    );
  }
}
