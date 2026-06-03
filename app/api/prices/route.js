// app/api/prices/route.js
// ─────────────────────────────────────────────────────────────
// جلب قائمة الأسعار الحالية من global_prices و global_resources
// ─────────────────────────────────────────────────────────────

export async function GET(request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return Response.json(
      { error: "Supabase environment variables not configured" },
      { status: 500 }
    );
  }

  try {
    // جلب من global_resources أولاً (خامات وموارد)
    const resourcesRes = await fetch(
      `${supabaseUrl}/rest/v1/global_resources?select=resource_id,name,category,unit,current_price`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      }
    );

    // جلب من global_prices كإضافة (نسخة معدلة)
    const pricesRes = await fetch(
      `${supabaseUrl}/rest/v1/global_prices?select=id,name,category,unit,price`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      }
    );

    let resources = [];
    let prices = [];

    if (resourcesRes.ok) {
      resources = await resourcesRes.json();
      // تحويل global_resources إلى صيغة موحدة
      resources = resources.map((r) => ({
        id: `res_${r.resource_id}`,
        name: r.name,
        category: r.category || "عام",
        unit: r.unit || "",
        price: parseFloat(r.current_price) || 0,
        type: "خامة",
      }));
    }

    if (pricesRes.ok) {
      prices = await pricesRes.json();
      // تحويل global_prices إلى صيغة موحدة
      prices = prices.map((p) => ({
        id: `price_${p.id}`,
        name: p.name,
        category: p.category || "عام",
        unit: p.unit || "",
        price: parseFloat(p.price) || 0,
        type: "سعر",
      }));
    }

    // دمج وإزالة التكرارات
    const combined = [...resources, ...prices];
    const unique = Array.from(
      new Map(combined.map((item) => [item.name, item])).values()
    );

    return Response.json(unique);
  } catch (error) {
    console.error("Error fetching prices:", error);
    return Response.json(
      { error: `Failed to fetch prices: ${error.message}` },
      { status: 500 }
    );
  }
}
