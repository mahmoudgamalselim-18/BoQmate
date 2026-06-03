// app/lib/export-utils.js
// ─────────────────────────────────────────────────────────────
// Utilities for exporting BOQ reports to Excel and PDF
// ─────────────────────────────────────────────────────────────

const ARABIC_FONT_URL = "https://github.com/alif-type/amiri/raw/master/Amiri-Regular.ttf";

function arrayBufferToBase64(buffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

async function ensureArabicFont(doc) {
  if (typeof window === "undefined") return;
  if (window.__boqmateArabicFontLoaded) return;

  const response = await fetch(ARABIC_FONT_URL);
  if (!response.ok) {
    throw new Error("تعذر تحميل خط التصدير العربي");
  }

  const buffer = await response.arrayBuffer();
  const base64 = arrayBufferToBase64(buffer);
  doc.addFileToVFS("Amiri-Regular.ttf", base64);
  doc.addFont("Amiri-Regular.ttf", "Amiri", "normal");
  doc.addFont("Amiri-Regular.ttf", "Amiri", "bold");
  window.__boqmateArabicFontLoaded = true;
}

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

export async function generatePDF(
  analysisResults,
  projectName = "BOQ_Report",
  additions = [],
  includeVAT = true,
  companyInfo = {}
) {
  const { jsPDF } = await import("jspdf");
  await import("jspdf-autotable");

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

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
  });

  try {
    await ensureArabicFont(doc);
    doc.setFont("Amiri", "normal");
  } catch (error) {
    console.warn("Arabic font load failed, falling back to default PDF font.", error);
  }
  doc.setFontSize(14);

  doc.text(projectName, 198, 20, { align: "right" });
  doc.setFontSize(10);
  doc.text(`تاريخ: ${new Date().toLocaleDateString("ar-EG")}`, 198, 28, {
    align: "right",
  });

  if (companyInfo.name) {
    doc.setFontSize(11);
    doc.text(companyInfo.name, 198, 36, { align: "right" });
  }

  const tableData = successItems.map((item) => [
    item.itemName || item.raw,
    item.quantity || "-",
    item.unit || "-",
    `${(item.quantity ? item.totalCost / item.quantity : item.totalCost).toFixed(0)}`,
    `${item.totalCost.toFixed(0)}`,
  ]);

  doc.autoTable({
    head: [["البند", "الكمية", "الوحدة", "سعر الوحدة", "الإجمالي"]],
    body: tableData,
    startY: 50,
    theme: "grid",
    styles: {
      font: "Amiri",
      fontStyle: "normal",
      fontSize: 10,
      halign: "right",
    },
    headStyles: {
      fillColor: [240, 240, 240],
      textColor: [0, 0, 0],
      halign: "center",
    },
    margin: { right: 10, left: 10 },
    didDrawPage: function (data) {
      const pageSize = doc.internal.pageSize;
      const pageHeight = pageSize.getHeight();
      doc.setFontSize(9);
      doc.text(
        `صفحة ${data.pageNumber}`,
        pageSize.getWidth() / 2,
        pageHeight - 10,
        { align: "center" }
      );
    },
  });

  let finalY = doc.lastAutoTable.finalY + 15;
  doc.setFontSize(11);
  doc.text("ملخص التكاليف:", 198, finalY, { align: "right" });
  finalY += 8;

  doc.setFontSize(10);
  doc.text(`التكلفة المباشرة: ${subtotal.toFixed(0)} ج.م`, 198, finalY, {
    align: "right",
  });
  finalY += 6;

  additions.forEach((add) => {
    const amount = subtotal * (add.pct / 100);
    doc.text(`${add.label} (${add.pct}%): ${amount.toFixed(0)} ج.م`, 198, finalY, {
      align: "right",
    });
    finalY += 6;
  });

  if (includeVAT) {
    doc.text(`ضريبة القيمة المضافة (14%): ${vat.toFixed(0)} ج.م`, 198, finalY, {
      align: "right",
    });
    finalY += 8;
  }

  doc.setFont("Amiri", "bold");
  doc.setFontSize(12);
  doc.text(
    `الإجمالي الكلي: ${total.toFixed(0)} ج.م`,
    198,
    finalY,
    { align: "right" }
  );

  doc.save(`${projectName}.pdf`);
}
