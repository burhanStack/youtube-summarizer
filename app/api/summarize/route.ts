import Groq from "groq-sdk";
import { NextRequest, NextResponse } from "next/server";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
  const { transcript } = await req.json();
  const context = transcript.slice(0, 6000);

  const response = await groq.chat.completions.create({
    model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
    temperature: 0.3,
    messages: [
      {
        role: "user",
        content: `Analyze this YouTube transcript and return ONLY a JSON object. No markdown, no explanation.

Transcript:
${context}

Return exactly:
{
  "summary": "3-5 sentence paragraph summary",
  "takeaways": ["point 1", "point 2", "point 3", "point 4", "point 5"],
  "timestamps": [
    { "ts": "0:00", "label": "Topic label", "desc": "Brief description" }
  ]
}

Extract 5-8 real timestamps from the [M:SS] markers in the transcript.`,
      },
    ],
  });

  const raw = response.choices[0].message.content || "";
  const jsonMatch = raw.match(/\{[\s\S]*\}/);

  try {
    const parsed = JSON.parse(jsonMatch?.[0] || raw);
    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json(
      { error: "Failed to parse model response" },
      { status: 500 }
    );
  }
}