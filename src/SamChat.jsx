import { useState, useRef, useEffect } from "react";
import { Send, Copy, Check, Circle } from "lucide-react";

const SYSTEM_PROMPT = `You are Sam, a sharp, friendly coding and technical assistant. You help write, debug, review, and explain code across languages, and you're equally comfortable talking through architecture, tooling, or a gnarly stack trace.

Style: concise and confident, like a senior engineer who enjoys the craft. Use code blocks (with language tags) for any code. Explain your reasoning briefly rather than exhaustively. Don't pad answers with filler or over-apologize. If a question is ambiguous, make a reasonable assumption, state it in one line, and answer.

You are powered by Claude under the hood, but you go by Sam.`;

const SUGGESTIONS = [
  "explain this error",
  "review my function",
  "write a binary search",
  "why is my useEffect looping",
];

function parseSegments(text) {
  const parts = text.split(/```(\w*)\n?([\s\S]*?)```/g);
  const segments = [];
  for (let i = 0; i < parts.length; i += 3) {
    if (parts[i]) segments.push({ type: "text", content: parts[i] });
    if (parts[i + 2] !== undefined) {
      segments.push({ type: "code", lang: parts[i + 1] || "text", content: parts[i + 2].replace(/\n$/, "") });
    }
  }
  return segments;
}

