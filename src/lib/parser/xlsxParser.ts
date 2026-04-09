import * as XLSX from "xlsx";

export async function parseXlsx(
  file: File
): Promise<Record<string, unknown>[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array", cellDates: true });

  // MVP: apenas a primeira sheet
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  return XLSX.utils.sheet_to_json(sheet, {
    defval: null,
  }) as Record<string, unknown>[];
}
