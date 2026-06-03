# Implementation Code Snippets

## 1. Company Info localStorage Key Structure

**Location**: Used throughout app via `LS.get()` and `LS.set()`

**Key Name**: `"boqmate_company_info"`

**Data Structure**:
```javascript
{
  name: "",       // Company name (string)
  address: "",    // Company address (string)
  phone: "",      // Company phone number (string)
  logo: ""        // Base64-encoded image (data URL)
}
```

**Example Values**:
```javascript
{
  name: "المكتب العربي للتشييد والبناء",
  address: "الإسكندرية، مصر",
  phone: "+20 3 000 0000",
  logo: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg..."
}
```

---

## 2. Key Functions in export-utils.js

### Currency Formatting
```javascript
const fmt = (num) => new Intl.NumberFormat("ar-EG", {
  style: "currency",
  currency: "EGP",
  minimumFractionDigits: 2,
}).format(num);

// Usage:
fmt(1500)        // "١٫٥٠٠ ج.م"
fmt(27600)       // "٢٧٫٦٠٠ ج.م"
```

### Company Header HTML
```javascript
const companyHeader = companyInfo && companyInfo.name ? `
  <div style="display: flex; align-items: flex-start; gap: 20px; margin-bottom: 30px; border-bottom: 2px solid #ddd; padding-bottom: 20px;">
    ${companyInfo.logo ? `<img src="${companyInfo.logo}" alt="Company Logo" style="height: 80px; object-fit: contain;">` : ""}
    <div style="flex: 1;">
      <div style="font-size: 24px; font-weight: 700; color: #000; margin-bottom: 4px;">${companyInfo.name}</div>
      ${companyInfo.address ? `<div style="font-size: 13px; color: #555; margin-bottom: 2px;">📍 ${companyInfo.address}</div>` : ""}
      ${companyInfo.phone ? `<div style="font-size: 13px; color: #555;">📞 ${companyInfo.phone}</div>` : ""}
    </div>
  </div>
` : "";
```

### Items Table Header
```javascript
const itemsTableHTML = `
  <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px;">
    <thead>
      <tr style="background: #f5f5f5; border-bottom: 2px solid #333;">
        <th style="text-align: right; padding: 12px; border-right: 1px solid #ddd; font-weight: 700;">البند</th>
        <th style="text-align: center; padding: 12px; border-right: 1px solid #ddd; font-weight: 700;">الكمية</th>
        <th style="text-align: center; padding: 12px; border-right: 1px solid #ddd; font-weight: 700;">الوحدة</th>
        <th style="text-align: center; padding: 12px; border-right: 1px solid #ddd; font-weight: 700;">سعر الوحدة</th>
        <th style="text-align: center; padding: 12px; font-weight: 700;">الإجمالي</th>
      </tr>
    </thead>
    <tbody>
      ${/* items map */}
    </tbody>
  </table>
`;
```

### Calculate Totals
```javascript
const successItems = analysisResults.filter((i) => i.status === "success");
const subtotal = successItems.reduce((s, i) => s + (i.totalCost || 0), 0);
const additionsTotal = additions.reduce((s, a) => s + subtotal * (a.pct / 100), 0);
const vat = includeVAT ? (subtotal + additionsTotal) * 0.14 : 0;
const total = subtotal + additionsTotal + vat;
```

---

## 3. SettingsTab Company Info State Management

### Initialize State
```javascript
const [companyInfo, setCompanyInfo] = useState(() => LS.get("boqmate_company_info", {
  name: "",
  address: "",
  phone: "",
  logo: ""
}));
const [logoPreview, setLogoPreview] = useState(companyInfo.logo || "");
```

### Save to localStorage
```javascript
const saveCompanyInfo = (info) => {
  setCompanyInfo(info);
  LS.set("boqmate_company_info", info);
};
```

### Handle Field Changes
```javascript
const handleCompanyChange = (field, value) => {
  const updated = { ...companyInfo, [field]: value };
  saveCompanyInfo(updated);
};

// Usage:
handleCompanyChange("name", "اسم جديد");
handleCompanyChange("phone", "+20 100 000 0000");
```

