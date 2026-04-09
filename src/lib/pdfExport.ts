"use client";

export async function exportToPdf(
  elementId: string,
  originalFileName: string
): Promise<void> {
  // Dynamic imports to keep PDF libraries out of the server bundle
  const html2canvas = (await import("html2canvas")).default;
  const { jsPDF } = await import("jspdf");

  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Elemento com id "${elementId}" não encontrado`);
  }

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
  });

  const imgData = canvas.toDataURL("image/png");
  const imgWidth = canvas.width;
  const imgHeight = canvas.height;

  const orientation = imgWidth > imgHeight ? "landscape" : "portrait";
  const pdf = new jsPDF({
    orientation,
    unit: "px",
    format: [imgWidth / 2, imgHeight / 2],
  });

  pdf.addImage(imgData, "PNG", 0, 0, imgWidth / 2, imgHeight / 2);

  // Build file name: remove extension, append -dashboard.pdf
  const baseName = originalFileName.replace(/\.[^.]+$/, "");
  pdf.save(`${baseName}-dashboard.pdf`);
}
