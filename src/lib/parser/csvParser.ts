import Papa from "papaparse";

export function parseCsv(file: File): Promise<Record<string, unknown>[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (result) => {
        resolve(result.data as Record<string, unknown>[]);
      },
      error: (error) => {
        reject(new Error(error.message));
      },
    });
  });
}