function InlineText({ text }) {
  const pieces = text.split(/`([^`]+)`/g);
  return (
    <>
      {pieces.map((p, i) =>
        i % 2 === 1 ? (
          <code key={i} className="inline-code">{p}</code>
        ) : (
          <span key={i}>{p}</span>
        )
      )}
    <>
   );
}

function CodeBlock({ lang, content }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };
  return (
    <div className="code-block">
      <div className="code-block-bar">
        <span>{lang}</span>
        <button onClick={copy} className="copy-btn">
          {copied ? <Check size={13} /> : <Copy size={13} />}
          {copied ? "copied" : "copy"}
        </button>
      </div>
      <pre><code>{content}</code></pre>
    </div>
  );
}

function MessageBody({ text }) {
  const segments = parseSegments(text);
  return (
    <div className="msg-body">
      {segments.map((seg, i) =>
        seg.type === "code" ? (
          <CodeBlock key={i} lang={seg.lang} content={seg.content} />
        ) : (
          <p key={i} className="msg-text">
            {seg.content.split("\n").map((line, j) => (
              <span key={j}>
                <InlineText text={line} />
                {j < seg.content.split("\n").length - 1 && <br />}
              </span>
            ))}
          </p>
        )
      )}
    </div>
  );
}

export default function SamChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [booted, setBooted] = useState(false);
  const [bootLine, setBootLine] = useState("");
  const scrollRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    const full = "sam@claude:~$ initializing...";
    let i = 0;
    const iv = setInterval(() => {
      i++;
      setBootLine(full.slice(0, i));
      if (i >= full.length) {
        clearInterval(iv);
        setTimeout(() => setBooted(true), 300);
      }
    }, 22);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const send = async (text) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    const newMessages = [...messages, { role: "user", content }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await response.json();
      const textBlocks = (data.content || [])
        .filter((b) => b.type === "text")
        .map((b) => b.text)
        .join("\n");
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: textBlocks || "hm, I didn't get a response back. try again?" },
      ]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "connection hiccup — couldn't reach the API. try again in a sec." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const autoGrow = (e) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 140) + "px";
  };

  return (
    <div className="app">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap');

        * { box-sizing: border-box; }
        .app {
          --bg: #10121B;
          --panel: #191C28;
          --panel-2: #1F2331;
          --border: #2B2F42;
          --text: #E7E9F2;
          --text-dim: #8C90A8;
          --teal: #5EEAD4;
          --amber: #F5A97F;
          font-family: 'Inter', sans-serif;
          background: var(--bg);
          color: var(--text);
          height: 100vh;
          width: 100%;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .titlebar {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          background: var(--panel);
          border-bottom: 1px solid var(--border);
          flex-shrink: 0;
        }
        .dots { display: flex; gap: 6px; }
        .dot { width: 9px; height: 9px; border-radius: 50%; background: #3A3F55; }
        .titlebar-title {
          flex: 1;
          text-align: center;
          font-family: 'JetBrains Mono', monospace;
          font-size: 12.5px;
          color: var(--text-dim);
          letter-spacing: 0.02em;
        }
        .status {
          display: flex;
          align-items: center;
          gap: 5px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          color: var(--teal);
        }
        .boot-screen {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'JetBrains Mono', monospace;
          color: var(--teal);
          font-size: 14px;
        }
        .caret {
          display: inline-block;
          width: 8px;
          height: 15px;
          background: var(--teal);
          margin-left: 4px;
          animation: blink 1s step-end infinite;
          vertical-align: middle;
        }
        @keyframes blink { 50% { opacity: 0; } }

        .scroll {
          flex: 1;
          overflow-y: auto;
          padding: 20px 16px 8px;
        }
        .empty {
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          gap: 18px;
          padding: 0 20px;
        }
        .empty-mark {
          font-family: 'JetBrains Mono', monospace;
          color: var(--teal);
          font-size: 15px;
        }
        .empty-sub {
          color: var(--text-dim);
          font-size: 13.5px;
          max-width: 320px;
          line-height: 1.5;
        }
        .chips {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          justify-content: center;
          max-width: 360px;
        }
        .chip {
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          color: var(--text-dim);
          border: 1px solid var(--border);
          background: var(--panel);
          padding: 7px 12px;
          border-radius: 3px;
          cursor: pointer;
          transition: border-color 0.15s, color 0.15s;
        }
        .chip:hover { border-color: var(--teal); color: var(--teal); }
        .chip:focus-visible { outline: 2px solid var(--teal); outline-offset: 2px; }

        .row { margin-bottom: 22px; display: flex; }
        .row.user { justify-content: flex-end; }
        .row.assistant { justify-content: flex-start; }

        .bubble-wrap { max-width: 82%; }
        .who {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          color: var(--text-dim);
          margin-bottom: 6px;
          display: flex;
          align-items: center;
          gap: 5px;
        }
        .row.user .who { justify-content: flex-end; color: var(--amber); }
        .row.assistant .who { color: var(--teal); }

        .bubble {
          padding: 11px 14px;
          border-radius: 4px;
          font-size: 14px;
          line-height: 1.55;
        }
        .row.user .bubble {
          background: rgba(245, 169, 127, 0.09);
          border: 1px solid rgba(245, 169, 127, 0.28);
          border-top-right-radius: 0;
        }
        .row.assistant .bubble {
          background: var(--panel);
          border: 1px solid var(--border);
          border-top-left-radius: 0;
        }
        .msg-text { margin: 0; white-space: pre-wrap; }
        .msg-body > * + * { margin-top: 10px; }

        .inline-code {
          font-family: 'JetBrains Mono', monospace;
          background: rgba(94, 234, 212, 0.1);
          color: var(--teal);
          padding: 1px 5px;
          border-radius: 3px;
          font-size: 12.5px;
        }

        .code-block {
          border: 1px solid var(--border);
          border-radius: 4px;
          overflow: hidden;
          background: #0C0E16;
        }
        .code-block-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 6px 10px;
          background: var(--panel-2);
          border-bottom: 1px solid var(--border);
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          color: var(--text-dim);
        }
        .copy-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          background: none;
          border: none;
          color: var(--text-dim);
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          cursor: pointer;
          padding: 2px 4px;
        }
        .copy-btn:hover { color: var(--teal); }
        .code-block pre {
          margin: 0;
          padding: 12px 14px;
          overflow-x: auto;
        }
        .code-block code {
          font-family: 'JetBrains Mono', monospace;
          font-size: 12.5px;
          color: #D2E3E1;
          line-height: 1.6;
        }

        .typing {
          display: flex;
          gap: 4px;
          padding: 4px 2px;
        }
        .typing span {
          width: 5px; height: 5px; border-radius: 50%;
          background: var(--teal);
          animation: pulse 1.2s infinite ease-in-out;
        }
        .typing span:nth-child(2) { animation-delay: 0.15s; }
        .typing span:nth-child(3) { animation-delay: 0.3s; }
        @keyframes pulse { 0%, 80%, 100% { opacity: 0.25; } 40% { opacity: 1; } }

        .inputbar {
          border-top: 1px solid var(--border);
          background: var(--panel);
          padding: 12px 16px;
          flex-shrink: 0;
        }
        .inputbar-inner {
          display: flex;
          align-items: flex-end;
          gap: 10px;
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: 6px;
          padding: 9px 10px 9px 12px;
        }
        .inputbar-inner:focus-within { border-color: var(--teal); }
        .prompt-mark {
          font-family: 'JetBrains Mono', monospace;
          color: var(--teal);
          font-size: 14px;
          padding-bottom: 3px;
        }
        textarea {
          flex: 1;
          background: none;
          border: none;
          outline: none;
          resize: none;
          color: var(--text);
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          line-height: 1.5;
          max-height: 140px;
          padding: 3px 0;
        }
        textarea::placeholder { color: #565B72; }
        .send-btn {
          background: var(--teal);
          border: none;
          color: #0C0E16;
          width: 30px;
          height: 30px;
          border-radius: 5px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          flex-shrink: 0;
        }
        .send-btn:disabled { opacity: 0.35; cursor: default; }
        .send-btn:focus-visible { outline: 2px solid var(--teal); outline-offset: 2px; }

        @media (prefers-reduced-motion: reduce) {
          .caret, .typing span { animation: none; }
        }
      `}</style>

      <div className="titlebar">
        <div className="dots">
          <div className="dot" /><div className="dot" /><div className="dot" />
        </div>
        <div className="titlebar-title">sam — coding assistant</div>
        <div className="status"><Circle size={7} fill="currentColor" /> ready</div>
      </div>

      {!booted ? (
        <div className="boot-screen">
          {bootLine}<span className="caret" />
        </div>
      ) : (
        <>
          <div className="scroll" ref={scrollRef}>
            {messages.length === 0 ? (
              <div className="empty">
                <div className="empty-mark">sam@claude:~$ ready_</div>
                <div className="empty-sub">
                  I'm Sam. Paste an error, drop in a function, or ask me to build something. I'll keep it tight and to the point.
                </div>
                <div className="chips">
                  {SUGGESTIONS.map((s) => (
                    <button key={s} className="chip" onClick={() => send(s)}>{s}</button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((m, i) => (
                  <div key={i} className={`row ${m.role}`}>
                    <div className="bubble-wrap">
                      <div className="who">
                        {m.role === "user" ? "you >" : "> sam"}
                      </div>
                      <div className="bubble">
                        <MessageBody text={m.content} />
                      </div>
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="row assistant">
                    <div className="bubble-wrap">
                      <div className="who">> sam</div>
                      <div className="bubble">
                        <div className="typing"><span /><span /><span /></div>
                      </div>
                    </div>
                  </div>
                )}
              <>
            ))}
          </div>

          <div className="inputbar">
            <div className="inputbar-inner">
              <span className="prompt-mark">$</span>
              <textarea
                ref={textareaRef}
                value={input}
                onChange={autoGrow}
                onKeyDown={onKeyDown}
                placeholder="ask sam anything..."
                rows={1}
              />
              <button className="send-btn" onClick={() => send()} disabled={!input.trim() || loading}>
                <Send size={14} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
