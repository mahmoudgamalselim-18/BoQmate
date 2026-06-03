# Developer Reference - PDF Export Rebuild

## 🔧 Code Changes Overview

### File 1: `app/lib/export-utils.js`

#### New Function: `generatePrintHTML()`

Generates a complete, self-contained HTML document for printing.

**Signature:**
```javascript
function generatePrintHTML(
  analysisResults,     // Array of BOQ items
  projectName,         // String: report title
  additions,          // Array: [{ label, pct }, ...]
  includeVAT,         // Boolean: show VAT line
  companyInfo         // Object: { name, address, phone, logo }
)
```

**Returns:** Complete HTML string

**Key Features:**
- Generates company header from `companyInfo` if provided
- Builds items table with breakdown support
- Creates cost summary with all additions and VAT
- Uses `Intl.NumberFormat` for EGP currency formatting
- Sets `dir="rtl"` for Arabic support
- All styles are inline (no external CSS)

**Example:**
```javascript
const htmlContent = generatePrintHTML(
  analysisResults,
  "المشروع الجديد",
  [{ label: "Overhead", pct: 15 }],
  true,
  { name: "شركتي", logo: "data:image/..." }
);
```

#### Modified Function: `generatePDF()`

Now uses a new window instead of printing the modal.

**Signature:**
```javascript
export async function generatePDF(
  analysisResults,
  projectName = "BOQ_Report",
  additions = [],
  includeVAT = true,
  companyInfo = {}  // NEW PARAMETER
)
```

**Implementation:**
```javascript
1. Generate HTML with generatePrintHTML()
2. Open new window: window.open("", "_blank")
3. Write HTML: printWindow.document.write(htmlContent)
4. Wait for load: printWindow.onload = () => { ... }
5. Trigger print: printWindow.print()
6. Close window: printWindow.close()
```

**Error Handling:**
- Checks for server-side rendering
- Validates data array
- Checks for popup blocker
- Throws descriptive Arabic error messages

---

### File 2: `app/page.jsx`

#### Modified: `ExportModal` Component

**Changes:**
```javascript
// BEFORE
const handleExport = async () => {
  await generatePDF(analysisResults, projectName, additions, showVAT);
};

// AFTER
const companyInfo = LS.get("boqmate_company_info", {});
const handleExport = async () => {
  await generatePDF(analysisResults, projectName, additions, showVAT, companyInfo);
};
```

#### Rebuilt: `SettingsTab` Component

**New State Management:**
```javascript
const [companyInfo, setCompanyInfo] = useState(() => 
  LS.get("boqmate_company_info", {
    name: "",
    address: "",
    phone: "",
    logo: ""
  })
);
const [logoPreview, setLogoPreview] = useState(companyInfo.logo || "");
```

**New Functions:**
```javascript
// Save company info to localStorage
const saveCompanyInfo = (info) => {
  setCompanyInfo(info);
  LS.set("boqmate_company_info", info);
};

// Handle input changes
const handleCompanyChange = (field, value) => {
  const updated = { ...companyInfo, [field]: value };
  saveCompanyInfo(updated);
};

// Handle logo file upload
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
```

**UI Components:**
- Logo upload input (file picker)
- Logo preview (image display)
- Logo delete button
- Company name input
- Address input
- Phone input
- Auto-save success message

---

## 🎨 HTML Template Structure

The generated HTML has this structure:

```html
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <style>
    /* Inline CSS with:
       - @import for Cairo font
       - body { direction: rtl; text-align: right; }
       - .page { max-width: 210mm; height: 297mm; }
       - @media print { /* print optimization */ }
    */
  </style>
</head>
<body>
  <div class="page">
    <!-- Company Header (if companyInfo.name provided) -->
    <div style="display: flex; gap: 20px; margin-bottom: 30px; border-bottom: 2px solid #ddd;">
      <!-- Logo image -->
      <!-- Company info (name, address, phone) -->
    </div>

    <!-- Report Header -->
    <div class="header">
      <div class="title">تقرير المقايسة</div>
      <div class="project-info">
        <span>📋 المشروع: {projectName}</span>
        <span>📅 التاريخ: {today's date}</span>
      </div>
    </div>

    <!-- Items Table -->
    <table style="width: 100%; border-collapse: collapse;">
      <thead>
        <tr style="background: #f5f5f5; border-bottom: 2px solid #333;">
          <th>البند</th>
          <th>الكمية</th>
          <th>الوحدة</th>
          <th>سعر الوحدة</th>
          <th>الإجمالي</th>
        </tr>
      </thead>
      <tbody>
        <!-- Item rows -->
        <!-- Breakdown rows (if available, indented with └─) -->
      </tbody>
    </table>

    <!-- Cost Summary -->
    <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #ddd;">
      <!-- Direct cost -->
      <!-- Additions (e.g., Overhead, Mobilization) -->
      <!-- VAT (if applicable) -->
      <!-- Grand Total -->
    </div>
  </div>
</body>
</html>
```

---

## 💾 Data Flow

