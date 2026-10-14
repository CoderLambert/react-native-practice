export function speechChunks(text: string, max = 2200): string[] {
  if (!Number.isInteger(max) || max < 1) throw new Error('Invalid speech chunk length');
  const points = Array.from(text.trim());
  const chunks: string[] = [];
  for (let i = 0; i < points.length; i += max) chunks.push(points.slice(i, i + max).join(''));
  return chunks;
}
