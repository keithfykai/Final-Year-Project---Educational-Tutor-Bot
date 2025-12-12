'use client';

import React, { useState, useEffect, useRef } from 'react';
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import Image from 'next/image';
import Link from 'next/link';
import { CATEGORY_SUBJECT_LIST } from './consts';

type LevelKey = keyof typeof CATEGORY_SUBJECT_LIST;

const SUPPORTED_LEVELS = ['psle', 'o_level', 'a_level'];

export default function ChatPage() {
  const [selectedLevel, setSelectedLevel] = useState<LevelKey | ''>('');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<
    { sender: 'user' | 'bot'; text: string }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const sendMessage = async () => {
    if (!input.trim() || !selectedLevel) {
      alert('Please select a level, and enter a message.');
      return;
    }

    const userMessage = input;
    setInput('');
    setLoading(true);

    setMessages((prev) => [
      ...prev,
      { sender: 'user', text: userMessage },
      { sender: 'bot', text: '' },
    ]);

    try {
      const res = await fetch('http://localhost:5018/llm/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: selectedLevel,
          prompt: userMessage,
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(err);
      }

      const data = await res.json();

      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          sender: 'bot',
          text: data.response ?? data.output ?? 'No response from model.',
        };
        return updated;
      });

    } catch (error) {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          sender: 'bot',
          text: `Error: ${String(error)}`,
        };
        return updated;
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  function Header() {
    return (
      <header className="px-6 py-3 flex bg-black justify-between items-center">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Image
              src="/Eddy.png"
              alt="Eddy the Educator"
              width={70}
              height={70}
              className="rounded-full"
            />
          </Link>

          <div className="px-2">
            <h1 className="text-xl font-bold text-slate-100">
              Eddy the Educator
            </h1>
            <h2 className="text-sm mt-1 text-slate-400">
              Select a Level to start learning!
            </h2>
          </div>
        </div>

        <div className="flex gap-4">
          <select
            className="p-2 px-4 rounded-2xl bg-slate-800 text-white"
            value={selectedLevel}
            onChange={(e) => {
              setSelectedLevel(e.target.value as LevelKey | '');
            }}
          >
            <option value="">Select Level</option>
            {SUPPORTED_LEVELS.map((levelKey) => (
              <option key={levelKey} value={levelKey}>
                {levelKey.replace('_', ' ').toUpperCase()}
              </option>
            ))}
          </select>
        </div>
      </header>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-black text-slate-300">
      <Header />

      <main className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`p-4 rounded-xl max-w-[60%] whitespace-pre-wrap ${
              msg.sender === 'user'
                ? 'ml-auto bg-sky-900'
                : 'mr-auto bg-slate-700'
            }`}
          >
            {msg.sender === 'bot'
              ? msg.text.split('\n').map((line, i) => (
                  <div key={i}>{parseMarkdownWithMath(line)}</div>
                ))
              : msg.text}
          </div>
        ))}

        {loading &&
          messages[messages.length - 1]?.sender === 'bot' &&
          messages[messages.length - 1]?.text === '' && (
            <div className="mr-auto bg-slate-700 p-3 rounded-xl w-fit">
              <TypingDots />
            </div>
          )}

        <div ref={messagesEndRef} />
      </main>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage();
        }}
        className="flex p-4 border-t border-slate-700 bg-black"
      >
        <input
          type="text"
          className="flex-1 p-3 rounded-l-xl bg-slate-700 text-white"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          placeholder="Type your question..."
        />
        <button
          type="submit"
          disabled={loading}
          className="px-6 bg-sky-600 rounded-r-lg hover:bg-sky-700"
        >
          Send
        </button>
      </form>
    </div>
  );
}

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

function parseMarkdownWithMath(text: string) {
  const regex = /(\\\[.*?\\\]|\\\(.*?\\\))/g;
  const parts = text.split(regex);

  return parts.map((part, i) => {
    if (part.startsWith('\\[')) {
      return <BlockMath key={i} math={part.slice(2, -2)} />;
    }
    if (part.startsWith('\\(')) {
      return <InlineMath key={i} math={part.slice(2, -2)} />;
    }
    return <span key={i}>{part}</span>;
  });
}
