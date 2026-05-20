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
  const [logoFailed, setLogoFailed] = useState(false);

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
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
            {logoFailed ? (
              <div>
                <span style={{ fontSize: 32, fontWeight: 900, color: C.text }}>BOQ</span>
                <span style={{ fontSize: 32, fontWeight: 900, color: C.gold }}>mate</span>
                <div style={{ fontSize: 11, color: C.textMuted, marginTop: 4, letterSpacing: 2 }}>AI-POWERED CONSTRUCTION PRICING</div>
              </div>
            ) : (
              <img
                src="/logo.svg"
                alt="BOQmate"
                width={280}
                height={193}
                onError={() => setLogoFailed(true)}
                style={{ width: 280, height: "auto", objectFit: "contain", display: "block" }}
              />
            )}
          </div>
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
