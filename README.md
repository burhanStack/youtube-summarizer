# 🎬 YouTube AI Summarizer

An AI-powered YouTube video summarizer built with **Next.js**, **Groq**, and **RAG (Retrieval-Augmented Generation)**. Paste any YouTube URL and instantly get a summary, key takeaways, timestamped moments, and an interactive Q&A chat — all powered by open-source LLMs running at lightning speed.

---

## ✨ Features

- **📝 Smart Summary** — 1-paragraph overview of the entire video
- **💡 Key Takeaways** — 5 bullet points of the most important points
- **⏱️ Timestamps** — Extracted moments with labels and descriptions
- **💬 Ask Questions** — Streaming Q&A chat grounded in the video transcript
- **⚡ RAG Pipeline** — Chunks and retrieves only relevant transcript context
- **🎨 SCSS Modules** — Clean, scoped styling with `.module.scss`

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14+ (App Router) |
| LLM Provider | [Groq](https://console.groq.com) (free tier) |
| LLM Model | `llama-3.3-70b-versatile` |
| Transcript | `youtube-transcript` npm package |
| RAG | Custom chunking + keyword retrieval (`lib/rag.ts`) |
| Styling | SCSS Modules (`*.module.scss`) |
| Language | TypeScript |

---

## 📁 Project Structure

```
├── app/
│   ├── page.tsx                  # Main UI
│   ├── page.module.scss          # Page styles
│   └── api/
│       ├── transcript/
│       │   └── route.ts          # Fetches YouTube transcript
│       ├── summarize/
│       │   └── route.ts          # Groq: generates summary, takeaways, timestamps
│       └── chat/
│           └── route.ts          # Groq: streaming Q&A with RAG context
├── lib/
│   └── rag.ts                    # Chunking + keyword retrieval
├── .env.local                    # API keys (not committed)
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- A free [Groq API key](https://console.groq.com)
- A YouTube video URL with captions enabled

### 1. Clone the repository

```bash
git clone https://github.com/your-username/youtube-ai-summarizer.git
cd youtube-ai-summarizer
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env.local` file in the root:

```env
GROQ_API_KEY=gsk_your_key_here
GROQ_MODEL=llama-3.3-70b-versatile
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Getting a Groq API Key

1. Go to [console.groq.com](https://console.groq.com)
2. Sign up for a free account
3. Navigate to **API Keys** → **Create API Key**
4. Copy the key and paste it into `.env.local`

> Groq's free tier is generous and more than enough for personal use.

---

## 🤖 Available Models

Change `GROQ_MODEL` in `.env.local` to switch models:

| Model | Speed | Quality | Best For |
|---|---|---|---|
| `llama-3.3-70b-versatile` | Fast | ⭐⭐⭐⭐⭐ | Default — best overall |
| `llama-3.1-8b-instant` | Blazing | ⭐⭐⭐ | Quick answers, low latency |
| `mixtral-8x7b-32768` | Fast | ⭐⭐⭐⭐ | Long context transcripts |
| `gemma2-9b-it` | Very fast | ⭐⭐⭐ | Lightweight tasks |

---

## ⚙️ How It Works

```
Paste YouTube URL
      ↓
/api/transcript  →  youtube-transcript fetches captions with timestamps
      ↓
lib/rag.ts       →  transcript split into 800-char overlapping chunks
      ↓
/api/summarize   →  top chunks sent to Groq → JSON: summary, takeaways, timestamps
      ↓
/api/chat        →  user question → retrieve relevant chunks → stream answer from Groq
```

### RAG Pipeline (`lib/rag.ts`)

The transcript is too long to send to the LLM in full for every question. Instead:

1. **Chunk** — Split transcript into 800-character slices with 100-character overlap (prevents sentences from being cut off at boundaries)
2. **Score** — Each chunk is scored by how many query keywords it contains
3. **Retrieve** — Top 4 scoring chunks are passed as context to Groq
4. **Generate** — Groq streams an answer grounded only in those chunks

---

## 🔧 API Routes

### `POST /api/transcript`

Fetches and formats a YouTube transcript.

**Request:**
```json
{ "url": "https://www.youtube.com/watch?v=..." }
```

**Response:**
```json
{
  "transcript": "[0:00] Welcome to the video [0:05] Today we will...",
  "videoId": "dQw4w9WgXcQ"
}
```

---

### `POST /api/summarize`

Sends transcript context to Groq and returns structured JSON.

**Request:**
```json
{ "transcript": "..." }
```

**Response:**
```json
{
  "summary": "A paragraph overview of the video...",
  "takeaways": ["Point 1", "Point 2", "Point 3", "Point 4", "Point 5"],
  "timestamps": [
    { "ts": "0:00", "label": "Introduction", "desc": "Host introduces the topic" }
  ]
}
```

---

### `POST /api/chat`

Streams a Q&A response using RAG-retrieved context.

**Request:**
```json
{
  "question": "What was the main argument?",
  "transcript": "...",
  "history": [{ "role": "user", "content": "..." }]
}
```

**Response:** `text/plain` stream

---

## 🐛 Troubleshooting

| Problem | Solution |
|---|---|
| `Could not fetch transcript` | The video must have captions. Try a TED Talk, tutorial, or news video |
| `Failed to parse model response` | Set `temperature: 0.1` in `/api/summarize/route.ts` for stricter JSON output |
| `Invalid API Key` | Double-check your `.env.local` — key must start with `gsk_` |
| Timestamps missing | The transcript needs `[M:SS]` markers — most captioned videos have them |
| Slow first response | Normal on first request — Groq warms up fast after that |

---

## 🚧 Potential Improvements

- [ ] **Semantic RAG** — Replace keyword scoring with real embeddings for better retrieval accuracy
- [ ] **Video metadata** — Fetch title, thumbnail, duration via YouTube Data API v3
- [ ] **Summary caching** — Store results by `videoId` in a database (Supabase / Prisma)
- [ ] **Model selector** — Let users pick the Groq model from the UI
- [ ] **Export** — Download summary as PDF or Markdown
- [ ] **Playlist support** — Summarize multiple videos at once
- [ ] **Multi-language** — Support non-English transcripts

---

## 📄 License

MIT — feel free to use, modify, and distribute.

---

## 🙏 Acknowledgements

- [Groq](https://groq.com) — for blazing-fast open-source LLM inference
- [youtube-transcript](https://www.npmjs.com/package/youtube-transcript) — for transcript extraction
- [Meta LLaMA](https://llama.meta.com) — for the underlying open-source model
- [Next.js](https://nextjs.org) — for the app framework