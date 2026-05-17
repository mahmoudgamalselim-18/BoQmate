// app/auth/callback/route.js
// ─── بعد ما المستخدم يضغط رابط التأكيد في الإيميل ──────────

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    try {
      // Exchange code for session
      const res = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=pkce`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseAnonKey,
        },
        body: JSON.stringify({ auth_code: code }),
      });

      const data = await res.json();

      if (data.access_token) {
        // Set session and redirect to app
        return new Response(null, {
          status: 302,
          headers: {
            Location: `${origin}/`,
            "Set-Cookie": [
              `sb-access-token=${data.access_token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=3600`,
              `sb-refresh-token=${data.refresh_token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=604800`,
            ].join(", "),
          },
        });
      }
    } catch {}
  }

  // Fallback — redirect to login
  return new Response(null, {
    status: 302,
    headers: { Location: `${origin}/login` },
  });
}
