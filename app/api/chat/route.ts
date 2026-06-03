import Groq from "groq-sdk";
import { NextRequest } from "next/server";
import { chunkTranscript, retrieveRelevantChunks } from "@/lib/rag";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
  const { question, transcript, history } = await req.json();

  const chunks = chunkTranscript(transcript);
  const relevant = retrieveRelevantChunks(chunks, question);
  const context = relevant.map((c) => c.text).join("\n---\n");

  const stream = await groq.chat.completions.create({
    model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
    temperature: 0.5,
    stream: true,
    messages: [
      {
        role: "system",
        content: `You are a helpful assistant answering questions about a YouTube video.
Use only the context below. Be concise and direct.

Context:
${context}`,
      },
      ...history,
      { role: "user", content: question },
    ],
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content || "";
        if (text) controller.enqueue(encoder.encode(text));
      }
      controller.close();
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}