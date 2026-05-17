"use client";
import { useState } from "react";



const C = {
  navy: "#0f0f0f",
  navyMid: "#141414",
  navyLight: "#1a1a1a",
  navyCard: "#1c1c1c",
  border: "#252525",
  borderLight: "#333333",
  gold: "#C67D4E",
  goldDark: "#a8622f",
  accent: "#c57d4d",
  success: "#6abf69",
  danger: "#ef5350",
  text: "#f0f0f0",
  textMuted: "#888888",
  textDim: "#555555",
};

export default function LoginPage() {
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async () => {
    if (!email || !password) { setError("الإيميل وكلمة المرور مطلوبان"); return; }
    if (mode === "register" && !name) { setError("الاسم مطلوب"); return; }
    if (password.length < 6) { setError("كلمة المرور 6 أحرف على الأقل"); return; }

    setLoading(true); setError(""); setSuccess("");

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, email, password, name }),
      });

      const data = await res.json();

      if (data.error) {
        setError(data.error);
      } else if (mode === "register") {
        setSuccess("✅ تم إنشاء حسابك! تحقق من إيميلك لتأكيد الحساب.");
        setEmail(""); setPassword(""); setName("");
      } else {
        // Login success — redirect to app
        window.location.href = "/";
      }
    } catch {
      setError("حدث خطأ — حاول مرة أخرى");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", background: C.navy, display: "flex",
      alignItems: "center", justifyContent: "center",
      fontFamily: "'Cairo', sans-serif", direction: "rtl", padding: 20
    }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap');`}</style>

      <div style={{ width: "100%", maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }} dangerouslySetInnerHTML={{ __html: `<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"108 48 90 105\" width=\"64\" height=\"74\"><g fill=\"#C67D4E\" transform=\"matrix(1.0065966844558716,0,0,1.0065966844558716,99.818833649152,56.64806114538712)\"><path d="m83.3 26.3-10-.7v-8.9c0-1.1-.9-2-2-2H28.7c-1.1 0-2 .9-2 2v8.9l-10 .7c-.5 0-1 .3-1.4.7-.3.4-.5.9-.5 1.5l3.8 54.9c.1 1.1 1 1.9 2 1.9h.1l29.1-2 29.1 2h.1c.5 0 .9-.2 1.3-.5s.6-.8.7-1.4l3.8-54.9c.4-1.1-.4-2.1-1.5-2.2m-52.6-7.5h38.5v51H30.7zm-8.1 62.3L19 30.2l7.7-.5v42.2c0 1.1.9 2 2 2h6.6l-.4 6.3v.1zm54.8 0L39 78.4l.3-4.6h31.9c1.1 0 2-.9 2-2V29.6l7.7.5z"></path><path d="M61.7 25.3H38.3c-1.1 0-2 .9-2 2s.9 2 2 2h23.4c1.1 0 2-.9 2-2s-.9-2-2-2m0 8.5H38.3c-1.1 0-2 .9-2 2s.9 2 2 2h23.4c1.1 0 2-.9 2-2s-.9-2-2-2m0 8.5H38.3c-1.1 0-2 .9-2 2s.9 2 2 2h23.4c1.1 0 2-.9 2-2s-.9-2-2-2m0 8.5H38.3c-1.1 0-2 .9-2 2s.9 2 2 2h23.4c1.1 0 2-.9 2-2s-.9-2-2-2m0 8.5H38.3c-1.1 0-2 .9-2 2s.9 2 2 2h23.4c1.1 0 2-.9 2-2s-.9-2-2-2"></path></g></svg>` }} />
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 6 }} dangerouslySetInnerHTML={{ __html: `<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"15 138 272 72\" width=\"160\" height=\"40\"><g transform=\"matrix(4.34782600402832,0,0,4.34782600402832,17.304347770963247,145.64119438359015)\"><path fill=\"#ffffff\" d=\"M6.40 14.06C7.67 14.06 8.32 13.40 8.32 12.08L8.32 10.26C8.32 9.42 7.95 8.92 7.11 8.74C7.91 8.60 8.29 8.05 8.29 7.08L8.29 5.40C8.29 4.07 7.64 3.42 6.36 3.42L0.62 3.42L0.62 14.06ZM5.91 11.03C5.91 11.31 5.77 11.45 5.49 11.45L3.04 11.45L3.04 9.80L5.49 9.80C5.77 9.80 5.91 9.94 5.91 10.22ZM5.91 7.24C5.91 7.52 5.77 7.66 5.49 7.66L3.04 7.66L3.04 6.02L5.49 6.02C5.77 6.02 5.91 6.16 5.91 6.44ZM14.71 10.96C14.71 11.24 14.57 11.38 14.29 11.38L12.28 11.38C12.00 11.38 11.86 11.24 11.86 10.96L11.86 6.51C11.86 6.23 12.00 6.09 12.28 6.09L14.29 6.09C14.57 6.09 14.71 6.23 14.71 6.51ZM15.20 14.06C16.49 14.06 17.12 13.44 17.12 12.19L17.12 5.36C17.12 4.06 16.49 3.42 15.20 3.42L11.35 3.42C10.08 3.42 9.44 4.06 9.44 5.36L9.44 12.19C9.44 13.44 10.08 14.06 11.35 14.06ZM25.19 15.79L26.60 14.34L25.65 13.36C25.83 13.06 25.93 12.67 25.93 12.19L25.93 5.36C25.93 4.06 25.28 3.42 24.01 3.42L20.16 3.42C18.89 3.42 18.24 4.06 18.24 5.36L18.24 12.19C18.24 13.44 18.89 14.06 20.16 14.06L23.41 14.06ZM23.52 10.96C23.52 11.24 23.38 11.38 23.10 11.38L21.08 11.38C20.80 11.38 20.66 11.24 20.66 10.96L20.66 6.51C20.66 6.23 20.80 6.09 21.08 6.09L23.10 6.09C23.38 6.09 23.52 6.23 23.52 6.51Z\"/><path fill=\"#C67D4E\" d=\"M38.12 14.06L38.12 7.78C38.12 6.48 37.49 5.84 36.22 5.84L28.99 5.84C27.72 5.84 27.08 6.48 27.08 7.77L27.08 14.06L29.47 14.06L29.47 8.69C29.47 8.41 29.61 8.27 29.89 8.27L31.40 8.27L31.40 14.06L33.80 14.06L33.80 8.27L35.34 8.27C35.60 8.27 35.76 8.41 35.76 8.69L35.76 14.06ZM44.21 11.52C44.21 11.70 44.11 11.80 43.93 11.80L41.89 11.80C41.71 11.80 41.61 11.70 41.61 11.52L41.61 10.95C41.61 10.77 41.71 10.67 41.89 10.67L43.93 10.67C44.11 10.67 44.21 10.77 44.21 10.95ZM44.74 14.06C46.00 14.06 46.63 13.41 46.63 12.12L46.63 7.77C46.63 6.48 45.98 5.84 44.67 5.84L39.52 5.84L39.52 8.13L43.79 8.13C44.07 8.13 44.21 8.27 44.21 8.55L44.21 9.17C44.09 9.11 43.93 9.07 43.75 9.07L40.99 9.07C39.80 9.07 39.20 9.70 39.20 10.98L39.20 12.19C39.20 13.44 39.80 14.06 40.99 14.06ZM52.12 14.06L52.12 11.63L50.60 11.63C50.36 11.63 50.23 11.48 50.23 11.16L50.23 8.13L52.14 8.13L52.14 5.92L50.23 5.92L50.23 3.56L47.81 3.56L47.81 12.25C47.81 13.45 48.48 14.06 49.81 14.06ZM58.02 8.95C58.02 9.13 57.92 9.23 57.74 9.23L55.69 9.23C55.51 9.23 55.41 9.13 55.41 8.95L55.41 8.37C55.41 8.19 55.51 8.09 55.69 8.09L57.74 8.09C57.92 8.09 58.02 8.19 58.02 8.37ZM60.07 14.06L60.07 11.76L55.83 11.76C55.55 11.76 55.41 11.62 55.41 11.34L55.41 10.72C55.54 10.79 55.69 10.82 55.85 10.82L58.63 10.82C59.82 10.82 60.42 10.19 60.42 8.92L60.42 7.71C60.42 6.47 59.82 5.84 58.63 5.84L54.88 5.84C53.62 5.84 52.99 6.48 52.99 7.77L52.99 12.12C52.99 13.41 53.65 14.06 54.95 14.06Z\"/></g></svg>` }} />
          <p style={{ color: C.gold, fontSize: 11, fontWeight: 700, letterSpacing: "2.5px", marginTop: 6 }}>
            AI-POWERED CONSTRUCTION PRICING
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: C.navyCard, borderRadius: 20,
          border: `1px solid ${C.borderLight}`, padding: 36
        }}>
          {/* Mode Toggle */}
          <div style={{
            display: "flex", background: C.navyMid, borderRadius: 10,
            padding: 4, marginBottom: 28, border: `1px solid ${C.border}`
          }}>
            {[{ k: "login", label: "تسجيل الدخول" }, { k: "register", label: "حساب جديد" }].map(t => (
              <button key={t.k} onClick={() => { setMode(t.k); setError(""); setSuccess(""); }}
                style={{
                  flex: 1, padding: "10px", border: "none", borderRadius: 8,
                  fontFamily: "'Cairo', sans-serif", fontWeight: 700, fontSize: 14,
                  cursor: "pointer", transition: "all 0.2s",
                  background: mode === t.k ? `linear-gradient(135deg, ${C.gold}, ${C.goldDark})` : "transparent",
                  color: mode === t.k ? C.navy : C.textMuted,
                }}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Fields */}
          {mode === "register" && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, color: C.textMuted, marginBottom: 6, display: "block", fontWeight: 600 }}>
                الاسم الكامل
              </label>
              <input value={name} onChange={e => setName(e.target.value)}
                placeholder="محمد أحمد"
                style={{
                  width: "100%", background: C.navyMid, border: `1px solid ${C.border}`,
                  borderRadius: 10, padding: "12px 16px", color: C.text, fontSize: 14,
                  fontFamily: "'Cairo', sans-serif", outline: "none", boxSizing: "border-box"
                }} />
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, color: C.textMuted, marginBottom: 6, display: "block", fontWeight: 600 }}>
              البريد الإلكتروني
            </label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="example@company.com" dir="ltr"
              style={{
                width: "100%", background: C.navyMid, border: `1px solid ${C.border}`,
                borderRadius: 10, padding: "12px 16px", color: C.text, fontSize: 14,
                fontFamily: "'Cairo', sans-serif", outline: "none", boxSizing: "border-box"
              }} />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 13, color: C.textMuted, marginBottom: 6, display: "block", fontWeight: 600 }}>
              كلمة المرور
            </label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" dir="ltr"
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
              style={{
                width: "100%", background: C.navyMid, border: `1px solid ${C.border}`,
                borderRadius: 10, padding: "12px 16px", color: C.text, fontSize: 14,
                fontFamily: "'Cairo', sans-serif", outline: "none", boxSizing: "border-box"
              }} />
          </div>

          {/* Error / Success */}
          {error && (
            <div style={{
              background: `${C.danger}20`, border: `1px solid ${C.danger}40`,
              borderRadius: 8, padding: "10px 14px", color: C.danger,
              marginBottom: 16, fontSize: 13
            }}>⚠️ {error}</div>
          )}
          {success && (
            <div style={{
              background: `${C.success}20`, border: `1px solid ${C.success}40`,
              borderRadius: 8, padding: "10px 14px", color: C.success,
              marginBottom: 16, fontSize: 13
            }}>{success}</div>
          )}

          {/* Submit */}
          <button onClick={handleSubmit} disabled={loading}
            style={{
              width: "100%", padding: "14px",
              background: loading ? C.navyLight : `linear-gradient(135deg, ${C.gold}, ${C.goldDark})`,
              color: loading ? C.textMuted : C.navy,
              border: "none", borderRadius: 10, fontFamily: "'Cairo', sans-serif",
              fontWeight: 800, fontSize: 16, cursor: loading ? "not-allowed" : "pointer",
              transition: "all 0.2s"
            }}>
            {loading ? "⏳ جاري المعالجة..." : mode === "login" ? "دخول →" : "إنشاء الحساب →"}
          </button>
        </div>

        <p style={{ textAlign: "center", color: C.textDim, fontSize: 12, marginTop: 20 }}>
          BoQmate © 2025 — جميع الحقوق محفوظة
        </p>
      </div>
    </div>
  );
}
