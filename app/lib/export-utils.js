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
  // Dynamically import XLSX
  const XLSX = (await import("xlsx")).default;

  if (!analysisResults || analysisResults.length === 0) {
    throw new Error("No items to export");
  }

  // Calculate totals
  const successItems = analysisResults.filter((i) => i.status === "success");
  const subtotal = successItems.reduce((s, i) => s + (i.totalCost || 0), 0);
  const additionsTotal = additions.reduce(
    (s, a) => s + subtotal * (a.pct / 100),
    0
  );
  const vat = includeVAT ? (subtotal + additionsTotal) * 0.14 : 0;
  const total = subtotal + additionsTotal + vat;

  // Create worksheet data
  const worksheetData = [];

  // Header
  worksheetData.push(["تقرير المقايسة", projectName, "", "", "", "", ""]);
  worksheetData.push(["", "", "", "", "", "", ""]);

  // Item details header
  worksheetData.push([
    "البند",
    "الكمية",
    "الوحدة",
    "سعر الوحدة",
    "الإجمالي",
    "النوع",
    "المصدر",
  ]);

  // Item rows
  successItems.forEach((item) => {
    worksheetData.push([
      item.itemName || item.raw,
      item.quantity || "",
      item.unit || "",
      item.breakdown && item.breakdown.length > 0
        ? (item.totalCost / item.quantity).toFixed(2)
        : item.totalCost,
      item.totalCost.toFixed(2),
      "مادة",
      "سوق",
    ]);

    // Add breakdown components if available
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

  // Summary section
  worksheetData.push(["", "", "", "", "", "", ""]);
  worksheetData.push(["ملخص التكاليف", "", "", "", "", "", ""]);
  worksheetData.push(["التكلفة المباشرة", subtotal.toFixed(2), "", "", "", "", ""]);

  // Additions
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

  // VAT
  if (includeVAT) {
    worksheetData.push(["ضريبة القيمة المضافة (14%)", vat.toFixed(2), "", "", "", "", ""]);
  }

  // Total
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

  // Create workbook and worksheet
  const ws = XLSX.utils.aoa_to_sheet(worksheetData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "المقايسة");

  // Style the worksheet
  ws["!cols"] = [
    { wch: 30 }, // Column A
    { wch: 12 }, // Column B
    { wch: 10 }, // Column C
    { wch: 12 }, // Column D
    { wch: 12 }, // Column E
    { wch: 10 }, // Column F
    { wch: 10 }, // Column G
  ];

  // Write file
  XLSX.writeFile(wb, `${projectName}.xlsx`);
}

export async function generatePDF(
  analysisResults,
  projectName = "BOQ_Report",
  additions = [],
  includeVAT = true,
  companyInfo = {}
) {
  // Dynamically import jsPDF and autotable
  const { jsPDF } = await import("jspdf");
  const autoTable = await import("jspdf-autotable");

  if (!analysisResults || analysisResults.length === 0) {
    throw new Error("No items to export");
  }

  // Calculate totals
  const successItems = analysisResults.filter((i) => i.status === "success");
  const subtotal = successItems.reduce((s, i) => s + (i.totalCost || 0), 0);
  const additionsTotal = additions.reduce(
    (s, a) => s + subtotal * (a.pct / 100),
    0
  );
  const vat = includeVAT ? (subtotal + additionsTotal) * 0.14 : 0;
  const total = subtotal + additionsTotal + vat;

  // Create PDF
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
  });

  // Set font for RTL support (will use default font with special handling)
  doc.setFont("Arial", "normal");
  doc.setFontSize(14);

  // Header
  doc.text(projectName, 148, 20, { align: "right" });
  doc.setFontSize(10);
  doc.text(`تاريخ: ${new Date().toLocaleDateString("ar-EG")}`, 148, 28, {
    align: "right",
  });

  if (companyInfo.name) {
    doc.setFontSize(11);
    doc.text(companyInfo.name, 148, 36, { align: "right" });
  }

  // Table data
  const tableData = successItems.map((item) => [
    item.itemName || item.raw,
    item.quantity || "-",
    item.unit || "-",
    `${(item.totalCost / (item.quantity || 1)).toFixed(0)}`,
    `${item.totalCost.toFixed(0)}`,
  ]);

  // Create table
  doc.autoTable({
    head: [["البند", "الكمية", "الوحدة", "سعر الوحدة", "الإجمالي"]],
    body: tableData,
    startY: 50,
    theme: "grid",
    halign: "right",
    valign: "middle",
    margin: { right: 10, left: 10 },
    didDrawPage: function (data) {
      // Footer
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

  // Summary section
  let finalY = doc.lastAutoTable.finalY + 15;

  doc.setFontSize(11);
  doc.text("ملخص التكاليف:", 148, finalY, { align: "right" });
  finalY += 8;

  doc.setFontSize(10);
  doc.text(`التكلفة المباشرة: ${subtotal.toFixed(0)} ج.م`, 148, finalY, {
    align: "right",
  });
  finalY += 6;

  // Additions
  additions.forEach((add) => {
    const amount = subtotal * (add.pct / 100);
    doc.text(`${add.label} (${add.pct}%): ${amount.toFixed(0)} ج.م`, 148, finalY, {
      align: "right",
    });
    finalY += 6;
  });

  // VAT
  if (includeVAT) {
    doc.text(`ضريبة القيمة المضافة (14%): ${vat.toFixed(0)} ج.م`, 148, finalY, {
      align: "right",
    });
    finalY += 8;
  }

  // Total
  doc.setFont("Arial", "bold");
  doc.setFontSize(12);
  doc.text(
    `الإجمالي الكلي: ${total.toFixed(0)} ج.م`,
    148,
    finalY,
    {
      align: "right",
    }
  );

  // Save PDF
  doc.save(`${projectName}.pdf`);
}
