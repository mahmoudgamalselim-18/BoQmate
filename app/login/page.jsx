"use client";
import { useState } from "react";



const LOGO_FULL_URI = "/logo.svg";
const LOGO_ICON_URI = "/logo.svg";

const C = {
  navy: "#0f0f0f",
  navyMid: "#141414",
  navyLight: "#1a1a1a",
  navyCard: "#1c1c1c",
  border: "#252525",
  borderLight: "#333333",
  gold: "#F6AA39",
  goldDark: "#d4891a",
  accent: "#F6AA39",
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
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}><img src="/logo.svg" alt="BOQmate" style={{ width: 220, height: "auto", objectFit: "contain" }} /></div><path fill=\"#C67D4E\" d=\"M38.12 14.06L38.12 7.78C38.12 6.48 37.49 5.84 36.22 5.84L28.99 5.84C27.72 5.84 27.08 6.48 27.08 7.77L27.08 14.06L29.47 14.06L29.47 8.69C29.47 8.41 29.61 8.27 29.89 8.27L31.40 8.27L31.40 14.06L33.80 14.06L33.80 8.27L35.34 8.27C35.60 8.27 35.76 8.41 35.76 8.69L35.76 14.06ZM44.21 11.52C44.21 11.70 44.11 11.80 43.93 11.80L41.89 11.80C41.71 11.80 41.61 11.70 41.61 11.52L41.61 10.95C41.61 10.77 41.71 10.67 41.89 10.67L43.93 10.67C44.11 10.67 44.21 10.77 44.21 10.95ZM44.74 14.06C46.00 14.06 46.63 13.41 46.63 12.12L46.63 7.77C46.63 6.48 45.98 5.84 44.67 5.84L39.52 5.84L39.52 8.13L43.79 8.13C44.07 8.13 44.21 8.27 44.21 8.55L44.21 9.17C44.09 9.11 43.93 9.07 43.75 9.07L40.99 9.07C39.80 9.07 39.20 9.70 39.20 10.98L39.20 12.19C39.20 13.44 39.80 14.06 40.99 14.06ZM52.12 14.06L52.12 11.63L50.60 11.63C50.36 11.63 50.23 11.48 50.23 11.16L50.23 8.13L52.14 8.13L52.14 5.92L50.23 5.92L50.23 3.56L47.81 3.56L47.81 12.25C47.81 13.45 48.48 14.06 49.81 14.06ZM58.02 8.95C58.02 9.13 57.92 9.23 57.74 9.23L55.69 9.23C55.51 9.23 55.41 9.13 55.41 8.95L55.41 8.37C55.41 8.19 55.51 8.09 55.69 8.09L57.74 8.09C57.92 8.09 58.02 8.19 58.02 8.37ZM60.07 14.06L60.07 11.76L55.83 11.76C55.55 11.76 55.41 11.62 55.41 11.34L55.41 10.72C55.54 10.79 55.69 10.82 55.85 10.82L58.63 10.82C59.82 10.82 60.42 10.19 60.42 8.92L60.42 7.71C60.42 6.47 59.82 5.84 58.63 5.84L54.88 5.84C53.62 5.84 52.99 6.48 52.99 7.77L52.99 12.12C52.99 13.41 53.65 14.06 54.95 14.06Z\"/></g></svg>` }} />

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
