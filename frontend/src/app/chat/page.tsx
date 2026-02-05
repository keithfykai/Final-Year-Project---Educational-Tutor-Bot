'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import Image from 'next/image';
import Link from 'next/link';
import { CATEGORY_SUBJECT_LIST } from './consts';

function backendBaseUrl() {
  const url = process.env.NEXT_PUBLIC_BACKEND_URL?.trim();
  if (!url) return '';
  return url.replace(/\/+$/, '');
}

type LevelKey = keyof typeof CATEGORY_SUBJECT_LIST;

type ChatMessage = {
  sender: 'user' | 'bot' | 'system';
  text: string;
};

function isIOSDevice() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const iOS =
    /iPad|iPhone|iPod/.test(ua) ||
    // iPadOS 13+ reports as Mac; detect touch support as hint
    (ua.includes('Mac') && 'ontouchend' in document);
  return iOS;
}

function isMobileDevice() {
  if (typeof navigator === 'undefined') return false;
  return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '');
}

export default function ChatPage() {
  const [selectedLevel, setSelectedLevel] = useState<LevelKey | ''>('');
  const [input, setInput] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);

  const chatScrollRef = useRef<HTMLElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [isNearBottom, setIsNearBottom] = useState(true);
  const shouldAutoScrollRef = useRef(true);

  const prevLevelRef = useRef<LevelKey | ''>('');

  // --- iOS / mobile separation ---
  const isIOS = useMemo(() => (typeof window === 'undefined' ? false : isIOSDevice()), []);
  const isMobile = useMemo(() => (typeof window === 'undefined' ? false : isMobileDevice()), []);
  const useIOSKeyboardFix = isIOS && isMobile;

  // iOS: VisualViewport lift (how much the keyboard overlaps the layout viewport)
  const [kbLiftPx, setKbLiftPx] = useState(0);

  // Input bar height (we measure it so the chat can pad correctly)
  const inputBarRef = useRef<HTMLFormElement>(null);
  const [inputBarH, setInputBarH] = useState(76); // reasonable default
  const [attachmentBarH, setAttachmentBarH] = useState(0);

  function formatLevel(level: string) {
    if (level === 'psle') return 'PSLE';
    if (level === 'o_level') return 'O Level';
    if (level === 'a_level') return 'A Level';
    return level;
  }

  // Focus on load
  useEffect(() => {
    // On iOS, focusing immediately can sometimes cause a weird jump.
    // Delay a tick.
    const t = setTimeout(() => textInputRef.current?.focus(), useIOSKeyboardFix ? 150 : 0);
    return () => clearTimeout(t);
  }, [useIOSKeyboardFix]);

  // System message when level changes
  useEffect(() => {
    if (!selectedLevel) return;

    const prev = prevLevelRef.current;
    const formatted = formatLevel(selectedLevel);

    setMessages((prevMsgs) => [
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

  // Measure input bar height (for padding the scroll area)
  useEffect(() => {
    const el = inputBarRef.current;
    if (!el) return;

    const measure = () => {
      const rect = el.getBoundingClientRect();
      // If rect.height becomes 0 during layout shifts, keep previous.
      if (rect.height > 20) setInputBarH(rect.height);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);

    return () => ro.disconnect();
  }, []);

  // Measure attachment bar height
  useEffect(() => {
    const el = document.getElementById('attachment-bar');
    if (!el) {
      setAttachmentBarH(0);
      return;
    }

    const measure = () => {
      const rect = el.getBoundingClientRect();
      if (rect.height >= 0) setAttachmentBarH(rect.height);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [imageFile]);

  // iOS keyboard handling via VisualViewport
  useEffect(() => {
    if (!useIOSKeyboardFix) return;

    const vv = window.visualViewport;
    if (!vv) return;

    const update = () => {
      // layout viewport height is window.innerHeight
      // visual viewport height shrinks when keyboard opens
      // also the visual viewport can be offset (page zoom / scroll)
      const lift = Math.max(0, window.innerHeight - vv.height - (vv.offsetTop || 0));
      setKbLiftPx(lift);
    };

    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);

    // Some iOS versions need window resize too
    window.addEventListener('resize', update);

    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [useIOSKeyboardFix]);

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
              // ignore
            }
          } catch {
            // ignore partial
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

    setMessages((prev) => [
      ...prev,
      { sender: 'user', text: imageFile ? `${userMessage || ''}\n[Image uploaded]` : userMessage },
      { sender: 'bot', text: '' },
    ]);

    try {
      const url = `${backendBaseUrl()}/llm/chat/stream`;
      let res: Response;

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
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = { sender: 'bot', text: acc };
          return next;
        });
      });

      setImageFile(null);
    } catch (err) {
      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = { sender: 'bot', text: `Error: ${String(err)}` };
        return next;
      });
    } finally {
      setLoading(false);
      // iOS: focusing immediately can re-trigger viewport jump; delay slightly
      setTimeout(() => textInputRef.current?.focus(), useIOSKeyboardFix ? 80 : 0);
    }
  };

  // Auto-scroll behavior
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

  // On focus, ensure we scroll the chat container (NOT the page)
  useEffect(() => {
    const inputEl = textInputRef.current;
    if (!inputEl) return;

    const onFocus = () => {
      requestAnimationFrame(() => {
        // Keep the bottom message visible without page jumping
        messagesEndRef.current?.scrollIntoView({ block: 'end' });
      });
    };

    inputEl.addEventListener('focus', onFocus);
    return () => inputEl.removeEventListener('focus', onFocus);
  }, []);

  // Dynamic bottom padding for the chat scroll area:
  // - input bar height
  // - attachment bar height (if any)
  // - safe area
  // - + iOS keyboard lift (so chat can scroll above the keyboard + fixed input)
  const chatBottomPadStyle: React.CSSProperties = useMemo(() => {
    // iOS fixed input: chat must have enough padding to remain scrollable above it.
    // On web sticky: padding just needs input+attachments.
    const base = inputBarH + attachmentBarH + 12; // little breathing room
    const extra = useIOSKeyboardFix ? kbLiftPx : 0;

    // We also add safe-area inset via CSS var in the global style.
    // Here we add only the measured px parts.
    const total = Math.max(0, base + extra);

    return {
      paddingBottom: `calc(${total}px + var(--safe-bottom, 0px))`,
    };
  }, [inputBarH, attachmentBarH, kbLiftPx, useIOSKeyboardFix]);

  // Input bar positioning style:
  // - iOS mobile: fixed bottom, lifted by keyboard overlap
  // - web: sticky bottom
  const inputBarPositionStyle: React.CSSProperties = useMemo(() => {
    if (!useIOSKeyboardFix) return {};
    // Lift by keyboard overlap; also keep above safe area
    return {
      transform: `translateY(-${kbLiftPx}px)`,
    };
  }, [useIOSKeyboardFix, kbLiftPx]);

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDraggingFile(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (event.currentTarget.contains(event.relatedTarget as Node)) return;
    setIsDraggingFile(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDraggingFile(false);
    const file = event.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setImageFile(file);
    }
  };

  return (
    <div
      className="flex flex-col min-h-[100dvh] h-[100dvh] min-h-0 bg-white dark:bg-black text-black dark:text-white"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <Header
        selectedLevel={selectedLevel}
        setSelectedLevel={setSelectedLevel}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />

      {isDraggingFile && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60">
          <div className="rounded-2xl border border-gray-700 bg-black px-6 py-4 text-white">
            Drop image to upload
          </div>
        </div>
      )}

      {/* Sidebar overlay */}
      <div
        className={`fixed inset-0 z-40 transition-opacity ${isSidebarOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        aria-hidden={!isSidebarOpen}
      >
        <button
          type="button"
          onClick={() => setIsSidebarOpen(false)}
          className="absolute inset-0 bg-black/40"
          aria-label="Close sidebar"
        />
      </div>

      {/* Sidebar - Toggleable on all screen sizes */}
      <aside
        className={`fixed left-0 top-0 z-50 h-full w-[280px] bg-white dark:bg-black border-r border-gray-200 dark:border-gray-800 transform transition-transform duration-200 ease-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        role="navigation"
        aria-label="Navigation"
      >
        <div className="h-[72px] px-5 flex items-center justify-between border-b border-gray-200 dark:border-gray-800">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/Eddy.png" alt="Eduble" width={28} height={28} className="rounded-full" />
            <span className="font-semibold text-black dark:text-white">Eduble</span>
          </Link>
          <button
            type="button"
            onClick={() => setIsSidebarOpen(false)}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-900"
            aria-label="Close sidebar"
          >
            ✕
          </button>
        </div>

        <nav className="px-3 py-4 space-y-1">
          {[
            { href: '/', label: 'Home' },
            { href: '/chat', label: 'Chat' },
            { href: '/quizmode', label: 'Quiz Mode' },
            { href: '/about', label: 'About' },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsSidebarOpen(false)}
              className="block rounded-xl px-4 py-3 text-sm font-medium text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-900"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* CHAT AREA (only this scrolls) */}
      <main
        ref={chatScrollRef as any}
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain"
        onClick={() => textInputRef.current?.focus()}
        onScroll={(e) => {
          const el = e.currentTarget;
          const threshold = 140;
          const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
          setIsNearBottom(distanceFromBottom < threshold);
        }}
      >
        <div
          className="max-w-3xl mx-auto min-h-0 px-6 py-8 space-y-6"
          style={chatBottomPadStyle}
        >
          {messages.map((msg, idx) => {
            if (msg.sender === 'system') {
              return (
                <div key={idx} className="flex justify-center">
                  <div
                    className={`
                      text-xs px-4 py-2 rounded-full
                      bg-gray-200 dark:bg-gray-800
                      text-gray-600 dark:text-gray-400
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
                        bg-gray-100 dark:bg-gray-900
                        border border-gray-200 dark:border-gray-800
                        rounded-2xl px-6 py-5
                        text-sm leading-relaxed
                        whitespace-pre-wrap
                      `}
                    >
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

      {/* Attachment bar (stays above input) */}
      {imageFile && (
        <div
          id="attachment-bar"
          className="border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900"
        >
          <div className="max-w-3xl mx-auto px-6 py-2 flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              Image attached: {imageFile.name}
            </span>
            <button onClick={() => setImageFile(null)} className="text-red-500 hover:underline">
              Remove
            </button>
          </div>
        </div>
      )}

      {/* INPUT BAR:
          - iOS mobile: fixed + keyboard-lift via VisualViewport
          - Web/desktop: sticky bottom-0
      */}
      <form
        ref={inputBarRef}
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage();
        }}
        className={
          useIOSKeyboardFix
            ? `
              fixed left-0 right-0 bottom-0 z-50
              border-t border-gray-200 dark:border-gray-800
              bg-white/95 dark:bg-black/95
              backdrop-blur
              pb-[env(safe-area-inset-bottom)]
            `
            : `
              sticky bottom-0 z-50
              border-t border-gray-200 dark:border-gray-800
              bg-white/95 dark:bg-black/95
              backdrop-blur
              pb-[env(safe-area-inset-bottom)]
            `
        }
        style={inputBarPositionStyle}
      >
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800"
          >
            📎
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
          />

          <input
            ref={textInputRef}
            type="text"
            inputMode="text"
            autoCorrect="on"
            autoCapitalize="sentences"
            className={`
              flex-1 px-4 py-3 rounded-full
              bg-black
              border border-gray-800
              focus:outline-none focus:ring-2 focus:ring-gray-500
              text-white
            `}
            placeholder="Ask a question, paste a problem, or upload an image…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
          />

          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 rounded-full bg-black text-white hover:opacity-80 disabled:opacity-60"
          >
            Send
          </button>
        </div>
      </form>

      {/* GLOBAL CSS:
          - DO NOT set overflow:hidden on body/html for iOS keyboard
          - keep safe area bottom available
      */}
      <style jsx global>{`
        html,
        body,
        #__next {
          height: 100%;
        }

        body {
          margin: 0;
          overscroll-behavior-y: none;
          -webkit-text-size-adjust: 100%;
          touch-action: manipulation;
        }

        :root {
          --safe-bottom: env(safe-area-inset-bottom, 0px);
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
/* ---------------- HEADER ---------------- */
function Header({
  selectedLevel,
  setSelectedLevel,
  isSidebarOpen,
  setIsSidebarOpen,
}: {
  selectedLevel: LevelKey | '';
  setSelectedLevel: (v: LevelKey | '') => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (v: boolean) => void;
}) {
  return (
    <header className="flex-shrink-0 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-black">
      <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-900"
            aria-label="Toggle sidebar"
          >
            ☰
          </button>

          <div
            className="
              group flex items-center gap-3
              px-3 py-2 rounded-full
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
              <div className="absolute inset-0 flex flex-col justify-center">
                <span className="text-sm font-semibold text-black dark:text-white">
                  Eddy Chat
                </span>
              </div>
            </div>
          </div>
        </div>

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
        bg-black
        border border-gray-800
        text-sm
        text-white
        focus:outline-none focus:ring-2 focus:ring-gray-500
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

/* ---------------- UI HELPERS ---------------- */
function TypingDots() {
  return (
    <div className="flex items-center gap-1">
      <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.2s]" />
      <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.1s]" />
      <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" />
    </div>
  );
}

function renderMath(text: string) {
  const parts = text.split(
    /(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$|\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\))/g
  );

  return parts.map((part, idx) => {
    if (part.startsWith('$$') && part.endsWith('$$')) {
      return <BlockMath key={idx} math={part.slice(2, -2)} />;
    }
    if (part.startsWith('$') && part.endsWith('$')) {
      return <InlineMath key={idx} math={part.slice(1, -1)} />;
    }
    if (part.startsWith('\\[') && part.endsWith('\\]')) {
      return <BlockMath key={idx} math={part.slice(2, -2)} />;
    }
    if (part.startsWith('\\(') && part.endsWith('\\)')) {
      return <InlineMath key={idx} math={part.slice(2, -2)} />;
    }
    return <span key={idx}>{part}</span>;
  });
}
