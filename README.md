# BoQmate 🏗️
منصة تسعير مقايسات ذكية للسوق المصري والخليجي

---

## هيكل المشروع

```
boqmate/
├── app/
│   ├── layout.js              ← Root layout
│   ├── page.jsx               ← الـ Frontend (React)
│   └── api/
│       ├── analyze/
│       │   └── route.js       ← Proxy لتسعير البنود
│       └── parse-sheet/
│           └── route.js       ← Proxy لقراءة الشيت
├── .env.local                 ← الـ API Key (لا يُرفع على GitHub)
├── .gitignore
├── next.config.js
└── package.json
```

---

## Deploy على Vercel (خطوة بخطوة)

### 1. حضّر المشروع محلياً
```bash
npm install
npm run dev        # شغّله على http://localhost:3000
```

### 2. ارفع على GitHub
```bash
git init
git add .
git commit -m "Initial BoQmate"
git remote add origin https://github.com/username/boqmate.git
git push -u origin main
```
> تأكد إن `.env.local` **مش مرفوع** — الـ .gitignore بيحميه تلقائياً

### 3. اربط Vercel بـ GitHub
1. روح على [vercel.com](https://vercel.com) وسجّل دخول
2. اضغط **"Add New Project"**
3. اختار الـ repo بتاع BoQmate
4. اضغط **"Deploy"**

### 4. أضف الـ API Key في Vercel
1. بعد الـ deploy، روح **Settings → Environment Variables**
2. أضف:
   - **Name:** `ANTHROPIC_API_KEY`
   - **Value:** مفتاحك من console.anthropic.com
   - **Environments:** Production + Preview + Development ✓
3. اضغط **Save**
4. اضغط **Redeploy** من Deployments

### 5. جاهز ✅
التطبيق شغال على `https://boqmate.vercel.app`
المستخدم مش بيشوف الـ API Key خالص.

---

## الأمان

| ما يراه المستخدم | ما يبقى على السيرفر |
|---|---|
| واجهة التطبيق فقط | `ANTHROPIC_API_KEY` |
| نتائج التحليل | الـ Key في environment variable |
| لا traces في الـ network | الطلبات تمر عبر `/api/` فقط |

---

## تطوير محلي

```bash
# 1. ضع مفتاحك في .env.local
echo "ANTHROPIC_API_KEY=sk-ant-..." > .env.local

# 2. شغّل السيرفر
npm install
npm run dev
```
