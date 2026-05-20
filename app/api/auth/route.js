// app/api/auth/route.js
// ─── Supabase Authentication Handler ────────────────────────

export async function POST(request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let body;
  try { body = await request.json(); } catch {
    return Response.json({ error: "طلب غير صحيح" }, { status: 400 });
  }

  const { mode, email, password, name } = body;

  if (!email || !password) {
    return Response.json({ error: "الإيميل وكلمة المرور مطلوبان" }, { status: 400 });
  }

  try {
    if (mode === "register") {
      // ── تسجيل مستخدم جديد ──
      const res = await fetch(`${supabaseUrl}/auth/v1/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseAnonKey,
        },
        body: JSON.stringify({
          email,
          password,
          data: { full_name: name || "" },
        }),
      });

      const data = await res.json();

      if (data.error || data.msg) {
        const msg = data.error?.message || data.msg || "خطأ في التسجيل";
        // Translate common errors to Arabic
        const arabicErrors = {
          "User already registered": "الإيميل مسجل بالفعل — جرب تسجيل الدخول",
          "Password should be at least 6 characters": "كلمة المرور 6 أحرف على الأقل",
          "Unable to validate email address: invalid format": "صيغة الإيميل غير صحيحة",
        };
        return Response.json({ error: arabicErrors[msg] || msg });
      }

      return Response.json({ success: true, message: "تم التسجيل — تحقق من إيميلك" });

    } else {
      // ── تسجيل الدخول ──
      const res = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseAnonKey,
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (data.error || data.error_description) {
        const msg = data.error_description || data.error || "بيانات غير صحيحة";
        const arabicErrors = {
          "Invalid login credentials": "الإيميل أو كلمة المرور غير صحيحة",
          "Email not confirmed": "يرجى تأكيد إيميلك أولاً",
          "Too many requests": "محاولات كثيرة — انتظر قليلاً",
        };
        return Response.json({ error: arabicErrors[msg] || msg });
      }

      // كل cookie في header منفصل — ضروري عشان المتصفح يحفظهم صح
      const resHeaders = new Headers();
      resHeaders.append("Content-Type", "application/json");
      resHeaders.append("Set-Cookie", `sb-access-token=${data.access_token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=3600`);
      resHeaders.append("Set-Cookie", `sb-refresh-token=${data.refresh_token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=604800`);

      return new Response(JSON.stringify({
        success: true,
        user: data.user,
      }), { status: 200, headers: resHeaders });
    }
  } catch (err) {
    return Response.json({ error: `خطأ في الاتصال: ${err.message}` }, { status: 502 });
  }
}