### Export Flow:
```
User clicks "Export PDF"
    ↓
ExportModal.handleExport()
    ↓
Get companyInfo from localStorage
    ↓
Call generatePDF(data, projectName, additions, VAT, companyInfo)
    ↓
generatePrintHTML() creates HTML string
    ↓
window.open("", "_blank") creates new window
    ↓
printWindow.document.write(htmlContent)
    ↓
printWindow.onload() waits for rendering
    ↓
printWindow.print() triggers print dialog
    ↓
User saves as PDF or prints
```

### Settings Save Flow:
```
User types in company info field
    ↓
handleCompanyChange(field, value)
    ↓
saveCompanyInfo(updatedInfo)
    ↓
LS.set("boqmate_company_info", updatedInfo)
    ↓
localStorage updated
    ↓
Success message displayed
```

---

## 🔧 Customization Guide

### Change Colors/Styling

Edit the CSS in `generatePrintHTML()`:

```javascript
// In generatePrintHTML(), modify the <style> tag

// Change header color
.title {
  color: #000;           // Change this
  font-size: 28px;       // Or this
  font-weight: 800;
}

// Change table header background
<tr style="background: #f5f5f5; ...">
  // Change #f5f5f5 to your color
</tr>
```

### Add Signature Field

Add to `summaryHTML` section:

```javascript
<div style="margin-top: 40px; display: flex; justify-content: space-between;">
  <div style="border-top: 1px solid #000; width: 150px; text-align: center;">
    المدير: _____
  </div>
  <div style="border-top: 1px solid #000; width: 150px; text-align: center;">
    الموافقة: _____
  </div>
</div>
```

### Change Currency

Modify the `fmt()` function:

```javascript
// Current (EGP):
const fmt = (num) => new Intl.NumberFormat("ar-EG", {
  style: "currency",
  currency: "EGP",
}).format(num);

// Change to AED (Dubai):
const fmt = (num) => new Intl.NumberFormat("ar-AE", {
  style: "currency",
  currency: "AED",
}).format(num);

// Change to USD:
const fmt = (num) => new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
}).format(num);
```

### Add Footer

Modify the HTML template:

```javascript
return `
  <!DOCTYPE html>
  ...
  <div class="page">
    ...
    ${summaryHTML}
  </div>
  
  <!-- ADD FOOTER HERE -->
  <div style="margin-top: 40px; text-align: center; color: #999; font-size: 11px;">
    <p>BoQmate © 2024 — منصة التسعير الذكية</p>
    <p>تاريخ الطباعة: ${new Date().toLocaleString('ar-EG')}</p>
  </div>
  
  </body>
  </html>
`;
```

### Support Multiple Pages

For large reports, add page breaks:

```javascript
// In HTML template, add after each major section:
<div style="page-break-after: always;"></div>

// Or make multiple pages:
return `
  <html>
    <body>
      <div class="page">
        <!-- Page 1 content -->
      </div>
      
      <div class="page">
        <!-- Page 2 content -->
      </div>
    </body>
  </html>
`;
```

---

## 🧪 Testing

### Manual Testing Checklist:

1. **Settings Tab**
   - [ ] Upload logo image
   - [ ] Verify logo preview appears
   - [ ] Edit company name
   - [ ] Verify data saves to localStorage
   - [ ] Delete logo and verify it clears

2. **PDF Export**
   - [ ] Click export PDF button
   - [ ] New window opens with clean report
   - [ ] Company info appears in header (if set)
   - [ ] All items display correctly
   - [ ] Breakdown components indent properly
   - [ ] Cost summary shows all additions
   - [ ] VAT displays correctly (14%)
   - [ ] Total is accurate

3. **Arabic Support**
   - [ ] Text is right-aligned (not reversed)
   - [ ] Numbers display left-to-right
   - [ ] Table columns in correct order
   - [ ] Headers in Arabic display correctly

4. **Browser**
   - [ ] Chrome
   - [ ] Firefox
   - [ ] Safari
   - [ ] Edge

### Console Debugging:

```javascript
// Check if company info is saved
console.log(LS.get("boqmate_company_info"));

// Test HTML generation
import { generatePrintHTML } from '@/lib/export-utils';
const html = generatePrintHTML(results, "Test", [], true, {
  name: "اختبار",
  logo: "data:image/..."
});
console.log(html);

// Check for errors in print window
printWindow.addEventListener('error', (e) => {
  console.error('Print window error:', e);
});
```

---

## 📦 Dependencies

No new dependencies added! Uses existing:
- `React` - UI framework
- `Intl.NumberFormat` - Built-in currency formatting
- `FileReader API` - Built-in file upload handling
- `localStorage` - Built-in browser storage
- `Google Fonts` - CDN for Cairo font (already used)

---

## ✅ Quality Checklist

- ✓ No external CSS files needed
- ✓ No jsPDF or other PDF libraries required
- ✓ All inline styles for portability
- ✓ Proper Arabic RTL support
- ✓ Error handling for edge cases
- ✓ localStorage integration
- ✓ Base64 image encoding
- ✓ Backward compatible with existing code
- ✓ No breaking changes

---

**Last Updated**: June 2024
**Maintainer**: Development Team
**Status**: ✅ Production Ready
