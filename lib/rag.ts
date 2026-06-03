export interface Chunk {
  text: string;
  index: number;
}

export function chunkTranscript(
  transcript: string,
  size = 800,
  overlap = 100
): Chunk[] {
  const chunks: Chunk[] = [];
  let i = 0;
  while (i < transcript.length) {
    chunks.push({ text: transcript.slice(i, i + size), index: chunks.length });
    i += size - overlap;
  }
  return chunks;
}

export function retrieveRelevantChunks(
  chunks: Chunk[],
  query: string,
  topK = 4
): Chunk[] {
  const words = query.toLowerCase().split(/\s+/);
  return chunks
    .map((chunk) => ({
      chunk,
      score: words.reduce(
        (acc, w) => acc + (chunk.text.toLowerCase().includes(w) ? 1 : 0),
        0
      ),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map((s) => s.chunk);
}