export function readItemLevelFromTitle(ocrText: string): { itemLevel: string; levelDetected: boolean } {
  const lines = ocrText.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const title = /^\[(?:rare|epic|legendary|exc|uncommon)\]$/i.test(lines[0] || '')
    ? lines[1] || ''
    : lines[0] || '';
  const match = title.match(/\+(\d{1,2})(?!\d)/);
  return match
    ? { itemLevel: `+${match[1]}`, levelDetected: true }
    : { itemLevel: '+0', levelDetected: false };
}
