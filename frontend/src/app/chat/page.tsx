'use client';

import React, { useState, useEffect, useRef } from 'react';
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import Image from 'next/image';
import Link from 'next/link';
import { CATEGORY_SUBJECT_LIST } from './consts';

function backendBaseUrl() {
  const url = process.env.NEXT_PUBLIC_BACKEND_URL?.trim();

  if (!url) return ""; // same-origin: fetch("/llm/...")
  return url.replace(/\/+$/, ""); // remove trailing slash
}

type LevelKey = keyof typeof CATEGORY_SUBJECT_LIST;

export default function ChatPage() {
  const [selectedLevel, setSelectedLevel] = useState<LevelKey | ''>('');
  const [input, setInput] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatScrollRef = useRef<HTMLElement | null>(null);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const shouldAutoScrollRef = useRef(true);

  type ChatMessage = {
    sender: 'user' | 'bot' | 'system';
    text: string;
  };
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  function formatLevel(level: string) {
    if (level === 'psle') return 'PSLE';
    if (level === 'o_level') return 'O Level';
    if (level === 'a_level') return 'A Level';
    return level;
  }

  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevLevelRef = useRef<LevelKey | ''>('');
  const textInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    textInputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!selectedLevel) return;

    const prev = prevLevelRef.current;
    const formatted = formatLevel(selectedLevel);

    setMessages(prevMsgs => [
      ...prevMsgs,
      {
        sender: 'system',
        text:
          prev === ''
            ? `🔔 Level has been set to ${formatted}`
            : `🔔 Level changed to ${formatted}`,
      },
    ]);

    prevLevelRef.current = selectedLevel;
  }, [selectedLevel]);

  // --- Streaming helper: parse SSE from fetch() ---
  const streamSSE = async (res: Response, onDelta: (t: string) => void) => {
    if (!res.body) throw new Error('No response body (streaming not supported).');

    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');

    let buffer = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // SSE events end with double newline
      const parts = buffer.split('\n\n');
      buffer = parts.pop() ?? '';

      for (const part of parts) {
        const lines = part.split('\n');
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice('data: '.length).trim();
          if (!jsonStr) continue;

          try {
            const evt = JSON.parse(jsonStr);

            if (evt.type === 'delta' && typeof evt.delta === 'string') {
              onDelta(evt.delta);
            } else if (evt.type === 'error') {
              throw new Error(evt.error || 'Stream error');
            } else if (evt.type === 'done') {
              // server always sends done; we can ignore here
            }
          } catch (e) {
            // If JSON parse fails due to partial chunking, ignore (buffer should handle most cases)
            // But if it’s a real error event we rethrow above.
          }
        }
      }
    }
  };

  const sendMessage = async () => {
    if (!selectedLevel) {
      alert('Please select a level.');
      return;
    }

    if (!input.trim() && !imageFile) {
      alert('Please enter a message or upload an image.');
      return;
    }

    const userMessage = input;
    setInput('');
    setLoading(true);
    shouldAutoScrollRef.current = true;

    // Add user message + bot placeholder (empty initially)
    setMessages(prev => [
      ...prev,
      {
        sender: 'user',
        text: imageFile ? `${userMessage || ''}\n[Image uploaded]` : userMessage,
      },
      { sender: 'bot', text: '' },
    ]);

    try {
      let res: Response;

      // STREAM endpoint (supports same-origin or NEXT_PUBLIC_BACKEND_URL)
      const url = `${backendBaseUrl()}/llm/chat/stream`;

      if (imageFile) {
        const formData = new FormData();
        formData.append('level', selectedLevel);
        if (userMessage.trim()) formData.append('prompt', userMessage);
        formData.append('image', imageFile);

        res = await fetch(url, { method: 'POST', body: formData });
      } else {
        res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ level: selectedLevel, prompt: userMessage }),
        });
      }

      if (!res.ok) throw new Error(await res.text());

      let acc = '';

      await streamSSE(res, (delta) => {
        acc += delta;

        setMessages(prev => {
          const next = [...prev];
          // Update last message (bot placeholder)
          next[next.length - 1] = { sender: 'bot', text: acc };
          return next;
        });
      });

      setImageFile(null);
    } catch (err) {
      setMessages(prev => {
        const next = [...prev];
        next[next.length - 1] = {
          sender: 'bot',
          text: `Error: ${String(err)}`,
        };
        return next;
      });
    } finally {
      setLoading(false);
      requestAnimationFrame(() => {
        textInputRef.current?.focus();
      });
    }
  };

  useEffect(() => {
    const el = chatScrollRef.current;
    if (!el) return;

    if (!isNearBottom && !shouldAutoScrollRef.current) return;

    requestAnimationFrame(() => {
      el.scrollTo({
        top: el.scrollHeight,
        behavior: shouldAutoScrollRef.current ? 'smooth' : 'auto',
      });
      shouldAutoScrollRef.current = false;
    });
  }, [messages, isNearBottom]);

  return (
    <div className="flex flex-col h-dvh min-h-0 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
      <Header selectedLevel={selectedLevel} setSelectedLevel={setSelectedLevel} />

      {/* CHAT AREA */}
      <main
        ref={chatScrollRef as any}
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain"
        onClick={() => textInputRef.current?.focus()}
        onScroll={(e) => {
          const el = e.currentTarget;
          const threshold = 120;
          const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
          setIsNearBottom(distanceFromBottom < threshold);
        }}
      >
        <div className="max-w-3xl mx-auto min-h-0 px-6 py-8 space-y-6">
          {messages.map((msg, idx) => {
            // SYSTEM MESSAGE
            if (msg.sender === 'system') {
              return (
                <div key={idx} className="flex justify-center">
                  <div
                    className={`
                      text-xs px-4 py-2 rounded-full
                      bg-slate-200 dark:bg-slate-700
                      text-slate-600 dark:text-slate-300
                    `}
                  >
                    {msg.text}
                  </div>
                </div>
              );
            }

            return (
              <div
                key={idx}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'user' ? (
                  <div
                    className={`
                      inline-block max-w-[75%]
                      px-5 py-4 rounded-2xl
                      text-sm leading-relaxed
                      whitespace-pre-wrap break-words
                      bg-sky-600 text-white
                    `}
                  >
                    {msg.text}
                  </div>
                ) : (
                  <div className="w-full">
                    <div
                      className={`
                        bg-white dark:bg-slate-800
                        border border-slate-200 dark:border-slate-700
                        rounded-2xl px-6 py-5
                        text-sm leading-relaxed
                        whitespace-pre-wrap
                      `}
                    >
                      {/* If empty, show typing dots while streaming */}
                      {msg.text ? renderMath(msg.text) : <TypingDots />}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {imageFile && (
        <div className="border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
          <div className="max-w-3xl mx-auto px-6 py-2 flex items-center justify-between text-sm">
            <span className="text-slate-600 dark:text-slate-400">
              Image attached: {imageFile.name}
            </span>
            <button
              onClick={() => setImageFile(null)}
              className="text-red-500 hover:underline"
            >
              Remove
            </button>
          </div>
        </div>
      )}

      {/* INPUT */}
      <form
        onSubmit={e => {
          e.preventDefault();
          sendMessage();
        }}
        className="border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
      >
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            📎
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => setImageFile(e.target.files?.[0] ?? null)}
          />

          <input
            ref={textInputRef}
            type="text"
            className={`
              flex-1 px-4 py-3 rounded-full
              bg-slate-100 dark:bg-slate-800
              border border-slate-200 dark:border-slate-700
              focus:outline-none focus:ring-2 focus:ring-sky-500
            `}
            placeholder="Ask a question, paste a problem, or upload an image…"
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={loading}
          />

          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 rounded-full bg-sky-600 hover:bg-sky-700 text-white"
          >
            Send
          </button>
        </div>
      </form>

      {/* GLOBAL KATEX FIX */}
      <style jsx global>{`
        html,
        body,
        #__next {
          height: 100%;
          overflow: hidden;
        }

        .katex-display {
          overflow-x: auto;
          max-width: 100%;
          margin: 0.75rem 0;
        }

        .katex {
          white-space: normal;
          max-width: 100%;
        }
      `}</style>
    </div>
  );
}

/* ---------------- HELPERS ---------------- */
function Header({
  selectedLevel,
  setSelectedLevel,
}: {
  selectedLevel: LevelKey | '';
  setSelectedLevel: (v: LevelKey | '') => void;
}) {
  return (
    <header className="flex-shrink-0 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
      <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
        <Link href="/" aria-label="Back Home">
          <div
            className="
              group flex items-center gap-3
              px-3 py-2 rounded-full
              cursor-pointer
              hover:bg-slate-100 dark:hover:bg-slate-800
              transition-colors
              h-[48px]
            "
          >
            <Image
              src="/Eddy.png"
              alt="Eduble"
              width={36}
              height={36}
              className="rounded-full shrink-0"
            />

            <div className="relative h-[32px] w-[160px] overflow-hidden">
              <div
                className="
                  absolute inset-0 flex flex-col justify-center
                  transition-all duration-300
                  group-hover:opacity-0 group-hover:translate-x-[-8px]
                "
              >
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Eddy Chat
                </span>
              </div>

              <div
                className="
                  absolute inset-0 flex flex-col justify-center
                  opacity-0 translate-x-[8px]
                  transition-all duration-300
                  group-hover:opacity-100 group-hover:translate-x-0
                "
              >
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Back Home
                </span>
              </div>
            </div>
          </div>
        </Link>

        <LevelSelect selectedLevel={selectedLevel} setSelectedLevel={setSelectedLevel} />
      </div>
    </header>
  );
}

function LevelSelect({
  selectedLevel,
  setSelectedLevel,
}: {
  selectedLevel: LevelKey | '';
  setSelectedLevel: (v: LevelKey | '') => void;
}) {
  return (
    <select
      className="
        px-4 py-2 rounded-full
        bg-slate-100 dark:bg-slate-800
        border border-slate-200 dark:border-slate-700
        text-sm
        focus:outline-none focus:ring-2 focus:ring-sky-500
      "
      value={selectedLevel}
      onChange={(e) => setSelectedLevel(e.target.value as LevelKey)}
    >
      <option value="" disabled>
        Select level…
      </option>
      <option value="psle">PSLE</option>
      <option value="o_level">O Level</option>
      <option value="a_level">A Level</option>
    </select>
  );
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1">
      <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.2s]" />
      <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.1s]" />
      <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" />
    </div>
  );
}

function renderMath(text: string) {
  const parts = text.split(/(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$|\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\))/g);

  return parts.map((part, idx) => {
    if (part.startsWith('$$') && part.endsWith('$$')) {
      return <BlockMath key={idx}>{part.slice(2, -2)}</BlockMath>;
    }
    if (part.startsWith('$') && part.endsWith('$')) {
      return <InlineMath key={idx}>{part.slice(1, -1)}</InlineMath>;
    }
    if (part.startsWith('\\[') && part.endsWith('\\]')) {
      return <BlockMath key={idx}>{part.slice(2, -2)}</BlockMath>;
    }
    if (part.startsWith('\\(') && part.endsWith('\\)')) {
      return <InlineMath key={idx}>{part.slice(2, -2)}</InlineMath>;
    }
    return <span key={idx}>{part}</span>;
  });
}
