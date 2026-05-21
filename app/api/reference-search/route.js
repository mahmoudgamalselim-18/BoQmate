// app/api/reference-search/route.js
// ─────────────────────────────────────────────────────────────
// يبحث في reference_boq عن أقرب 3 recipes للبند الجديد
// ويجيب أسعار المكونات من global_resources (current_price)
// ─────────────────────────────────────────────────────────────

export async function POST(request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  let body;
  try { body = await request.json(); } catch {
    return Response.json({ error: "طلب غير صحيح" }, { status: 400 });
  }

  const { description, unit } = body;
  if (!description) {
    return Response.json({ error: "description مطلوب" }, { status: 400 });
  }

  try {
    // ── 1. Keyword search in reference_boq ───────────────────
    const keywords = description
      .replace(/[^\u0600-\u06FFa-zA-Z0-9\s]/g, ' ')
      .trim()
      .split(/\s+/)
      .filter(w => w.length > 2)
      .slice(0, 5);

    // Build OR filter for Supabase REST
    const likeClause = keywords
      .map(w => `keywords.ilike.*${w}*`)
      .join(',');

    const searchUrl = unit
      ? `${supabaseUrl}/rest/v1/reference_boq?or=(${likeClause})&unit=eq.${encodeURIComponent(unit)}&limit=3`
      : `${supabaseUrl}/rest/v1/reference_boq?or=(${likeClause})&limit=3`;

    const searchRes = await fetch(searchUrl, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    });

    let recipes = searchRes.ok ? await searchRes.json() : [];

    // ── Fallback: fetch by trade if no results ────────────────
    if (!recipes || recipes.length === 0) {
      const fallbackRes = await fetch(
        `${supabaseUrl}/rest/v1/reference_boq?limit=3`,
        {
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
          },
        }
      );
      recipes = fallbackRes.ok ? await fallbackRes.json() : [];
    }

    if (!recipes || recipes.length === 0) {
      return Response.json({ recipes: [], resources: {}, marketPrices: {}, found: 0 });
    }

    // ── 2. Collect all resource_ids ───────────────────────────
    const resourceIds = new Set();
    for (const rec of recipes) {
      const r = rec.recipe;
      [...(r.materials || []), ...(r.labor || []), ...(r.equipment || [])]
        .forEach(c => c.resource_id && resourceIds.add(c.resource_id));
    }

    // ── 3. Fetch current prices from global_resources ─────────
    let resources = {};
    if (resourceIds.size > 0) {
      const ids = Array.from(resourceIds).join(',');
      const resRes = await fetch(
        `${supabaseUrl}/rest/v1/global_resources?resource_id=in.(${ids})&select=resource_id,name,unit,type,current_price`,
        {
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
          },
        }
      );

      if (resRes.ok) {
        const resData = await resRes.json();
        for (const r of resData) {
          resources[r.resource_id] = {
            name: r.name,
            unit: r.unit,
            type: r.type,
            current_price: parseFloat(r.current_price) || 0,
          };
        }
      }
    }

    // ── 4. Fetch market prices from global_prices ─────────────
    let marketPrices = {};
    const matNames = [];
    for (const rec of recipes) {
      (rec.recipe.materials || []).forEach(m => {
        const word = m.desc.split(' ')[0];
        if (word.length > 2) matNames.push(word);
      });
    }

    if (matNames.length > 0) {
      const nameFilter = [...new Set(matNames)]
        .slice(0, 8)
        .map(n => `name.ilike.*${n}*`)
        .join(',');

      const mktRes = await fetch(
        `${supabaseUrl}/rest/v1/global_prices?or=(${nameFilter})&select=name,unit,price&limit=20`,
        {
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
          },
        }
      );

      if (mktRes.ok) {
        const mktData = await mktRes.json();
        for (const item of mktData) {
          marketPrices[item.name] = parseFloat(item.price) || 0;
        }
      }
    }

    return Response.json({
      recipes,
      resources,
      marketPrices,
      found: recipes.length,
    });

  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
