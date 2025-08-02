'use client';

import React, { useState, useEffect, useRef } from 'react';

const levels = ['PSLE', 'A Levels', 'O Levels'];
const subjects = ['Mathematics', 'Science'];

export default function ChatPage() {
  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<
    { sender: 'user' | 'bot'; text: string }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    setMessages((prev) => [...prev, { sender: 'user', text: userMessage }]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('http://localhost:8000/api/chat/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          history: messages.map((msg) => ({
            role: msg.sender === 'user' ? 'user' : 'assistant',
            content: msg.text,
          })),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessages((prev) => [
          ...prev,
          { sender: 'bot', text: data.response || '[No response from bot]' },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { sender: 'bot', text: `Error: ${data.error || 'Unknown error'}` },
        ]);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { sender: 'bot', text: `Network error: ${String(error)}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Auto scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300">
      <header className="p-6 border-b border-slate-300 dark:border-slate-700">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
          Educational Tutor Chat
        </h1>

        <div className="flex gap-4 mt-4">
          <select
            title="level-select"
            className="p-2 px-4 border rounded bg-white dark:bg-slate-800"
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
          >
            <option value="">Select Level</option>
            {levels.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>

          <select
            title="subject-select"
            className="p-2 border rounded bg-white dark:bg-slate-800"
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
          >
            <option value="">Select Subject</option>
            {subjects.map((subject) => (
              <option key={subject} value={subject}>
                {subject}
              </option>
            ))}
          </select>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6 max-w-5xl mx-auto space-y-4">
        {messages.length === 0 && !loading && (
          <p className="text-center text-slate-400">
            Start chatting with your tutor bot...
          </p>
        )}

        {messages.map((msg, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg max-w-[60%] whitespace-pre-wrap ${
              msg.sender === 'user'
                ? 'ml-auto bg-sky-100 dark:bg-sky-900'
                : 'mr-auto bg-white dark:bg-slate-700'
            }`}
          >
            {msg.sender === 'bot' ? (
              msg.text.split('\n').map((paragraph, i) => (
                <p key={i} className="mb-2">
                  {parseBoldMarkdown(paragraph.trim())}
                </p>
              ))
            ) : (
              msg.text
            )}
          </div>
        ))}

        {loading && (
          <div className="mr-auto bg-white dark:bg-slate-700 p-3 rounded-lg w-fit max-w-[70%]">
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
        className="flex justify-center p-4 border-t border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800"
      >
        <div className="flex gap-2 w-4/5 max-w-4xl">
          <input
            type="text"
            className="flex-1 p-3 border rounded bg-white dark:bg-slate-700 focus:outline-none focus:ring focus:ring-sky-500"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your question..."
            disabled={loading}
          />
          <button
            type="submit"
            className="px-6 py-3 bg-sky-600 text-white rounded hover:bg-sky-700 disabled:opacity-50"
            disabled={loading}
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}

// Typing animation component
function TypingDots() {
  return (
    <span className="inline-flex items-center space-x-1">
      <Dot delay="0" />
      <Dot delay="200" />
      <Dot delay="400" />
    </span>
  );
}

function Dot({ delay }: { delay: string }) {
  return (
    <span
      className="w-2 h-2 bg-sky-600 rounded-full animate-bounce"
      style={{ animationDelay: `${delay}ms` }}
    />
  );
}

// Parse **bold** markdown inside text
function parseBoldMarkdown(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      const content = part.slice(2, -2);
      return <strong key={i}>{content}</strong>;
    }
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
}