### Handle Logo Upload
```javascript
const handleLogoUpload = (e) => {
  const file = e.target.files?.[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (evt) => {
      const base64 = evt.target?.result;
      setLogoPreview(base64);
      handleCompanyChange("logo", base64);
    };
    reader.readAsDataURL(file);
  }
};

// Usage:
<input type="file" accept="image/*" onChange={handleLogoUpload} />
```

### Delete Logo
```javascript
const deleteClick = () => {
  setLogoPreview("");
  handleCompanyChange("logo", "");
};
```

---

## 4. Form Inputs JSX

### Logo Upload Section
```jsx
<div style={{ marginBottom: 20 }}>
  <label style={{ display: "block", color: C.textMuted, fontSize: 13, fontWeight: 600, marginBottom: 10 }}>
    📸 شعار الشركة
  </label>
  <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
    {logoPreview && (
      <div style={{ width: 100, height: 100, borderRadius: 8, border: `1px solid ${C.border}`, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", background: C.navyMid }}>
        <img src={logoPreview} alt="Logo preview" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
      </div>
    )}
    <div style={{ flex: 1 }}>
      <label style={{ display: "inline-block", padding: "10px 16px", background: `${C.gold}15`, border: `1px dashed ${C.gold}50`, borderRadius: 8, color: C.gold, fontWeight: 600, cursor: "pointer", fontSize: 13 }}>
        📤 اختر الصورة
        <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: "none" }} />
      </label>
      <p style={{ color: C.textMuted, fontSize: 12, marginTop: 8 }}>الصيغ المدعومة: JPG, PNG, SVG</p>
    </div>
  </div>
</div>
```

### Company Name Input
```jsx
<div>
  <label style={{ display: "block", color: C.textMuted, fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
    اسم الشركة
  </label>
  <input
    type="text"
    value={companyInfo.name}
    onChange={(e) => handleCompanyChange("name", e.target.value)}
    placeholder="مثال: المكتب العربي للتشييد والبناء"
    style={{ width: "100%", padding: "10px 12px", background: C.navyMid, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 13, fontFamily: "'Cairo', sans-serif", outline: "none" }}
  />
</div>
```

### Address Input
```jsx
<div>
  <label style={{ display: "block", color: C.textMuted, fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
    العنوان
  </label>
  <input
    type="text"
    value={companyInfo.address}
    onChange={(e) => handleCompanyChange("address", e.target.value)}
    placeholder="مثال: الإسكندرية، مصر"
    style={{ width: "100%", padding: "10px 12px", background: C.navyMid, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 13, fontFamily: "'Cairo', sans-serif", outline: "none" }}
  />
</div>
```

### Phone Input
```jsx
<div>
  <label style={{ display: "block", color: C.textMuted, fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
    رقم الهاتف
  </label>
  <input
    type="tel"
    value={companyInfo.phone}
    onChange={(e) => handleCompanyChange("phone", e.target.value)}
    placeholder="+20 3 000 0000"
    style={{ width: "100%", padding: "10px 12px", background: C.navyMid, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 13, fontFamily: "'Cairo', sans-serif", outline: "none" }}
  />
</div>
```

---

## 5. ExportModal Integration

### Get Company Info
```javascript
const ExportModal = ({ open, onClose, analysisResults, additions, showVAT, projectName }) => {
  // Get company info from localStorage
  const companyInfo = LS.get("boqmate_company_info", {});
  // ... rest of component
};
```

### Pass to generatePDF
```javascript
const handleExport = async () => {
  setExporting(true);
  try {
    if (exportType === "excel") {
      await generateExcel(analysisResults, projectName, additions, showVAT);
    } else {
      // Pass companyInfo as 5th parameter
      await generatePDF(analysisResults, projectName, additions, showVAT, companyInfo);
    }
  } catch (error) {
    alert(`فشل التصدير: ${error.message}`);
  } finally {
    setExporting(false);
    onClose();
  }
};
```

---

## 6. Print Window Flow

