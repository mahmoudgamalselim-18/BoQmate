"use client";
import { useState, useEffect } from "react";

// ============================================================
// GLOBAL STYLES & FONT INJECTION
// ============================================================
const GlobalStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800;900&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Cairo', sans-serif; background: #0f0f0f; color: #f0f0f0; direction: rtl; }
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-track { background: #0d1525; }
    ::-webkit-scrollbar-thumb { background: #C67D4E; border-radius: 3px; }
    input, textarea, select { font-family: 'Cairo', sans-serif; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
    @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    .fade-in { animation: fadeIn 0.4s ease forwards; }
    .spin { animation: spin 1s linear infinite; }
  `}</style>
);

// ============================================================
// DESIGN TOKENS
// ============================================================
// Logo is embedded as inline SVG

const C = {
  navy: "#0f0f0f",
  navyMid: "#141414",
  navyLight: "#1a1a1a",
  navyCard: "#1c1c1c",
  border: "#252525",
  borderLight: "#333333",
  gold: "#C67D4E",
  goldDark: "#a8622f",
  goldLight: "#d99060",
  accent: "#C67D4E",
  accentDim: "rgba(198,125,78,0.12)",
  success: "#4ade80",
  danger: "#f87171",
  warning: "#fb923c",
  text: "#f0f0f0",
  textMuted: "#888888",
  textDim: "#555555",
  white: "#ffffff",
};

// ============================================================
// GLOBAL PRICE DATABASE — يُسحب من Supabase
// ============================================================
// GLOBAL_DB بيتحمل من الـ API عند بداية التطبيق
// الـ components بتستخدم globalDB state من الـ BoQmate component
let GLOBAL_DB = []; // fallback فارغ — بيتملى من Supabase

// ============================================================
// AI SYSTEM PROMPT (Few-Shot)
// ============================================================
const AI_SYSTEM = `أنت خبير تكاليف ومقايسات في السوق المصري والخليجي. مهمتك تحليل بنود المقايسات وإرجاع تفاصيل التكلفة بدقة تامة.

قاموس المصطلحات (Synonyms Dictionary):
- "توريد وصب" = خامات + مصنعية
- "تسليم مفتاح" = بند محمل (All-in price)
- "أعمال الهيكل الإنشائي" = أعمال خرسانة وحديد
- "أعمال التشطيب الداخلي" = بلاط + دهانات + نجارة + تركيبات
- "أعمال الماسورة" = أعمال صرف/سباكة
- "أعمال الميكانيكا" = تكييف + تهوية
- "أعمال الكهربا" = تركيبات كهربائية
- "لياسة" = بياض أو بلاستر
- "ردم وتسوية" = أعمال ترابية

قواعد التحليل:
1. حلل كل بند إلى مكونات: خامات (materials) ومصنعيات (labor).
2. المصنعيات تمثل عادةً 20-35% من إجمالي تكلفة البند الإنشائي.
3. الأسعار بالجنيه المصري وللسنة 2024-2025.
4. إذا لم يُذكر المواصفة، افترض المواصفة الاقتصادية المعتادة في السوق المصري.
5. أرجع النتيجة كـ JSON فقط بدون أي نص إضافي أو Markdown.

مثال 1 - بند خرسانة:
Input: "أعمال توريد وصب خرسانة مسلحة C25 للأعمدة - 50 م³"
Output:
{
  "itemName": "خرسانة مسلحة C25 للأعمدة",
  "quantity": 50,
  "unit": "م³",
  "components": [
    {"name": "خرسانة جاهزة C25", "type": "خامة", "unit": "م³", "qty_per_unit": 1.05, "unit_price": 1850},
    {"name": "حديد تسليح Ø16", "type": "خامة", "unit": "طن", "qty_per_unit": 0.12, "unit_price": 27800},
    {"name": "صب خرسانة يدوي", "type": "مصنعية", "unit": "م³", "qty_per_unit": 1, "unit_price": 250},
    {"name": "شمبر خشبي", "type": "مصنعية", "unit": "م²", "qty_per_unit": 4, "unit_price": 85},
    {"name": "تسليح ونقل حديد", "type": "مصنعية", "unit": "طن", "qty_per_unit": 0.12, "unit_price": 1500}
  ],
  "notes": "تم اعتبار نسبة حديد 120 كج/م³ وهدر خرسانة 5%"
}

مثال 2 - بند مباني:
Input: "بناء حوائط طوب أبيض 25 سم - 200 م²"
Output:
{
  "itemName": "حوائط طوب أبيض 25 سم",
  "quantity": 200,
  "unit": "م²",
  "components": [
    {"name": "طوب أبلكاش", "type": "خامة", "unit": "ألف طوبة", "qty_per_unit": 0.11, "unit_price": 950},
    {"name": "أسمنت بورتلاند", "type": "خامة", "unit": "شيكارة 50كج", "qty_per_unit": 0.5, "unit_price": 185},
    {"name": "رمل نظيف", "type": "خامة", "unit": "م³", "qty_per_unit": 0.03, "unit_price": 280},
    {"name": "مصنعية بناء طوب", "type": "مصنعية", "unit": "م²", "qty_per_unit": 1, "unit_price": 65}
  ],
  "notes": "حائط 25 سم = طوبتين، يُضاف رسوم تفريغ ونقل للطوابق العليا"
}

الآن حلل البند التالي وأرجع JSON فقط بنفس الصيغة السابقة:`;

// ============================================================
// HELPERS
// ============================================================
const LS = {
  get: (k, def) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : def; } catch { return def; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

const formatEGP = (n) => new Intl.NumberFormat("ar-EG", { style: "currency", currency: "EGP", maximumFractionDigits: 0 }).format(n || 0);

// ============================================================
// UI COMPONENTS
// ============================================================
const Modal = ({ open, onClose, children, width = 520 }) => {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(5,10,25,0.85)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: C.navyCard, border: `1px solid ${C.borderLight}`, borderRadius: 16, padding: 32, width: "100%", maxWidth: width, maxHeight: "90vh", overflowY: "auto", animation: "fadeIn 0.25s ease" }}>
        {children}
      </div>
    </div>
  );
};

const Btn = ({ children, onClick, variant = "primary", size = "md", disabled, style: s }) => {
  const styles = {
    primary: { background: `linear-gradient(135deg, ${C.gold}, ${C.goldDark})`, color: C.navy, fontWeight: 700 },
    secondary: { background: C.navyLight, color: C.text, border: `1px solid ${C.border}` },
    danger: { background: "rgba(239,83,80,0.15)", color: C.danger, border: `1px solid rgba(239,83,80,0.3)` },
    ghost: { background: "transparent", color: C.textMuted, border: `1px solid ${C.border}` },
    accent: { background: `linear-gradient(135deg, #1a8fc7, #1565a0)`, color: C.white, fontWeight: 700 },
  };
  const sizes = { sm: { padding: "6px 14px", fontSize: 13 }, md: { padding: "10px 22px", fontSize: 14 }, lg: { padding: "14px 32px", fontSize: 16 } };
  return (
    <button onClick={onClick} disabled={disabled} style={{ ...styles[variant], ...sizes[size], borderRadius: 8, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1, border: "none", fontFamily: "'Cairo', sans-serif", transition: "all 0.2s", ...s }}>
      {children}
    </button>
  );
};

const Input = ({ label, value, onChange, placeholder, type = "text", readOnly }) => (
  <div style={{ marginBottom: 16 }}>
    {label && <label style={{ display: "block", fontSize: 13, color: C.textMuted, marginBottom: 6, fontWeight: 600 }}>{label}</label>}
    <input type={type} value={value} onChange={onChange} placeholder={placeholder} readOnly={readOnly}
      style={{ width: "100%", background: readOnly ? C.navy : C.navyLight, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 14px", color: C.text, fontSize: 14, outline: "none", fontFamily: "'Cairo', sans-serif", direction: "rtl" }} />
  </div>
);

const Badge = ({ children, color = C.gold }) => (
  <span style={{ background: `${color}22`, color, border: `1px solid ${color}44`, borderRadius: 20, padding: "2px 10px", fontSize: 12, fontWeight: 600 }}>{children}</span>
);

// ============================================================
// PAYWALL MODAL
// ============================================================
const PaywallModal = ({ open, onClose, type }) => (
  <Modal open={open} onClose={onClose} width={480}>
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 56, marginBottom: 16 }}>{type === "export" ? "🚀" : "⭐"}</div>
      <div style={{ background: `linear-gradient(135deg, ${C.gold}, ${C.goldLight})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontSize: 22, fontWeight: 900, marginBottom: 10 }}>
        {type === "export" ? "لحظة الانبهار وصلت!" : "BoQmate Pro"}
      </div>
      {type === "export" ? (
        <>
          <p style={{ color: C.textMuted, lineHeight: 1.8, marginBottom: 20, fontSize: 15 }}>
            تقاريرك جاهزة للطباعة والتسليم ✅<br />
            قم بترقية حسابك إلى <strong style={{ color: C.gold }}>Pro</strong> لطباعة العروض<br />
            ببيانات شركتك، شعارها، وتوقيعها الرسمي.
          </p>
          <div style={{ background: C.navyLight, borderRadius: 12, padding: 16, marginBottom: 20, textAlign: "right" }}>
            {["تصدير PDF مع شعار شركتك", "تصدير Excel جاهز للعميل", "قوالب عروض احترافية", "بيانات الشركة على كل صفحة"].map(f => (
              <div key={f} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, color: C.text, fontSize: 14 }}>
                <span style={{ color: C.success }}>✓</span> {f}
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <p style={{ color: C.textMuted, lineHeight: 1.8, marginBottom: 20, fontSize: 15 }}>
            لتخصيص هوامش الربح والمصاريف الإدارية بدقة تناسب<br />
            مشاريعك، اشترك في <strong style={{ color: C.gold }}>BoQmate Pro</strong>.
          </p>
          <div style={{ background: C.navyLight, borderRadius: 12, padding: 16, marginBottom: 20, textAlign: "right" }}>
            {["تعديل هامش الربح (1% → 50%)", "تعديل المصاريف الإدارية بحرية", "قاعدة أسعار خاصة غير محدودة", "دعم فني مباشر"].map(f => (
              <div key={f} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, color: C.text, fontSize: 14 }}>
                <span style={{ color: C.success }}>✓</span> {f}
              </div>
            ))}
          </div>
        </>
      )}
      <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
        <Btn variant="primary" size="lg" onClick={onClose}>ترقية إلى Pro الآن →</Btn>
        <Btn variant="ghost" onClick={onClose}>لاحقاً</Btn>
      </div>
    </div>
  </Modal>
);

// ============================================================
// TAB: PRICE MANAGEMENT
// ============================================================
const PriceManagementTab = ({ globalDB = [], dbLoading = false }) => {
  const [privateDB, setPrivateDB] = useState(() => LS.get("boqmate_private_db", []));
  const [activeView, setActiveView] = useState("global");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", category: "", unit: "", price: "", type: "خامة" });
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState("");

  const savePrivate = (db) => { setPrivateDB(db); LS.set("boqmate_private_db", db); };

  const handleSave = () => {
    if (!form.name || !form.price) return;
    const entry = { ...form, price: parseFloat(form.price), id: editId || `p${Date.now()}` };
    if (editId) { savePrivate(privateDB.map(x => x.id === editId ? entry : x)); }
    else { savePrivate([...privateDB, entry]); }
    setForm({ name: "", category: "", unit: "", price: "", type: "خامة" });
    setShowForm(false); setEditId(null);
  };

  const handleEdit = (item) => { setForm({ name: item.name, category: item.category, unit: item.unit, price: String(item.price), type: item.type }); setEditId(item.id); setShowForm(true); };
  const handleDelete = (id) => savePrivate(privateDB.filter(x => x.id !== id));

  const db = activeView === "global" ? globalDB : privateDB;
  const filtered = db.filter(x => x.name.includes(search) || (x.category || "").includes(search));

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: C.text }}>إدارة الأسعار</h2>
          <p style={{ color: C.textMuted, fontSize: 13, marginTop: 4 }}>قاعدتا الأسعار: السوق المصري + خامات شركتك الخاصة</p>
        </div>
        {activeView === "private" && <Btn onClick={() => { setShowForm(true); setEditId(null); setForm({ name: "", category: "", unit: "", price: "", type: "خامة" }); }}>+ إضافة خامة</Btn>}
      </div>

      {/* Toggle */}
      <div style={{ display: "flex", background: C.navyMid, borderRadius: 10, padding: 4, marginBottom: 20, width: "fit-content", border: `1px solid ${C.border}` }}>
        {[{ k: "global", label: "🌐 قاعدة السوق (عامة)" }, { k: "private", label: "🔒 قاعدة شركتي (خاصة)" }].map(t => (
          <button key={t.k} onClick={() => setActiveView(t.k)}
            style={{ padding: "8px 20px", borderRadius: 8, border: "none", fontFamily: "'Cairo', sans-serif", fontWeight: 600, fontSize: 14, cursor: "pointer", transition: "all 0.2s", background: activeView === t.k ? C.gold : "transparent", color: activeView === t.k ? C.navy : C.textMuted }}>
            {t.label}
          </button>
        ))}
      </div>

      {activeView === "global" && (
        <div style={{ background: `${C.accent}15`, border: `1px solid ${C.accentDim}`, borderRadius: 10, padding: "10px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ color: C.accent, fontSize: 18 }}>ℹ️</span>
          <span style={{ color: C.accent, fontSize: 13 }}>قراءة فقط — يتم تحديث هذه القاعدة بواسطة فريق BoQmate وفق أسعار السوق الحالية.</span>
        </div>
      )}
      {activeView === "private" && (
        <div style={{ background: `${C.gold}15`, border: `1px solid ${C.gold}40`, borderRadius: 10, padding: "10px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 18 }}>💡</span>
          <span style={{ color: C.gold, fontSize: 13 }}>الأولوية لأسعار شركتك — عند التحليل، تُطبق أسعارك أولاً. إن لم توجد خامة، تُستخدم قاعدة السوق تلقائياً.</span>
        </div>
      )}

      {/* Search */}
      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 ابحث في الخامات..."
        style={{ width: "100%", background: C.navyLight, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 14px", color: C.text, fontSize: 14, marginBottom: 16, fontFamily: "'Cairo', sans-serif", outline: "none" }} />

      {/* Table */}
      <div style={{ background: C.navyCard, borderRadius: 12, border: `1px solid ${C.border}`, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr auto", gap: 0, background: C.navyMid, padding: "12px 20px", borderBottom: `1px solid ${C.border}` }}>
          {["اسم الخامة / المصنعية", "التصنيف", "الوحدة", "السعر (ج.م)", ""].map((h, i) => (
            <span key={i} style={{ fontSize: 12, fontWeight: 700, color: C.textMuted, textAlign: i === 4 ? "center" : "right" }}>{h}</span>
          ))}
        </div>
        {filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: C.textMuted }}>
            {dbLoading && activeView === "global" ? "⏳ جاري تحميل الأسعار من قاعدة البيانات..." : activeView === "private" ? "لا توجد خامات خاصة بعد. أضف خاماتك الآن ←" : "لا توجد نتائج"}
          </div>
        ) : filtered.map((item, i) => (
          <div key={item.id} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr auto", gap: 0, padding: "12px 20px", borderBottom: i < filtered.length - 1 ? `1px solid ${C.border}` : "none", alignItems: "center", transition: "background 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.background = C.navyLight}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            <div>
              <span style={{ color: C.text, fontSize: 14, fontWeight: 600 }}>{item.name}</span>
              <Badge color={item.type === "خامة" ? C.accent : C.gold}>{item.type}</Badge>
            </div>
            <span style={{ color: C.textMuted, fontSize: 13 }}>{item.category}</span>
            <span style={{ color: C.textMuted, fontSize: 13 }}>{item.unit}</span>
            <span style={{ color: C.gold, fontWeight: 700, fontSize: 14 }}>{item.price.toLocaleString("ar-EG")}</span>
            <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
              {activeView === "private" ? (
                <>
                  <button onClick={() => handleEdit(item)} style={{ background: `${C.accent}20`, border: `1px solid ${C.accent}40`, color: C.accent, borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 12, fontFamily: "'Cairo', sans-serif" }}>تعديل</button>
                  <button onClick={() => handleDelete(item.id)} style={{ background: `${C.danger}20`, border: `1px solid ${C.danger}40`, color: C.danger, borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 12, fontFamily: "'Cairo', sans-serif" }}>حذف</button>
                </>
              ) : <span style={{ color: C.textDim, fontSize: 12 }}>🔒</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Form Modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)}>
        <h3 style={{ color: C.text, fontSize: 18, fontWeight: 800, marginBottom: 20 }}>{editId ? "تعديل خامة" : "إضافة خامة جديدة"}</h3>
        <Input label="اسم الخامة / المصنعية" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="مثال: خرسانة جاهزة C30 مضافات" />
        <Input label="التصنيف" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="مثال: خرسانة، مباني، تشطيب" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Input label="الوحدة" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} placeholder="م³ / م² / طن" />
          <Input label="السعر (ج.م)" type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="0" />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 13, color: C.textMuted, marginBottom: 6, display: "block", fontWeight: 600 }}>النوع</label>
          <div style={{ display: "flex", gap: 10 }}>
            {["خامة", "مصنعية"].map(t => (
              <button key={t} onClick={() => setForm(f => ({ ...f, type: t }))}
                style={{ padding: "8px 20px", borderRadius: 8, border: `1px solid ${form.type === t ? C.gold : C.border}`, background: form.type === t ? `${C.gold}20` : "transparent", color: form.type === t ? C.gold : C.textMuted, fontFamily: "'Cairo', sans-serif", cursor: "pointer", fontWeight: 600, fontSize: 14 }}>
                {t}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <Btn onClick={handleSave}>حفظ</Btn>
          <Btn variant="ghost" onClick={() => setShowForm(false)}>إلغاء</Btn>
        </div>
      </Modal>
    </div>
  );
};

// ============================================================
// EXCEL PARSER (SheetJS) + AI SHEET READER
// ============================================================
const XLSX_CDN = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";

const loadXLSX = () => new Promise((resolve, reject) => {
  if (window.XLSX) { resolve(window.XLSX); return; }
  const s = document.createElement("script");
  s.src = XLSX_CDN;
  s.onload = () => resolve(window.XLSX);
  s.onerror = () => reject(new Error("تعذّر تحميل مكتبة قراءة Excel"));
  document.head.appendChild(s);
});

const readExcelFile = async (file) => {
  const XLSX = await loadXLSX();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: "array" });
        const sheets = {};
        wb.SheetNames.forEach(name => {
          const ws = wb.Sheets[name];
          const json = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
          sheets[name] = json;
        });
        resolve(sheets);
      } catch (err) { reject(err); }
    };
    reader.onerror = () => reject(new Error("فشل قراءة الملف"));
    reader.readAsArrayBuffer(file);
  });
};

// AI prompt to extract BoQ lines from raw sheet data (any format)
const SHEET_PARSER_PROMPT = `أنت محلل مقايسات محترف. سيتم إعطاؤك بيانات خام من ملف Excel (جدول مقايسة إنشائية) بأي شكل كان.
مهمتك: استخرج كل بنود العمل القابلة للتسعير وأرجعها كـ JSON فقط بدون أي نص إضافي.

قواعد الاستخراج:
1. تجاهل رؤوس الجداول، والعناوين التزيينية، والمجاميع، والملاحظات الإدارية.
2. كل بند يجب أن يحتوي: وصف العمل + الكمية + الوحدة (إذا وُجدا في الشيت).
3. إذا لم تجد كمية لبند ما، اجعل quantity = null.
4. ادمج الوصف والمواصفة في حقل description واحد واضح ومفيد للتسعير.
5. تجاهل الصفوف الفارغة والأرقام المتسلسلة فقط.

أرجع JSON بهذا الشكل فقط:
{
  "items": [
    {"description": "وصف البند الكامل", "quantity": 50, "unit": "م³"},
    {"description": "وصف البند الثاني", "quantity": null, "unit": "م²"}
  ],
  "sheetName": "اسم الشيت",
  "totalFound": 5
}`;

// ============================================================
// TAB: UPLOAD & ANALYZE BoQ
// ============================================================
const UploadTab = ({ onAnalysisComplete, globalDB = [] }) => {
  const [inputMode, setInputMode] = useState("excel"); // "excel" | "text"
  const [boqText, setBoqText] = useState("");
  const [excelFile, setExcelFile] = useState(null);
  const [extractedItems, setExtractedItems] = useState([]); // parsed from Excel by AI
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState(""); // "reading" | "extracting" | "pricing"
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);


  // ── Robust JSON extractor ───────────────────────────────────
  const extractJSON = (text) => {
    try { return JSON.parse(text.trim()); } catch {}
    const stripped = text.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
    try { return JSON.parse(stripped); } catch {}
    const match = stripped.match(/\{[\s\S]*\}/);
    if (match) { try { return JSON.parse(match[0]); } catch {} }
    throw new Error("\u062a\u0639\u0630\u0651\u0631 \u062a\u062d\u0644\u064a\u0644 \u0631\u062f \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064a \u2014 \u0627\u0644\u0631\u062f \u0644\u0645 \u064a\u0643\u0646 JSON \u0635\u062d\u064a\u062d\u0627\u064b");
  };

  // ── Step 1: Read Excel → AI extracts BoQ lines ──────────────
  const extractItemsFromSheet = async (sheets) => {
    const sheetName = Object.keys(sheets)[0];
    const rows = sheets[sheetName];
    const rowsText = rows.slice(0, 200)
      .map((row, i) => `[${i}] ${row.filter(c => c !== "" && c != null).join(" | ")}`)
      .filter(r => r.replace(/\[\d+\]\s*/, "").trim().length > 2)
      .join("\n");
    const prompt = `${SHEET_PARSER_PROMPT}\n\n\u0627\u0633\u0645 \u0627\u0644\u0634\u064a\u062a: "${sheetName}"\n\n\u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u0634\u064a\u062a:\n${rowsText}`;
    const res = await fetch("/api/parse-sheet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [{ role: "user", content: prompt }] }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return extractJSON(data.content[0].text).items || [];
  };

  // ── Step 2: Price each item ──────────────────────────────────
  const analyzeItem = async (item, privateDB) => {
    const mergedDB = [...privateDB, ...globalDB.filter(g => !privateDB.find(p => p.name === g.name))];
    const dbContext = mergedDB.slice(0, 35).map(x => `${x.name} (${x.unit}): ${x.price} \u062c.\u0645`).join("\n");
    const lineDesc = item.quantity != null
      ? `${item.description} - \u0627\u0644\u0643\u0645\u064a\u0629: ${item.quantity} ${item.unit || ""}`
      : item.description;
    const qtyNote = item.quantity != null
      ? `\n\n\u062a\u0646\u0628\u064a\u0647 \u062d\u0627\u0633\u0645: \u0627\u0644\u0643\u0645\u064a\u0629 \u0627\u0644\u0645\u062d\u062f\u062f\u0629 \u0645\u0646 \u0627\u0644\u0634\u064a\u062a \u0647\u064a ${item.quantity} ${item.unit || ""}. \u064a\u062c\u0628 \u0623\u0646 \u064a\u0643\u0648\u0646 \u062d\u0642\u0644 quantity \u0641\u064a \u0627\u0644\u0640 JSON = ${item.quantity} \u0628\u0627\u0644\u0636\u0628\u0637.`
      : "";
    const prompt = `${AI_SYSTEM}\n\n\u0642\u0627\u0639\u062f\u0629 \u0627\u0644\u0623\u0633\u0639\u0627\u0631 \u0627\u0644\u0645\u062a\u0627\u062d\u0629:\n${dbContext}\n\n\u0627\u0644\u0628\u0646\u062f: "${lineDesc}"${qtyNote}`;
    const res = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [{ role: "user", content: prompt }] }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    const parsed = extractJSON(data.content[0].text);
    // Hard-enforce: sheet quantity/unit always wins
    if (item.quantity != null) parsed.quantity = item.quantity;
    if (item.unit) parsed.unit = item.unit;
    return parsed;
  };

  const calcCost = (analysis, privateDB) => {
    const mergedDB = [...privateDB, ...globalDB.filter(g => !privateDB.find(p => p.name === g.name))];
    let total = 0;
    const breakdown = (analysis.components || []).map(c => {
      const dbEntry = mergedDB.find(x => x.name.includes(c.name.split(" ")[0]) || c.name.includes(x.name.split(" ")[0]));
      const unitPrice = dbEntry ? dbEntry.price : c.unit_price;
      const qty = (c.qty_per_unit || 1) * (analysis.quantity || 1);
      const cost = qty * unitPrice;
      total += cost;
      return { ...c, unit_price: unitPrice, total_qty: qty, total_cost: cost, source: dbEntry ? (dbEntry.id.startsWith("p") ? "شركتي" : "السوق") : "AI" };
    });
    return { ...analysis, breakdown, totalCost: total };
  };

  // ── Main handler ─────────────────────────────────────────────
  const handleAnalyze = async () => {
    setError(""); setLoading(true); setItems([]); setExtractedItems([]);

    const privateDB = LS.get("boqmate_private_db", []);

    try {
      let boqLines = [];

      if (inputMode === "excel" && excelFile) {
        // Phase 1: Read Excel
        setStage("reading");
        const sheets = await readExcelFile(excelFile);

        // Phase 2: AI extracts BoQ items from raw sheet
        setStage("extracting");
        const extracted = await extractItemsFromSheet(sheets);
        setExtractedItems(extracted);
        boqLines = extracted;
      } else {
        // Text mode fallback
        boqLines = boqText.split("\n").map(l => l.trim()).filter(l => l.length > 10)
          .map(l => ({ description: l, quantity: null, unit: "" }));
      }

      if (boqLines.length === 0) {
        setError("لم يتم العثور على بنود قابلة للتسعير في الملف");
        setLoading(false); return;
      }

      // Phase 3: Price each item
      setStage("pricing");
      const results = [];
      for (let i = 0; i < boqLines.length; i++) {
        setProgress(Math.round(((i + 1) / boqLines.length) * 100));
        try {
          const analysis = await analyzeItem(boqLines[i], privateDB);
          const costed = calcCost(analysis, privateDB);
          results.push({ id: `item_${i}`, raw: boqLines[i].description, ...costed, status: "success" });
        } catch (e) {
          results.push({ id: `item_${i}`, raw: boqLines[i].description, status: "error", error: e.message });
        }
        setItems([...results]);
      }
      onAnalysisComplete(results);
    } catch (e) {
      setError(`خطأ: ${e.message}`);
    } finally {
      setLoading(false); setStage("");
    }
  };

  const handleFileDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer?.files?.[0] || e.target.files?.[0];
    if (file && file.name.endsWith(".xlsx")) { setExcelFile(file); setError(""); }
    else setError("الرجاء رفع ملف .xlsx فقط");
  };

  const stageLabel = { reading: "📖 جاري قراءة ملف Excel...", extracting: "🤖 الذكاء الاصطناعي يستخرج البنود...", pricing: `💰 جاري تسعير البنود... ${progress}%` };

  return (
    <div className="fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: C.text }}>رفع وتحليل المقايسة</h2>
          <p style={{ color: C.textMuted, fontSize: 13, marginTop: 4 }}>ارفع ملف Excel أياً كان شكله — الذكاء الاصطناعي يقرأه ويسعّره تلقائياً</p>
        </div>
        <Badge color={C.accent}>نسخة مجانية</Badge>
      </div>

      {/* Mode Toggle */}
      <div style={{ display: "flex", background: C.navyMid, borderRadius: 10, padding: 4, marginBottom: 20, width: "fit-content", border: `1px solid ${C.border}` }}>
        {[{ k: "excel", label: "📊 رفع Excel" }, { k: "text", label: "✏️ إدخال يدوي" }].map(t => (
          <button key={t.k} onClick={() => setInputMode(t.k)}
            style={{ padding: "8px 22px", borderRadius: 8, border: "none", fontFamily: "'Cairo', sans-serif", fontWeight: 600, fontSize: 14, cursor: "pointer", transition: "all 0.2s", background: inputMode === t.k ? C.gold : "transparent", color: inputMode === t.k ? C.navy : C.textMuted }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Excel Upload Zone */}
      {inputMode === "excel" && (
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleFileDrop}
          style={{ background: dragOver ? `${C.gold}10` : C.navyCard, border: `2px dashed ${dragOver ? C.gold : excelFile ? C.success : C.border}`, borderRadius: 16, padding: "48px 24px", marginBottom: 20, textAlign: "center", transition: "all 0.25s", cursor: "pointer", position: "relative" }}
          onClick={() => document.getElementById("xlsx-input").click()}>
          <input id="xlsx-input" type="file" accept=".xlsx" onChange={handleFileDrop} style={{ display: "none" }} />
          {excelFile ? (
            <>
              <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
              <div style={{ color: C.success, fontWeight: 700, fontSize: 16, marginBottom: 6 }}>{excelFile.name}</div>
              <div style={{ color: C.textMuted, fontSize: 13 }}>{(excelFile.size / 1024).toFixed(1)} KB • انقر لتغيير الملف</div>
              <button onClick={e => { e.stopPropagation(); setExcelFile(null); setExtractedItems([]); setItems([]); }}
                style={{ marginTop: 12, background: `${C.danger}20`, border: `1px solid ${C.danger}40`, color: C.danger, borderRadius: 8, padding: "6px 16px", cursor: "pointer", fontFamily: "'Cairo', sans-serif", fontSize: 13 }}>
                ✕ إزالة الملف
              </button>
            </>
          ) : (
            <>
              <div style={{ fontSize: 52, marginBottom: 16 }}>📊</div>
              <div style={{ color: C.text, fontWeight: 700, fontSize: 16, marginBottom: 8 }}>اسحب ملف Excel هنا أو انقر للاختيار</div>
              <div style={{ color: C.textMuted, fontSize: 13, lineHeight: 1.8 }}>
                يدعم .xlsx بأي شكل: جدول BoQ كامل، قائمة بنود، أو تنسيق مكتبي<br />
                <span style={{ color: C.gold }}>الذكاء الاصطناعي سيفهم شكل الشيت تلقائياً ✨</span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Text Fallback */}
      {inputMode === "text" && (
        <div style={{ background: C.navyCard, borderRadius: 12, padding: 20, marginBottom: 20, border: `1px solid ${C.border}` }}>
          <label style={{ fontSize: 13, color: C.textMuted, marginBottom: 8, display: "block", fontWeight: 600 }}>📋 بنود المقايسة (كل بند في سطر)</label>
          <textarea value={boqText} onChange={e => setBoqText(e.target.value)} rows={8}
            placeholder={"أمثلة:\nتوريد وصب خرسانة مسلحة C25 للأعمدة - 50 م³\nبناء حوائط طوب أبيض 25 سم - 200 م²\nفرد بلاط سيراميك 60×60 - 150 م²\nدهانات داخلية طبقتين - 300 م²"}
            style={{ width: "100%", background: C.navyMid, border: `1px solid ${C.border}`, borderRadius: 8, padding: "12px 14px", color: C.text, fontSize: 14, resize: "vertical", fontFamily: "'Cairo', sans-serif", lineHeight: 2, outline: "none", direction: "rtl" }} />
        </div>
      )}

      {error && (
        <div style={{ background: `${C.danger}20`, border: `1px solid ${C.danger}40`, borderRadius: 8, padding: "10px 16px", color: C.danger, marginBottom: 16, fontSize: 14 }}>⚠️ {error}</div>
      )}

      {/* Progress */}
      {loading && (
        <div style={{ background: C.navyCard, borderRadius: 12, padding: 20, marginBottom: 20, border: `1px solid ${C.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
            <div className="spin" style={{ width: 20, height: 20, border: `2px solid ${C.border}`, borderTop: `2px solid ${C.gold}`, borderRadius: "50%" }} />
            <span style={{ color: C.text, fontWeight: 600, fontSize: 15 }}>{stageLabel[stage] || "جاري المعالجة..."}</span>
          </div>
          {stage === "pricing" && (
            <>
              <div style={{ height: 6, background: C.navyMid, borderRadius: 4, overflow: "hidden", marginBottom: 8 }}>
                <div style={{ height: "100%", width: `${progress}%`, background: `linear-gradient(90deg, ${C.gold}, ${C.goldLight})`, borderRadius: 4, transition: "width 0.4s ease" }} />
              </div>
              <div style={{ color: C.textMuted, fontSize: 12 }}>تم تسعير {Math.round((progress / 100) * items.length + 0.5)} من {extractedItems.length} بند</div>
            </>
          )}
          {stage === "extracting" && extractedItems.length === 0 && (
            <div style={{ color: C.textMuted, fontSize: 13 }}>يقرأ الذكاء الاصطناعي هيكل الشيت ويستخرج البنود...</div>
          )}
        </div>
      )}

      {/* Extracted preview (after sheet parsing, before pricing) */}
      {extractedItems.length > 0 && items.length === 0 && !loading && (
        <div style={{ background: `${C.success}10`, border: `1px solid ${C.success}40`, borderRadius: 12, padding: 20, marginBottom: 20 }}>
          <div style={{ color: C.success, fontWeight: 700, marginBottom: 12 }}>✅ تم استخراج {extractedItems.length} بند من الملف</div>
          {extractedItems.slice(0, 5).map((it, i) => (
            <div key={i} style={{ color: C.textMuted, fontSize: 13, padding: "4px 0", borderBottom: `1px solid ${C.border}` }}>
              {i + 1}. {it.description}{it.quantity ? ` — ${it.quantity} ${it.unit}` : ""}
            </div>
          ))}
          {extractedItems.length > 5 && <div style={{ color: C.textDim, fontSize: 12, marginTop: 8 }}>+ {extractedItems.length - 5} بند آخر...</div>}
        </div>
      )}

      <Btn
        onClick={handleAnalyze}
        disabled={loading || (inputMode === "excel" && !excelFile) || (inputMode === "text" && !boqText.trim())}
        size="lg">
        {loading ? stageLabel[stage] || "⏳ جاري المعالجة..." : inputMode === "excel" ? "🚀 رفع وتسعير المقايسة" : "🔍 تحليل وتسعير البنود"}
      </Btn>

      {/* Results */}
      {items.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text }}>نتائج التحليل ({items.length} بند)</h3>
            {loading && <div className="spin" style={{ width: 16, height: 16, border: `2px solid ${C.border}`, borderTop: `2px solid ${C.gold}`, borderRadius: "50%" }} />}
          </div>
          {items.map(item => <ItemCard key={item.id} item={item} />)}
        </div>
      )}
    </div>
  );
};

