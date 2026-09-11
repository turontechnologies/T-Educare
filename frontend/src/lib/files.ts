/**
 * Reads a picked file into a base64 data: URL rather than
 * `URL.createObjectURL` — a blob URL only resolves within the browser tab
 * that created it (it's a reference into that tab's memory), so it breaks
 * the moment the value is read back from a `persist`-backed store in a
 * different tab, a different login session, or even the same tab after a
 * reload. A data: URL is a plain, self-contained string, so it survives
 * being written to `localStorage` and read back anywhere — required for
 * uploads like an institution logo or a User Manager's avatar, which are
 * meant to be visible to every session that reads that record, not just
 * the one that uploaded it.
 */
export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