### Generate and Open Window
```javascript
export async function generatePDF(
  analysisResults,
  projectName = "BOQ_Report",
  additions = [],
  includeVAT = true,
  companyInfo = {}
) {
  if (typeof window === "undefined") {
    throw new Error("PDF export is only available in the browser");
  }

  if (!analysisResults || analysisResults.length === 0) {
    throw new Error("No items to export");
  }

  try {
    // 1. Generate the clean HTML
    const htmlContent = generatePrintHTML(
      analysisResults, 
      projectName, 
      additions, 
      includeVAT, 
      companyInfo
    );

    // 2. Open in new window
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      throw new Error("فشل فتح نافذة الطباعة. تأكد من تفعيل النوافذ المنبثقة.");
    }

    // 3. Write content
    printWindow.document.write(htmlContent);
    printWindow.document.close();

    // 4. Set up print when content is ready
    printWindow.onload = () => {
      // Delay slightly to ensure rendering is complete
      setTimeout(() => {
        printWindow.print();
        // Close window after printing
        setTimeout(() => {
          printWindow.close();
        }, 500);
      }, 200);
    };
  } catch (error) {
    throw new Error(`فشل إنشاء تقرير PDF: ${error.message}`);
  }
}
```

---

## 7. Complete HTML Template Structure

### DOCTYPE and Directives
```html
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${projectName}</title>
```

### CSS Styling
```html
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800;900&display=swap');
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Cairo', 'Segoe UI', sans-serif;
      direction: rtl;
      text-align: right;
      background: white;
      color: #333;
      line-height: 1.6;
    }
    
    .page {
      max-width: 210mm;
      height: 297mm;
      margin: 10mm auto;
      padding: 20mm;
      background: white;
      box-shadow: 0 0 10px rgba(0,0,0,0.1);
      page-break-after: always;
    }
    
    @media print {
      body {
        margin: 0;
        padding: 0;
      }
      .page {
        max-width: 100%;
        height: 100%;
        margin: 0;
        padding: 20mm;
        box-shadow: none;
      }
    }
  </style>
</head>
```

### Body Content
```html
<body>
  <div class="page">
    <!-- Company Header -->
    ${companyHeader}
    
    <!-- Report Header -->
    <div class="header">
      <div class="title">تقرير المقايسة</div>
      <div class="project-info">
        <span>📋 المشروع: <strong>${projectName}</strong></span>
        <span>📅 التاريخ: <strong>${new Date().toLocaleDateString("ar-EG")}</strong></span>
      </div>
    </div>
    
    <!-- Items Table -->
    ${itemsTableHTML}
    
    <!-- Cost Summary -->
    ${summaryHTML}
  </div>
</body>
</html>
```

---

## 8. Error Handling Examples

### Popup Blocker
```javascript
const printWindow = window.open("", "_blank");
if (!printWindow) {
  throw new Error("فشل فتح نافذة الطباعة. تأكد من تفعيل النوافذ المنبثقة.");
  // User sees: "Failed to open print window. Make sure popups are enabled."
}
```

### Server-Side Rendering Check
```javascript
if (typeof window === "undefined") {
  throw new Error("PDF export is only available in the browser");
  // Prevents errors during SSR
}
```

### No Data Check
```javascript
if (!analysisResults || analysisResults.length === 0) {
  throw new Error("No items to export");
}
```

### General Error Wrapping
```javascript
try {
  const htmlContent = generatePrintHTML(...);
  // ... rest of code
} catch (error) {
  throw new Error(`فشل إنشاء تقرير PDF: ${error.message}`);
  // Provides context to user about what failed
}
```

---

## 9. Testing Utilities

### Log Company Info
```javascript
console.log("Company Info:", LS.get("boqmate_company_info", {}));
```

### Generate Test HTML
```javascript
import { generatePrintHTML } from '@/lib/export-utils';

const testResults = [
  {
    status: "success",
    itemName: "خرسانة جاهزة C30",
    quantity: 150,
    unit: "م³",
    totalCost: 292500,
    breakdown: [
      { name: "شحن ونقل", total_qty: 150, unit: "م³", unit_price: 50, total_cost: 7500 },
    ]
  }
];

const testCompanyInfo = {
  name: "شركة اختبار",
  address: "الإسكندرية",
  phone: "+20 100 000 0000",
  logo: "data:image/png;base64,..."
};

const html = generatePrintHTML(testResults, "Test Project", [], true, testCompanyInfo);
console.log(html);
```

---

**Version**: 1.0
**Last Updated**: June 2024
**Verified**: ✅ Working
