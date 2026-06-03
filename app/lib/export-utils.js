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

  const reportElement = document.getElementById("boqmate-report-export");
  if (!reportElement) {
    throw new Error("Report content not found for PDF export");
  }

  const html2canvasModule = await import("html2canvas");
  const html2canvas = html2canvasModule.default || html2canvasModule;
  const canvas = await html2canvas(reportElement, {
    scale: 2,
    backgroundColor: null,
    useCORS: true,
  });

  const imgData = canvas.toDataURL("image/jpeg", 0.95);
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let position = 0;
  pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);

  while (imgHeight + position > pageHeight) {
    position -= pageHeight;
    pdf.addPage();
    pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
  }

  pdf.save(`${projectName}.pdf`);
}
