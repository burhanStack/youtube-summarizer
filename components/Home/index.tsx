"use client";
import { useState } from "react";
import styles from "./Home.module.scss";

type Summary = {
  summary: string;
  takeaways: string[];
  timestamps: { ts: string; label: string; desc: string }[];
};
type Message = { role: "user" | "assistant"; content: string };

const STEPS = [
  "Fetching transcript from YouTube…",
  "Chunking & indexing with RAG…",
  "LLM generating summary & takeaways…",
  "Extracting key timestamps…",
];

export default function Home() {
  const [url, setUrl] = useState("");
  const [stage, setStage] = useState<"idle" | "loading" | "done">("idle");
  const [step, setStep] = useState(0);
  const [data, setData] = useState<Summary | null>(null);
  const [transcript, setTranscript] = useState("");
  const [tab, setTab] = useState("summary");
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState("");

  async function analyze() {
    if (!url.trim()) return;
    setError("");
    setStage("loading");
    setStep(1);

    const tRes = await fetch("/api/transcript", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    const tData = await tRes.json();
    if (tData.error) { setError(tData.error); setStage("idle"); return; }
    setTranscript(tData.transcript);
    setStep(2);

    await new Promise((r) => setTimeout(r, 700));
    setStep(3);

    const sRes = await fetch("/api/summarize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transcript: tData.transcript }),
    });
    const summary = await sRes.json();
    if (summary.error) { setError(summary.error); setStage("idle"); return; }

    setStep(4);
    await new Promise((r) => setTimeout(r, 400));

    setData(summary);
    setStage("done");
    setMessages([{ role: "assistant", content: "I've analyzed this video. Ask me anything!" }]);
  }

  async function askQuestion() {
    if (!question.trim() || streaming) return;
    const q = question;
    setQuestion("");
    const history = [...messages, { role: "user" as const, content: q }];
    setMessages([...history, { role: "assistant", content: "" }]);
    setStreaming(true);

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: q, transcript, history: messages }),
    });

    const reader = res.body!.getReader();
    
    const decoder = new TextDecoder();
    let content = '';
    while (true) {
      const { done, value } = await reader.read();
      console.log("reader", decoder.decode(value));
      content += decoder.decode(value);
      if (done) break;
    }

    setMessages((prev) => {
      const updated = [...prev];
      
      updated[updated.length - 1].content = content;
      return updated;
    });
    setStreaming(false);
  }

  const progressPct = (step / STEPS.length) * 100;

  return (
    <main className={styles.container}>
      <h1 className={styles.heading}>
        <span>YouTube</span> AI Summarizer
      </h1>
      <p className={styles.subheading}>
        Paste any YouTube URL — get a summary, takeaways, timestamps & Q&A
      </p>

      <div className={styles.urlBar}>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && analyze()}
          placeholder="https://www.youtube.com/watch?v=..."
        />
        <button
          className={styles.btnPrimary}
          onClick={analyze}
          disabled={!url || stage === "loading"}
        >
          {stage === "loading" ? "Analyzing…" : "Analyze ▶"}
        </button>
      </div>

      {error && <p style={{ color: "#e00", fontSize: 14, marginBottom: 16 }}>{error}</p>}

      {stage === "idle" && (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>▶️</span>
          Paste a YouTube URL above to get started
        </div>
      )}

      {stage === "loading" && (
        <div className={styles.loadingBox}>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${progressPct}%` }} />
          </div>
          {STEPS.map((s, i) => (
            <div
              key={i}
              className={`${styles.stepRow} ${i + 1 < step ? styles.done : ""} ${i + 1 === step ? styles.active : ""}`}
            >
              <div className={`${styles.stepDot} ${i + 1 < step ? styles.done : ""} ${i + 1 === step ? styles.active : ""}`} />
              {s}
            </div>
          ))}
        </div>
      )}

      {stage === "done" && data && (
        <div>
          <div className={styles.tabs}>
            {["summary", "takeaways", "timestamps", "chat"].map((t) => (
              <button
                key={t}
                className={`${styles.tab} ${tab === t ? styles.active : ""}`}
                onClick={() => setTab(t)}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {tab === "summary" && (
            <>
              <p className={styles.sectionLabel}>Overview</p>
              <div className={styles.summaryCard}>{data.summary}</div>
            </>
          )}

          {tab === "takeaways" && (
            <>
              <p className={styles.sectionLabel}>Key takeaways</p>
              {data.takeaways.map((t, i) => (
                <div key={i} className={styles.takeawayItem}>
                  <div className={styles.takeawayBullet} />
                  <span>{t}</span>
                </div>
              ))}
            </>
          )}

          {tab === "timestamps" && (
            <>
              <p className={styles.sectionLabel}>Important moments</p>
              {data.timestamps.map((t, i) => (
                <div key={i} className={styles.timestampRow}>
                  <span className={styles.tsBadge}>{t.ts}</span>
                  <div>
                    <div className={styles.tsLabel}>{t.label}</div>
                    <div className={styles.tsDesc}>{t.desc}</div>
                  </div>
                </div>
              ))}
            </>
          )}

          {tab === "chat" && (
            <>
              <div className={styles.chatHistory}>
                {messages.map((m, i) => (
                  <div
                    key={i}
                    className={m.role === "user" ? styles.msgUser : styles.msgAi}
                  >
                    {m.content || "▋"}
                  </div>
                ))}
              </div>
              <div className={styles.chatInputRow}>
                <input
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && askQuestion()}
                  placeholder="Ask anything about this video…"
                />
                <button
                  className={styles.btnPrimary}
                  onClick={askQuestion}
                  disabled={streaming}
                >
                  Send ↗
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </main>
  );
}