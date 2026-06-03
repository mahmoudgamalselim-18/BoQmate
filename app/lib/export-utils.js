// app/lib/export-utils.js
// ─────────────────────────────────────────────────────────────
// Utilities for exporting BOQ reports to Excel and PDF
// ─────────────────────────────────────────────────────────────

export async function generateExcel(
  analysisResults,
  projectName = "BOQ_Report",
  additions = [],
  includeVAT = true
) {
  const XLSXModule = await import("xlsx");
  const XLSX = XLSXModule.default || XLSXModule;

  if (!analysisResults || analysisResults.length === 0) {
    throw new Error("No items to export");
  }

  const successItems = analysisResults.filter((i) => i.status === "success");
  const subtotal = successItems.reduce((s, i) => s + (i.totalCost || 0), 0);
  const additionsTotal = additions.reduce(
    (s, a) => s + subtotal * (a.pct / 100),
    0
  );
  const vat = includeVAT ? (subtotal + additionsTotal) * 0.14 : 0;
  const total = subtotal + additionsTotal + vat;

  const worksheetData = [];

  worksheetData.push(["تقرير المقايسة", projectName, "", "", "", "", ""]);
  worksheetData.push(["", "", "", "", "", "", ""]);
  worksheetData.push([
    "البند",
    "الكمية",
    "الوحدة",
    "سعر الوحدة",
    "الإجمالي",
    "النوع",
    "المصدر",
  ]);

  successItems.forEach((item) => {
    const unitPrice = item.quantity ? item.totalCost / item.quantity : item.totalCost;
    worksheetData.push([
      item.itemName || item.raw,
      item.quantity || "",
      item.unit || "",
      unitPrice ? unitPrice.toFixed(2) : "",
      item.totalCost?.toFixed(2) || "",
      "مادة",
      "سوق",
    ]);

    if (item.breakdown && item.breakdown.length > 0) {
      worksheetData.push(["تفاصيل المكونات:", "", "", "", "", "", ""]);
      item.breakdown.forEach((component) => {
        worksheetData.push([
          `  - ${component.name}`,
          component.total_qty?.toFixed(2) || "",
          component.unit || "",
          component.unit_price?.toFixed(2) || "",
          component.total_cost?.toFixed(2) || "",
          component.type || "",
          component.source || "",
        ]);
      });
    }
  });

  worksheetData.push(["", "", "", "", "", "", ""]);
  worksheetData.push(["ملخص التكاليف", "", "", "", "", "", ""]);
  worksheetData.push(["التكلفة المباشرة", subtotal.toFixed(2), "", "", "", "", ""]);

  additions.forEach((add) => {
    const amount = subtotal * (add.pct / 100);
    worksheetData.push([
      `${add.label} (${add.pct}%)`,
      amount.toFixed(2),
      "",
      "",
      "",
      "",
      "",
    ]);
  });

  if (includeVAT) {
    worksheetData.push(["ضريبة القيمة المضافة (14%)", vat.toFixed(2), "", "", "", "", ""]);
  }

  worksheetData.push([
    includeVAT
      ? "الإجمالي الكلي شامل الضريبة"
      : "الإجمالي الكلي بدون ضريبة",
    total.toFixed(2),
    "",
    "",
    "",
    "",
    "",
  ]);

  const ws = XLSX.utils.aoa_to_sheet(worksheetData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "المقايسة");

  ws["!cols"] = [
    { wch: 30 },
    { wch: 12 },
    { wch: 10 },
    { wch: 12 },
    { wch: 12 },
    { wch: 10 },
    { wch: 10 },
  ];

  const wbout = XLSX.write(wb, {
    bookType: "xlsx",
    type: "array",
  });
  const blob = new Blob([wbout], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${projectName}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─────────────────────────────────────────────────────────────
// UTILITY: Generate clean HTML for printing
// ─────────────────────────────────────────────────────────────
function generatePrintHTML(analysisResults, projectName, additions, includeVAT, companyInfo) {
  const successItems = analysisResults.filter((i) => i.status === "success");
  
  // Calculate totals
  const subtotal = successItems.reduce((s, i) => s + (i.totalCost || 0), 0);
  const additionsTotal = additions.reduce((s, a) => s + subtotal * (a.pct / 100), 0);
  const vat = includeVAT ? (subtotal + additionsTotal) * 0.14 : 0;
  const total = subtotal + additionsTotal + vat;

  // Format currency
  const fmt = (num) => new Intl.NumberFormat("ar-EG", {
    style: "currency",
    currency: "EGP",
    minimumFractionDigits: 2,
  }).format(num);

  // Build company header
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

  // Build items table
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
        ${successItems.map((item, idx) => {
          const unitPrice = item.quantity ? item.totalCost / item.quantity : item.totalCost;
          const rowHTML = `
            <tr style="border-bottom: 1px solid #eee;">
              <td style="text-align: right; padding: 12px; border-right: 1px solid #eee;">${item.itemName || item.raw}</td>
              <td style="text-align: center; padding: 12px; border-right: 1px solid #eee;">${item.quantity?.toFixed(2) || "-"}</td>
              <td style="text-align: center; padding: 12px; border-right: 1px solid #eee;">${item.unit || "-"}</td>
              <td style="text-align: center; padding: 12px; border-right: 1px solid #eee;">${fmt(unitPrice)}</td>
              <td style="text-align: center; padding: 12px; font-weight: 600;">${fmt(item.totalCost)}</td>
            </tr>
          `;
          
          // Add breakdown rows if available
          let breakdownRows = "";
          if (item.breakdown && item.breakdown.length > 0) {
            breakdownRows = item.breakdown.map(component => `
              <tr style="background: #fafafa; border-bottom: 1px solid #eee;">
                <td style="text-align: right; padding: 10px 12px; border-right: 1px solid #eee; font-size: 12px; color: #666;">
                  └─ ${component.name}
                </td>
                <td style="text-align: center; padding: 10px 12px; border-right: 1px solid #eee; font-size: 12px; color: #666;">
                  ${component.total_qty?.toFixed(2) || "-"}
                </td>
                <td style="text-align: center; padding: 10px 12px; border-right: 1px solid #eee; font-size: 12px; color: #666;">
                  ${component.unit || "-"}
                </td>
                <td style="text-align: center; padding: 10px 12px; border-right: 1px solid #eee; font-size: 12px; color: #666;">
                  ${fmt(component.unit_price || 0)}
                </td>
                <td style="text-align: center; padding: 10px 12px; font-size: 12px; color: #666;">
                  ${fmt(component.total_cost || 0)}
                </td>
              </tr>
            `).join("");
          }
          
          return rowHTML + breakdownRows;
        }).join("")}
      </tbody>
    </table>
  `;

  // Build summary
  const summaryHTML = `
    <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #ddd;">
      <div style="display: flex; justify-content: flex-start; gap: 40px; direction: rtl; text-align: right;">
        <div style="flex: 0 0 300px;">
          <div style="margin-bottom: 12px; display: flex; justify-content: space-between;">
            <span style="font-weight: 600;">التكلفة المباشرة:</span>
            <span>${fmt(subtotal)}</span>
          </div>
          ${additions.map(add => {
            const amount = subtotal * (add.pct / 100);
            return `
              <div style="margin-bottom: 12px; display: flex; justify-content: space-between; color: #555;">
                <span>${add.label} (${add.pct}%):</span>
                <span>${fmt(amount)}</span>
              </div>
            `;
          }).join("")}
          ${includeVAT ? `
            <div style="margin-bottom: 12px; display: flex; justify-content: space-between; color: #555;">
              <span>ضريبة القيمة المضافة (14%):</span>
              <span>${fmt(vat)}</span>
            </div>
          ` : ""}
          <div style="margin-top: 16px; padding-top: 12px; border-top: 1px solid #ddd; display: flex; justify-content: space-between; font-size: 16px; font-weight: 700;">
            <span>${includeVAT ? "الإجمالي الكلي (شامل الضريبة):" : "الإجمالي الكلي:"}</span>
            <span>${fmt(total)}</span>
          </div>
        </div>
      </div>
    </div>
  `;

  // Build complete HTML document
  return `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${projectName}</title>
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
        
        .header {
          margin-bottom: 20px;
        }
        
        .title {
          font-size: 28px;
          font-weight: 800;
          color: #000;
          margin-bottom: 8px;
        }
        
        .project-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 10px;
          border-bottom: 1px solid #ddd;
          font-size: 13px;
          color: #666;
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
    <body>
      <div class="page">
        ${companyHeader}
        
        <div class="header">
          <div class="title">تقرير المقايسة</div>
          <div class="project-info">
            <span>📋 المشروع: <strong>${projectName}</strong></span>
            <span>📅 التاريخ: <strong>${new Date().toLocaleDateString("ar-EG")}</strong></span>
          </div>
        </div>
        
        ${itemsTableHTML}
        ${summaryHTML}
      </div>
    </body>
    </html>
  `;
}

// ─────────────────────────────────────────────────────────────
// NEW PDF Generation: Print to File
// ─────────────────────────────────────────────────────────────
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
    // Generate the clean HTML
    const htmlContent = generatePrintHTML(analysisResults, projectName, additions, includeVAT, companyInfo);

    // Open in new window
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      throw new Error("فشل فتح نافذة الطباعة. تأكد من تفعيل النوافذ المنبثقة.");
    }

    // Write content
    printWindow.document.write(htmlContent);
    printWindow.document.close();

    // Set up print when content is ready
    printWindow.onload = () => {
      // Delay slightly to ensure rendering is complete
      setTimeout(() => {
        printWindow.print();
        // Close window after printing (user can choose not to close in print dialog)
        setTimeout(() => {
          printWindow.close();
        }, 500);
      }, 200);
    };
  } catch (error) {
    throw new Error(`فشل إنشاء تقرير PDF: ${error.message}`);
  }
}
