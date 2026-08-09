import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell,
  WidthType, AlignmentType, BorderStyle,
} from "docx";

const stripMd = (md: string) =>
  (md || "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^[-*]\s+/gm, "• ")
    .replace(/\$([^$]+)\$/g, "$1");

const fileBase = (formTitle: string) => {
  const safe = (formTitle || "analisis").replace(/[^\w\d-_ ]+/g, "").trim().replace(/\s+/g, "_");
  const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  return `analisis_${safe}_${ts}`;
};

export function exportAnalysisToExcel(result: any, formTitle: string) {
  const wb = XLSX.utils.book_new();

  // Ringkasan
  const summary: any[][] = [
    ["Judul Form", formTitle],
    ["Nama Uji", result.test_name ?? ""],
    ["Total Respon", result.stats?.total_respon ?? ""],
    ["Tanggal", new Date().toLocaleString("id-ID")],
    [],
    ["Laporan"],
    ...stripMd(result.report ?? "").split("\n").map((l: string) => [l]),
  ];
  if (result.conclusion) { summary.push([], ["Kesimpulan"], [result.conclusion]); }
  const wsSum = XLSX.utils.aoa_to_sheet(summary);
  wsSum["!cols"] = [{ wch: 24 }, { wch: 80 }];
  XLSX.utils.book_append_sheet(wb, wsSum, "Ringkasan");

  if (Array.isArray(result.metrics) && result.metrics.length) {
    const rows = [["Label", "Nilai", "Catatan"], ...result.metrics.map((m: any) => [m.label, m.value, m.hint ?? ""])];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), "Metrik");
  }
  if (Array.isArray(result.stats?.deskriptif) && result.stats.deskriptif.length) {
    const rows = [
      ["Variabel", "N", "Mean", "SD", "Min", "Max"],
      ...result.stats.deskriptif.map((d: any) => [d.variabel, d.n, d.mean, d.sd, d.min, d.max]),
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), "Deskriptif");
  }
  if (Array.isArray(result.stats?.korelasi_pearson) && result.stats.korelasi_pearson.length) {
    const rows = [
      ["Variabel A", "Variabel B", "r", "N", "Kekuatan"],
      ...result.stats.korelasi_pearson.map((c: any) => {
        const abs = Math.abs(c.r);
        const s = abs >= 0.7 ? "Kuat" : abs >= 0.4 ? "Sedang" : abs >= 0.2 ? "Lemah" : "Sangat lemah";
        return [c.a, c.b, c.r, c.n, s];
      }),
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), "Korelasi");
  }

  const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  saveAs(new Blob([out], { type: "application/octet-stream" }), `${fileBase(formTitle)}.xlsx`);
}

const tCell = (text: string, opts: { bold?: boolean; shaded?: boolean } = {}) =>
  new TableCell({
    shading: opts.shaded ? { fill: "E8F0FE" } : undefined,
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: [new Paragraph({ children: [new TextRun({ text: String(text ?? ""), bold: opts.bold })] })],
  });

const makeTable = (headers: string[], rows: (string | number)[][]) =>
  new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ children: headers.map((h) => tCell(h, { bold: true, shaded: true })) }),
      ...rows.map((r) => new TableRow({ children: r.map((c) => tCell(String(c))) })),
    ],
  });

export async function exportAnalysisToWord(result: any, formTitle: string) {
  const children: any[] = [
    new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: "Laporan Analisis Data" })] }),
    new Paragraph({ children: [new TextRun({ text: `Form: ${formTitle}`, bold: true })] }),
    new Paragraph({ children: [new TextRun({ text: `Uji: ${result.test_name ?? "-"}` })] }),
    new Paragraph({ children: [new TextRun({ text: `Total Respon: ${result.stats?.total_respon ?? "-"}` })] }),
    new Paragraph({ children: [new TextRun({ text: `Tanggal: ${new Date().toLocaleString("id-ID")}` })] }),
    new Paragraph({ children: [new TextRun("")] }),
  ];

  if (Array.isArray(result.metrics) && result.metrics.length) {
    children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Metrik Kunci")] }));
    children.push(makeTable(["Label", "Nilai", "Catatan"], result.metrics.map((m: any) => [m.label, m.value, m.hint ?? ""])));
    children.push(new Paragraph(""));
  }

  children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Laporan")] }));
  stripMd(result.report ?? "").split("\n").forEach((line: string) => {
    children.push(new Paragraph({ children: [new TextRun(line)] }));
  });

  if (result.conclusion) {
    children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Kesimpulan")] }));
    children.push(new Paragraph({ children: [new TextRun(result.conclusion)] }));
  }

  if (Array.isArray(result.stats?.deskriptif) && result.stats.deskriptif.length) {
    children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Statistik Deskriptif")] }));
    children.push(makeTable(
      ["Variabel", "N", "Mean", "SD", "Min", "Max"],
      result.stats.deskriptif.map((d: any) => [d.variabel, d.n, d.mean, d.sd, d.min, d.max]),
    ));
    children.push(new Paragraph(""));
  }

  if (Array.isArray(result.stats?.korelasi_pearson) && result.stats.korelasi_pearson.length) {
    children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Korelasi Pearson")] }));
    children.push(makeTable(
      ["Variabel A", "Variabel B", "r", "N", "Kekuatan"],
      result.stats.korelasi_pearson.map((c: any) => {
        const abs = Math.abs(c.r);
        const s = abs >= 0.7 ? "Kuat" : abs >= 0.4 ? "Sedang" : abs >= 0.2 ? "Lemah" : "Sangat lemah";
        return [c.a, c.b, c.r, c.n, s];
      }),
    ));
  }

  children.push(new Paragraph(""));
  children.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Dihasilkan oleh FormGua · Analisis Data AI", italics: true, size: 18 })] }));

  const doc = new Document({
    styles: { default: { document: { run: { font: "Calibri", size: 22 } } } },
    sections: [{ properties: {}, children }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${fileBase(formTitle)}.docx`);
}
