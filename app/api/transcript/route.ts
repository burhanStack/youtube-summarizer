import { YoutubeTranscript } from "youtube-transcript";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { url } = await req.json();

  const videoId = extractVideoId(url);
  if (!videoId)
    return NextResponse.json({ error: "Invalid YouTube URL" }, { status: 400 });

  try {
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);
    const fullText = transcript
      .map((t) => `[${formatTime(t.offset)}] ${t.text}`)
      .join(" ");

    return NextResponse.json({ transcript: fullText, videoId });
  } catch {
    return NextResponse.json(
      { error: "Could not fetch transcript. Make sure captions are enabled." },
      { status: 500 }
    );
  }
}

function extractVideoId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return match ? match[1] : null;
}

function formatTime(ms: number): string {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}