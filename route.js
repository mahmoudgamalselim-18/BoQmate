// app/api/pro-status/route.js
// ─── يتحقق هل المستخدم Pro أم لا ───────────────────────────

export async function GET(request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  // اجيب الـ access token من الـ cookie
  const accessToken = request.cookies.get("sb-access-token")?.value;

  if (!accessToken) {
    return Response.json({ isPro: false, email: null });
  }

  try {
    // اجيب بيانات المستخدم من Supabase
    const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const userData = await userRes.json();
    const email = userData?.email;

    if (!email) return Response.json({ isPro: false, email: null });

    // تحقق من جدول pro_users
    const proRes = await fetch(
      `${supabaseUrl}/rest/v1/pro_users?email=eq.${encodeURIComponent(email)}&select=email`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      }
    );

    const proData = await proRes.json();
    const isPro = Array.isArray(proData) && proData.length > 0;

    return Response.json({ isPro, email });
  } catch (err) {
    return Response.json({ isPro: false, email: null, error: err.message });
  }
}
