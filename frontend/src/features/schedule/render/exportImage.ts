export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Не удалось создать изображение"))),
      "image/png",
    );
  });
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

function toFile(blob: Blob, filename: string): File {
  return new File([blob], filename, { type: "image/png" });
}

/** Можно ли отправить файл через системное меню «Поделиться» (на iPhone — в Фото, Telegram и т.д.). */
export function canShareFile(blob: Blob | null, filename: string): boolean {
  if (!blob) return false;
  if (typeof navigator === "undefined" || typeof navigator.canShare !== "function") return false;
  try {
    return navigator.canShare({ files: [toFile(blob, filename)] });
  } catch {
    return false;
  }
}

export async function shareBlob(blob: Blob, filename: string): Promise<void> {
  try {
    await navigator.share({ files: [toFile(blob, filename)] });
  } catch (error) {
    // Пользователь закрыл меню — это не ошибка.
    if (error instanceof DOMException && error.name === "AbortError") return;
    throw error;
  }
}
