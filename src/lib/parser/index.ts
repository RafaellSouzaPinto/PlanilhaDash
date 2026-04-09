import { parseCsv } from "./csvParser";
import { parseXlsx } from "./xlsxParser";

const MAX_FILE_SIZE_MB = Number(process.env.NEXT_PUBLIC_MAX_FILE_SIZE_MB ?? process.env.MAX_FILE_SIZE_MB ?? 10);

export async function parseFile(
  file: File
): Promise<Record<string, unknown>[]> {
  if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
    throw new Error(
      `Arquivo muito grande. Máximo permitido: ${MAX_FILE_SIZE_MB}MB`
    );
  }

  const ext = file.name.split(".").pop()?.toLowerCase();

  switch (ext) {
    case "csv":
      return parseCsv(file);
    case "xlsx":
    case "ods":
      return parseXlsx(file);
    default:
      throw new Error(
        `Formato não suportado: .${ext}. Use CSV, XLSX ou ODS.`
      );
  }
}
