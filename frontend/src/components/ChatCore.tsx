'use client';

import React, { useState, useEffect, useRef } from 'react';
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import Image from 'next/image';
import { CATEGORY_SUBJECT_LIST } from '../app/chat/consts';

type LevelKey = keyof typeof CATEGORY_SUBJECT_LIST;

const SUPPORTED_LEVELS = ['psle', 'o_level', 'a_level'];

export default function ChatPage() {
  const [selectedLevel, setSelectedLevel] = useState<LevelKey | ''>('');
  const [input, setInput] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

    setMessages(prev => [
      ...prev,
      {
        sender: 'user',
        text: imageFile
          ? `${userMessage || ''}\n[Image uploaded]`
          : userMessage,
      },
      { sender: 'bot', text: '' },
    ]);

    try {
      let res: Response;

      if (imageFile) {
        const formData = new FormData();
        formData.append('level', selectedLevel);
        if (userMessage.trim()) {
          formData.append('prompt', userMessage);
        }
        formData.append('image', imageFile);

        res = await fetch('http://localhost:5000/llm/chat', {
          method: 'POST',
          body: formData,
        });
      } else {
        res = await fetch('http://localhost:5000/llm/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            level: selectedLevel,
            prompt: userMessage,
          }),
        });
      }

      if (!res.ok) throw new Error(await res.text());

      const data = await res.json();

      setMessages(prev => {
        const next = [...prev];
        next[next.length - 1] = {
          sender: 'bot',
          text: data.response ?? data.output ?? 'No response from model.',
        };
        return next;
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
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  return (
    <div className="flex flex-col h-dvh min-h-0 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
      <Header
        selectedLevel={selectedLevel}
        setSelectedLevel={setSelectedLevel}
      />

      {/* CHAT AREA */}
      <main className="flex-1 min-h-0 overflow-y-auto overscroll-contain"
          onClick={() => textInputRef.current?.focus()}
          >
        <div className="max-w-3xl mx-auto min-h-0 px-6 py-8 space-y-6">
          {messages.map((msg, idx) => {
            // 🚫 Skip empty bot placeholder (used only for loading)
            if (msg.sender === 'bot' && msg.text === '') return null;

            // 🔔 SYSTEM MESSAGE (e.g. level change)
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
                className={`flex ${
                  msg.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.sender === 'user' ? (
                  /* USER MESSAGE — right-aligned, size to content */
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
                  /* BOT MESSAGE — full width */
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
                      {renderMath(msg.text)}
                    </div>

                  </div>
                )}
              </div>
            );
          })}


          {loading &&
            messages[messages.length - 1]?.sender === 'bot' &&
            messages[messages.length - 1]?.text === '' && (
              <div className="w-full">
                <div
                  className={`
                    bg-white dark:bg-slate-800
                    border border-slate-200 dark:border-slate-700
                    rounded-2xl px-6 py-4 w-fit
                  `}
                >
                  <TypingDots />
                </div>
              </div>
            )}

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
      <div className="px-4 py-3 flex items-center justify-between">
        {/* LEFT: Chat identity (no navigation) */}
        <div className="flex items-center gap-2">
          <Image
            src="/Eddy.png"
            alt="Eduble"
            width={28}
            height={28}
            className="rounded-full"
          />
          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Eduble
          </span>
        </div>

        {/* RIGHT: Level selector */}
        <select
          className="
            appearance-none
            text-xs px-3 py-1.5
            rounded-full
            bg-slate-100 dark:bg-slate-800
            border border-slate-200 dark:border-slate-700
            focus:outline-none focus:ring-2 focus:ring-sky-500
            w-[90px]
            text-center
          "
          value={selectedLevel}
          onChange={e => setSelectedLevel(e.target.value as LevelKey | '')}
        >
          <option value="">Level</option>
          <option value="psle">PSLE</option>
          <option value="o_level">O Level</option>
          <option value="a_level">A Level</option>
        </select>
      </div>
    </header>
  );
}

/* --------- MATH RENDERER --------- */

function renderMath(text: string) {
  const regex = /(\\\[([\s\S]*?)\\\]|\\\((.*?)\\\))/g;
  const nodes: React.ReactNode[] = [];

  let last = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) {
      nodes.push(<span key={last}>{text.slice(last, match.index)}</span>);
    }

    if (match[2]) {
      nodes.push(
        <div key={match.index} className="overflow-x-auto">
          <BlockMath math={match[2]} />
        </div>
      );
    }

    if (match[3]) {
      nodes.push(
        <InlineMath key={match.index} math={match[3]} />
      );
    }

    last = regex.lastIndex;
  }

  if (last < text.length) {
    nodes.push(<span key={last}>{text.slice(last)}</span>);
  }

  return nodes;
}

/* --------- TYPING DOTS --------- */

function TypingDots() {
  return (
    <span className="inline-flex gap-1">
      <Dot delay="0" />
      <Dot delay="200" />
      <Dot delay="400" />
    </span>
  );
}

function Dot({ delay }: { delay: string }) {
  return (
    <span
      className="w-2 h-2 bg-sky-500 rounded-full animate-bounce"
      style={{ animationDelay: `${delay}ms` }}
    />
  );
}