const ItemCard = ({ item }) => {
  const [open, setOpen] = useState(false);
  if (item.status === "error") return (
    <div style={{ background: `${C.danger}15`, border: `1px solid ${C.danger}30`, borderRadius: 10, padding: "14px 18px", marginBottom: 12 }}>
      <div style={{ color: C.danger, fontSize: 14, fontWeight: 600 }}>❌ {item.raw}</div>
      <div style={{ color: C.textMuted, fontSize: 12, marginTop: 4 }}>{item.error}</div>
    </div>
  );
  return (
    <div style={{ background: C.navyCard, border: `1px solid ${C.border}`, borderRadius: 12, marginBottom: 12, overflow: "hidden" }}>
      <div onClick={() => setOpen(!open)} style={{ padding: "16px 20px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ flex: 1 }}>
          <div style={{ color: C.text, fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{item.itemName || item.raw}</div>
          <div style={{ color: C.textMuted, fontSize: 13 }}>{item.quantity} {item.unit} • {(item.breakdown || []).length} مكون</div>
        </div>
        <div style={{ textAlign: "left", marginRight: 16 }}>
          <div style={{ color: C.gold, fontSize: 18, fontWeight: 900 }}>{formatEGP(item.totalCost)}</div>
          <div style={{ color: C.textMuted, fontSize: 12 }}>إجمالي البند</div>
        </div>
        <span style={{ color: C.textMuted, marginRight: 8 }}>{open ? "▲" : "▼"}</span>
      </div>
      {open && item.breakdown && (
        <div style={{ padding: "0 20px 16px", borderTop: `1px solid ${C.border}` }}>
          <div style={{ marginTop: 12, overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: C.navyMid }}>
                  {["المكون", "النوع", "الكمية", "الوحدة", "سعر الوحدة", "الإجمالي", "المصدر"].map(h => (
                    <th key={h} style={{ padding: "8px 12px", color: C.textMuted, fontWeight: 600, textAlign: "right", border: `1px solid ${C.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {item.breakdown.map((c, i) => (
                  <tr key={i}>
                    <td style={{ padding: "8px 12px", color: C.text, border: `1px solid ${C.border}` }}>{c.name}</td>
                    <td style={{ padding: "8px 12px", border: `1px solid ${C.border}` }}><Badge color={c.type === "خامة" ? C.accent : C.gold}>{c.type}</Badge></td>
                    <td style={{ padding: "8px 12px", color: C.text, border: `1px solid ${C.border}` }}>{c.total_qty?.toFixed(2)}</td>
                    <td style={{ padding: "8px 12px", color: C.textMuted, border: `1px solid ${C.border}` }}>{c.unit}</td>
                    <td style={{ padding: "8px 12px", color: C.textMuted, border: `1px solid ${C.border}` }}>{c.unit_price?.toLocaleString("ar-EG")}</td>
                    <td style={{ padding: "8px 12px", color: C.gold, fontWeight: 700, border: `1px solid ${C.border}` }}>{formatEGP(c.total_cost)}</td>
                    <td style={{ padding: "8px 12px", border: `1px solid ${C.border}` }}><Badge color={c.source === "شركتي" ? C.success : c.source === "AI" ? C.warning : C.textMuted}>{c.source}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {item.notes && <div style={{ marginTop: 12, padding: "10px 14px", background: `${C.accent}10`, borderRadius: 8, color: C.accent, fontSize: 13 }}>💡 {item.notes}</div>}
        </div>
      )}
    </div>
  );
};

// ============================================================
// TAB: REPORTS
// ============================================================
// Free-plan fixed additions
const FREE_ADDITIONS = [
  { label: "هامش الربح", pct: 15 },
  { label: "المصاريف الإدارية", pct: 5 },
];

const ReportsTab = ({ analysisResults }) => {
  const [paywallOpen, setPaywallOpen] = useState(false);
  // additions = FREE_ADDITIONS for free plan (read from LS to reflect Settings page)
  const additions = LS.get("boqmate_additions", FREE_ADDITIONS);

  const successItems = analysisResults.filter(i => i.status === "success");
  const subtotal = successItems.reduce((s, i) => s + (i.totalCost || 0), 0);
  const additionsTotal = additions.reduce((s, a) => s + subtotal * (a.pct / 100), 0);
  const vat = (subtotal + additionsTotal) * 0.14;
  const total = subtotal + additionsTotal + vat;

  if (successItems.length === 0) return (
    <div className="fade-in" style={{ textAlign: "center", padding: "80px 20px" }}>
      <div style={{ fontSize: 64, marginBottom: 20 }}>📊</div>
      <h2 style={{ color: C.text, fontSize: 20, fontWeight: 700, marginBottom: 12 }}>لا توجد تقارير بعد</h2>
      <p style={{ color: C.textMuted }}>قم بتحليل مقايسة أولاً من تبويب "رفع المقايسة"</p>
    </div>
  );

  return (
    <div className="fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: C.text }}>التقرير النهائي</h2>
          <p style={{ color: C.textMuted, fontSize: 13, marginTop: 4 }}>ملخص التكاليف مع الهوامش والضرائب</p>
        </div>
        <Btn variant="accent" size="lg" onClick={() => setPaywallOpen(true)}>
          📥 تصدير Excel / PDF
        </Btn>
      </div>

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 28 }}>
        {[
          { label: "عدد البنود", value: successItems.length, unit: "بند", color: C.accent },
          { label: "تكلفة مباشرة", value: formatEGP(subtotal), color: C.text },
          { label: "إجمالي شامل", value: formatEGP(total), color: C.gold, big: true },
        ].map((c, i) => (
          <div key={i} style={{ background: c.big ? `linear-gradient(135deg, ${C.gold}20, ${C.goldDark}10)` : C.navyCard, border: `1px solid ${c.big ? C.gold + "60" : C.border}`, borderRadius: 14, padding: "20px 24px" }}>
            <div style={{ color: C.textMuted, fontSize: 13, marginBottom: 8 }}>{c.label}</div>
            <div style={{ color: c.color, fontSize: c.big ? 24 : 20, fontWeight: 900 }}>{c.value}</div>
            {c.unit && <div style={{ color: C.textMuted, fontSize: 12 }}>{c.unit}</div>}
          </div>
        ))}
      </div>

      {/* Items Breakdown */}
      <div style={{ background: C.navyCard, borderRadius: 14, border: `1px solid ${C.border}`, marginBottom: 24, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.border}`, background: C.navyMid }}>
          <span style={{ color: C.text, fontWeight: 700, fontSize: 15 }}>تفاصيل البنود</span>
        </div>
        {successItems.map((item, i) => (
          <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderBottom: i < successItems.length - 1 ? `1px solid ${C.border}` : "none" }}>
            <div>
              <div style={{ color: C.text, fontWeight: 600, fontSize: 14 }}>{item.itemName || item.raw}</div>
              <div style={{ color: C.textMuted, fontSize: 12, marginTop: 2 }}>{item.quantity} {item.unit}</div>
            </div>
            <div style={{ color: C.gold, fontWeight: 700, fontSize: 15 }}>{formatEGP(item.totalCost)}</div>
          </div>
        ))}
      </div>

      {/* Cost Summary */}
      <div style={{ background: C.navyCard, borderRadius: 14, border: `1px solid ${C.border}`, padding: 24 }}>
        <h3 style={{ color: C.text, fontWeight: 700, marginBottom: 20, fontSize: 16 }}>ملخص التكلفة الإجمالية</h3>
        {/* Direct cost row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: `1px solid ${C.border}` }}>
          <span style={{ color: C.text, fontSize: 14 }}>التكلفة المباشرة (خامات + مصنعيات)</span>
          <span style={{ color: C.text, fontSize: 14, fontWeight: 600 }}>{formatEGP(subtotal)}</span>
        </div>
        {/* Dynamic additions rows */}
        {additions.map((row, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: `1px solid ${C.border}` }}>
            <span style={{ color: C.textMuted, fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}>
              {row.label} ({row.pct}%) <span style={{ fontSize: 16 }}>🔒</span>
            </span>
            <span style={{ color: C.textMuted, fontSize: 14, fontWeight: 600 }}>{formatEGP(subtotal * (row.pct / 100))}</span>
          </div>
        ))}
        {/* VAT */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: `1px solid ${C.border}` }}>
          <span style={{ color: C.text, fontSize: 14 }}>ضريبة القيمة المضافة (14%)</span>
          <span style={{ color: C.text, fontSize: 14, fontWeight: 600 }}>{formatEGP(vat)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 0 0" }}>
          <span style={{ color: C.gold, fontSize: 18, fontWeight: 800 }}>الإجمالي الكلي شامل الضرائب</span>
          <span style={{ color: C.gold, fontSize: 22, fontWeight: 900 }}>{formatEGP(total)}</span>
        </div>
      </div>

      <PaywallModal open={paywallOpen} onClose={() => setPaywallOpen(false)} type="export" />
    </div>
  );
};

// ============================================================
// TAB: SETTINGS
// ============================================================
const SettingsTab = ({ isPro = false }) => {
  const [paywallOpen, setPaywallOpen] = useState(false);
  // Pro additions management (read/write via LS for demo)
  const [additions, setAdditions] = useState(() => LS.get("boqmate_additions", FREE_ADDITIONS));
  const [newLabel, setNewLabel] = useState("");
  const [newPct, setNewPct] = useState("");
  // isPro comes from parent via prop

  const saveAdditions = (list) => { setAdditions(list); LS.set("boqmate_additions", list); };
  const handleAddRow = () => {
    if (!newLabel.trim() || !newPct) return;
    saveAdditions([...additions, { label: newLabel.trim(), pct: parseFloat(newPct) }]);
    setNewLabel(""); setNewPct("");
  };
  const handleDeleteRow = (i) => saveAdditions(additions.filter((_, idx) => idx !== i));
  const handleEditPct = (i, val) => {
    const updated = additions.map((a, idx) => idx === i ? { ...a, pct: parseFloat(val) || 0 } : a);
    saveAdditions(updated);
  };
  const handleEditLabel = (i, val) => {
    const updated = additions.map((a, idx) => idx === i ? { ...a, label: val } : a);
    saveAdditions(updated);
  };

  return (
    <div className="fade-in">
      <h2 style={{ fontSize: 22, fontWeight: 800, color: C.text, marginBottom: 8 }}>الإعدادات</h2>
      <p style={{ color: C.textMuted, fontSize: 13, marginBottom: 28 }}>تخصيص هوامش التسعير وإعدادات شركتك</p>

      {/* Company Info */}
      <div style={{ background: C.navyCard, borderRadius: 14, border: `1px solid ${C.border}`, padding: 24, marginBottom: 20 }}>
        <h3 style={{ color: C.text, fontWeight: 700, marginBottom: 20, fontSize: 15 }}>🏢 بيانات الشركة</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Input label="اسم الشركة" placeholder="مثال: المكتب العربي للتشييد والبناء" />
          <Input label="رقم الضريبة" placeholder="000-000-000" />
          <Input label="العنوان" placeholder="الإسكندرية، مصر" />
          <Input label="رقم الهاتف" placeholder="+20 3 000 0000" />
        </div>
        <div style={{ background: `${C.gold}15`, border: `1px solid ${C.gold}40`, borderRadius: 8, padding: "10px 14px", marginTop: 8 }}>
          <span style={{ color: C.gold, fontSize: 13 }}>🔒 بيانات الشركة تظهر في التقارير المصدَّرة — متاح في النسخة Pro فقط.</span>
        </div>
      </div>

      {/* Additions / Margins */}
      <div style={{ background: C.navyCard, borderRadius: 14, border: `1px solid ${C.border}`, padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <h3 style={{ color: C.text, fontWeight: 700, fontSize: 15 }}>📊 الإضافات على التكلفة المباشرة</h3>
          {isPro
            ? <Badge color={C.gold}>⭐ Pro — تحكم كامل</Badge>
            : <Badge color={C.textMuted}>مجاني — ثابت</Badge>}
        </div>
        <p style={{ color: C.textMuted, fontSize: 13, marginBottom: 20 }}>
          {isPro
            ? "أضف أي إضافة بالمسمى الذي تريده: Overhead، Mobilization، Contingency، هامش ربح، إلخ."
            : "في النسخة المجانية: هامش الربح ثابت 15% والمصاريف الإدارية ثابتة 5%. انقر لترقية للـ Pro للتخصيص الكامل."}
        </p>

        {/* Rows */}
        <div style={{ marginBottom: 16 }}>
          {additions.map((row, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: C.navyMid, borderRadius: 10, marginBottom: 8, border: `1px solid ${C.border}` }}>
              {/* Label */}
              <input
                value={row.label}
                onChange={e => isPro ? handleEditLabel(i, e.target.value) : null}
                readOnly={!isPro}
                onClick={() => !isPro && setPaywallOpen(true)}
                style={{ flex: 2, background: "transparent", border: "none", color: isPro ? C.text : C.textMuted, fontSize: 14, fontFamily: "'Cairo', sans-serif", cursor: isPro ? "text" : "pointer", outline: "none" }}
              />
              {/* Percentage */}
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <input
                  type="number"
                  value={row.pct}
                  onChange={e => isPro ? handleEditPct(i, e.target.value) : null}
                  readOnly={!isPro}
                  onClick={() => !isPro && setPaywallOpen(true)}
                  style={{ width: 60, background: isPro ? C.navyLight : "transparent", border: isPro ? `1px solid ${C.border}` : "none", borderRadius: 6, padding: "4px 8px", color: C.gold, fontWeight: 800, fontSize: 16, textAlign: "center", fontFamily: "'Cairo', sans-serif", cursor: isPro ? "text" : "pointer", outline: "none" }}
                />
                <span style={{ color: C.gold, fontWeight: 700 }}>%</span>
              </div>
              {/* Lock / Delete */}
              {isPro ? (
                <button onClick={() => handleDeleteRow(i)}
                  style={{ background: `${C.danger}20`, border: `1px solid ${C.danger}40`, color: C.danger, borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 12, fontFamily: "'Cairo', sans-serif", flexShrink: 0 }}>
                  حذف
                </button>
              ) : (
                <span onClick={() => setPaywallOpen(true)} style={{ fontSize: 20, cursor: "pointer" }}>🔒</span>
              )}
            </div>
          ))}
        </div>

        {/* Add new row — Pro only */}
        {isPro ? (
          <div style={{ display: "flex", gap: 10, alignItems: "center", padding: "12px 14px", background: `${C.success}10`, border: `1px dashed ${C.success}50`, borderRadius: 10 }}>
            <input value={newLabel} onChange={e => setNewLabel(e.target.value)} placeholder="مسمى الإضافة (مثال: Overhead)"
              style={{ flex: 2, background: C.navyLight, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 12px", color: C.text, fontSize: 14, fontFamily: "'Cairo', sans-serif", outline: "none" }} />
            <input type="number" value={newPct} onChange={e => setNewPct(e.target.value)} placeholder="%" min="0" max="100"
              style={{ width: 70, background: C.navyLight, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 10px", color: C.gold, fontWeight: 700, fontSize: 15, textAlign: "center", fontFamily: "'Cairo', sans-serif", outline: "none" }} />
            <Btn onClick={handleAddRow} size="sm">+ إضافة</Btn>
          </div>
        ) : (
          <div onClick={() => setPaywallOpen(true)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", background: `${C.gold}08`, border: `1px dashed ${C.gold}50`, borderRadius: 10, cursor: "pointer" }}>
            <span style={{ fontSize: 20 }}>➕</span>
            <div>
              <div style={{ color: C.gold, fontWeight: 600, fontSize: 14 }}>إضافة بند جديد (Overhead، Mobilization، Contingency...)</div>
              <div style={{ color: C.textMuted, fontSize: 12, marginTop: 2 }}>متاح في النسخة Pro — انقر للترقية</div>
            </div>
            <span style={{ marginRight: "auto", fontSize: 20 }}>🔒</span>
          </div>
        )}

        <div style={{ background: `${C.accent}10`, border: `1px solid ${C.accent}30`, borderRadius: 8, padding: "10px 14px", marginTop: 16 }}>
          <span style={{ color: C.accent, fontSize: 13 }}>💡 ضريبة القيمة المضافة (14%) مطبقة تلقائياً وفق اللوائح المصرية وغير قابلة للحذف.</span>
        </div>
      </div>

      <PaywallModal open={paywallOpen} onClose={() => setPaywallOpen(false)} type="margins" />
    </div>
  );
};

// ============================================================
// MAIN APP
// ============================================================
export default function BoQmate() {
  const [tab, setTab] = useState("upload");
  const [analysisResults, setAnalysisResults] = useState([]);
  const [globalDB, setGlobalDB] = useState([]);
  const [dbLoading, setDbLoading] = useState(true);
  const [isPro, setIsPro] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    // سحب أسعار السوق
    fetch("/api/prices")
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) { setGlobalDB(data); GLOBAL_DB = data; }
      })
      .catch(e => console.error("فشل تحميل الأسعار:", e))
      .finally(() => setDbLoading(false));

    // التحقق من Pro status
    fetch("/api/pro-status")
      .then(r => r.json())
      .then(data => { setIsPro(data.isPro || false); setUserEmail(data.email || ""); })
      .catch(() => {});
  }, []);

  const tabs = [
    { id: "upload", label: "رفع المقايسة", icon: "📋" },
    { id: "prices", label: "إدارة الأسعار", icon: "💰" },
    { id: "reports", label: "التقارير", icon: "📊" },
    { id: "settings", label: "الإعدادات", icon: "⚙️" },
  ];

  return (
    <>
      <GlobalStyle />
      <div style={{ minHeight: "100vh", background: C.navy, direction: "rtl" }}>
        {/* Navbar */}
        <nav style={{ background: C.navyMid, borderBottom: `1px solid ${C.border}`, padding: "0 32px", position: "sticky", top: 0, zIndex: 100, backdropFilter: "blur(12px)" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
            {/* Logo */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div dangerouslySetInnerHTML={{ __html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="108 48 90 105" width="26" height="30"><g fill="#C67D4E" transform="matrix(1.0065966844558716,0,0,1.0065966844558716,99.818833649152,56.64806114538712)"><path d="m83.3 26.3-10-.7v-8.9c0-1.1-.9-2-2-2H28.7c-1.1 0-2 .9-2 2v8.9l-10 .7c-.5 0-1 .3-1.4.7-.3.4-.5.9-.5 1.5l3.8 54.9c.1 1.1 1 1.9 2 1.9h.1l29.1-2 29.1 2h.1c.5 0 .9-.2 1.3-.5s.6-.8.7-1.4l3.8-54.9c.4-1.1-.4-2.1-1.5-2.2m-52.6-7.5h38.5v51H30.7zm-8.1 62.3L19 30.2l7.7-.5v42.2c0 1.1.9 2 2 2h6.6l-.4 6.3v.1zm54.8 0L39 78.4l.3-4.6h31.9c1.1 0 2-.9 2-2V29.6l7.7.5z"></path><path d="M61.7 25.3H38.3c-1.1 0-2 .9-2 2s.9 2 2 2h23.4c1.1 0 2-.9 2-2s-.9-2-2-2m0 8.5H38.3c-1.1 0-2 .9-2 2s.9 2 2 2h23.4c1.1 0 2-.9 2-2s-.9-2-2-2m0 8.5H38.3c-1.1 0-2 .9-2 2s.9 2 2 2h23.4c1.1 0 2-.9 2-2s-.9-2-2-2m0 8.5H38.3c-1.1 0-2 .9-2 2s.9 2 2 2h23.4c1.1 0 2-.9 2-2s-.9-2-2-2m0 8.5H38.3c-1.1 0-2 .9-2 2s.9 2 2 2h23.4c1.1 0 2-.9 2-2s-.9-2-2-2"></path></g></svg>` }} style={{ display: "flex", alignItems: "center", flexShrink: 0 }} />
              <div dangerouslySetInnerHTML={{ __html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="15 138 272 72" width="116" height="30"><g transform="matrix(4.34782600402832,0,0,4.34782600402832,17.304347770963247,145.64119438359015)"><path fill="#ffffff" d="M6.40 14.06C7.67 14.06 8.32 13.40 8.32 12.08L8.32 10.26C8.32 9.42 7.95 8.92 7.11 8.74C7.91 8.60 8.29 8.05 8.29 7.08L8.29 5.40C8.29 4.07 7.64 3.42 6.36 3.42L0.62 3.42L0.62 14.06ZM5.91 11.03C5.91 11.31 5.77 11.45 5.49 11.45L3.04 11.45L3.04 9.80L5.49 9.80C5.77 9.80 5.91 9.94 5.91 10.22ZM5.91 7.24C5.91 7.52 5.77 7.66 5.49 7.66L3.04 7.66L3.04 6.02L5.49 6.02C5.77 6.02 5.91 6.16 5.91 6.44ZM14.71 10.96C14.71 11.24 14.57 11.38 14.29 11.38L12.28 11.38C12.00 11.38 11.86 11.24 11.86 10.96L11.86 6.51C11.86 6.23 12.00 6.09 12.28 6.09L14.29 6.09C14.57 6.09 14.71 6.23 14.71 6.51ZM15.20 14.06C16.49 14.06 17.12 13.44 17.12 12.19L17.12 5.36C17.12 4.06 16.49 3.42 15.20 3.42L11.35 3.42C10.08 3.42 9.44 4.06 9.44 5.36L9.44 12.19C9.44 13.44 10.08 14.06 11.35 14.06ZM25.19 15.79L26.60 14.34L25.65 13.36C25.83 13.06 25.93 12.67 25.93 12.19L25.93 5.36C25.93 4.06 25.28 3.42 24.01 3.42L20.16 3.42C18.89 3.42 18.24 4.06 18.24 5.36L18.24 12.19C18.24 13.44 18.89 14.06 20.16 14.06L23.41 14.06ZM23.52 10.96C23.52 11.24 23.38 11.38 23.10 11.38L21.08 11.38C20.80 11.38 20.66 11.24 20.66 10.96L20.66 6.51C20.66 6.23 20.80 6.09 21.08 6.09L23.10 6.09C23.38 6.09 23.52 6.23 23.52 6.51Z"/><path fill="#C67D4E" d="M38.12 14.06L38.12 7.78C38.12 6.48 37.49 5.84 36.22 5.84L28.99 5.84C27.72 5.84 27.08 6.48 27.08 7.77L27.08 14.06L29.47 14.06L29.47 8.69C29.47 8.41 29.61 8.27 29.89 8.27L31.40 8.27L31.40 14.06L33.80 14.06L33.80 8.27L35.34 8.27C35.60 8.27 35.76 8.41 35.76 8.69L35.76 14.06ZM44.21 11.52C44.21 11.70 44.11 11.80 43.93 11.80L41.89 11.80C41.71 11.80 41.61 11.70 41.61 11.52L41.61 10.95C41.61 10.77 41.71 10.67 41.89 10.67L43.93 10.67C44.11 10.67 44.21 10.77 44.21 10.95ZM44.74 14.06C46.00 14.06 46.63 13.41 46.63 12.12L46.63 7.77C46.63 6.48 45.98 5.84 44.67 5.84L39.52 5.84L39.52 8.13L43.79 8.13C44.07 8.13 44.21 8.27 44.21 8.55L44.21 9.17C44.09 9.11 43.93 9.07 43.75 9.07L40.99 9.07C39.80 9.07 39.20 9.70 39.20 10.98L39.20 12.19C39.20 13.44 39.80 14.06 40.99 14.06ZM52.12 14.06L52.12 11.63L50.60 11.63C50.36 11.63 50.23 11.48 50.23 11.16L50.23 8.13L52.14 8.13L52.14 5.92L50.23 5.92L50.23 3.56L47.81 3.56L47.81 12.25C47.81 13.45 48.48 14.06 49.81 14.06ZM58.02 8.95C58.02 9.13 57.92 9.23 57.74 9.23L55.69 9.23C55.51 9.23 55.41 9.13 55.41 8.95L55.41 8.37C55.41 8.19 55.51 8.09 55.69 8.09L57.74 8.09C57.92 8.09 58.02 8.19 58.02 8.37ZM60.07 14.06L60.07 11.76L55.83 11.76C55.55 11.76 55.41 11.62 55.41 11.34L55.41 10.72C55.54 10.79 55.69 10.82 55.85 10.82L58.63 10.82C59.82 10.82 60.42 10.19 60.42 8.92L60.42 7.71C60.42 6.47 59.82 5.84 58.63 5.84L54.88 5.84C53.62 5.84 52.99 6.48 52.99 7.77L52.99 12.12C52.99 13.41 53.65 14.06 54.95 14.06Z"/></g></svg>` }} style={{ display: "flex", alignItems: "center" }} />
              <Badge color={C.accent}>Beta</Badge>
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", gap: 4 }}>
              {tabs.map(t => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  style={{ padding: "8px 18px", border: "none", borderRadius: 8, fontFamily: "'Cairo', sans-serif", fontWeight: 600, fontSize: 14, cursor: "pointer", transition: "all 0.2s", background: tab === t.id ? `${C.gold}20` : "transparent", color: tab === t.id ? C.gold : C.textMuted, borderBottom: tab === t.id ? `2px solid ${C.gold}` : "2px solid transparent" }}>
                  {t.icon} {t.label}
                  {t.id === "reports" && analysisResults.filter(r => r.status === "success").length > 0 && (
                    <span style={{ background: C.gold, color: C.navy, borderRadius: 10, padding: "1px 7px", fontSize: 11, marginRight: 6, fontWeight: 800 }}>
                      {analysisResults.filter(r => r.status === "success").length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* CTA */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {isPro ? (
                <span style={{ background: `${C.gold}20`, color: C.gold, border: `1px solid ${C.gold}40`, borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 700 }}>
                  ⭐ Pro
                </span>
              ) : (
                <Btn onClick={() => {}} size="sm">⭐ ترقية Pro</Btn>
              )}
              {userEmail && (
                <button onClick={() => { document.cookie = "sb-access-token=; Max-Age=0; path=/"; document.cookie = "sb-refresh-token=; Max-Age=0; path=/"; window.location.href = "/login"; }}
                  style={{ background: "transparent", border: `1px solid ${C.border}`, color: C.textMuted, borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 12, fontFamily: "'Cairo', sans-serif" }}>
                  خروج
                </button>
              )}
            </div>
          </div>
        </nav>

        {/* Content */}
        <main style={{ maxWidth: 1100, margin: "0 auto", padding: "36px 32px" }}>
          {tab === "upload" && <UploadTab onAnalysisComplete={setAnalysisResults} globalDB={globalDB} />}
          {tab === "prices" && <PriceManagementTab globalDB={globalDB} dbLoading={dbLoading} />}
          {tab === "reports" && <ReportsTab analysisResults={analysisResults} />}
          {tab === "settings" && <SettingsTab isPro={isPro} />}
        </main>

        {/* Footer */}
        <footer style={{ borderTop: `1px solid ${C.border}`, padding: "20px 32px", textAlign: "center" }}>
          <span style={{ color: C.textDim, fontSize: 13 }}>
            BoQmate © 2025 — منصة تسعير ذكية للسوق المصري والخليجي •{" "}
            <span style={{ color: C.gold }}>النسخة المجانية</span>
          </span>
        </footer>
      </div>
    </>
  );
}
