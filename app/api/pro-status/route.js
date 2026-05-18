// app/api/pro-status/route.js

export async function GET(request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // حاول تجيب الـ token من أي cookie ممكن
  const accessToken =
    request.cookies.get("sb-access-token")?.value ||
    request.cookies.get("supabase-auth-token")?.value;

  if (!accessToken) {
    return Response.json({ isPro: false, email: null, reason: "no token" });
  }

  try {
    // اجيب بيانات المستخدم
    const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const userData = await userRes.json();
    const email = userData?.email;

    if (!email) {
      return Response.json({ isPro: false, email: null, reason: "no email" });
    }

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
