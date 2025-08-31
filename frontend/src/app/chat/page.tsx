'use client';

import React, { useState, useEffect, useRef } from 'react';
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import Image from 'next/image';
import Link from 'next/link';

const CATEGORY_SUBJECT_LIST = {
  psle: {
    science: 'Science',
    mathematics: 'Mathematics',
  },
  o_level: {
    combined_physics: 'Combined_Physics',
    combined_chemistry: 'Combined_Chemistry',
    combined_biology: 'Combined_Biology',
    pure_physics: 'Pure_Physics',
    pure_chemistry: 'Pure_Chemistry',
    pure_biology: 'Pure_Biology',
    add_math: 'Additional_Mathematics',
    elem_math: 'Elementary_Mathematics',
  },
  a_level: {
    h2_mathematics: 'H2_Mathematics',
    h1_mathematics: 'H1_Mathematics',
    h2_biology: 'H2_Biology',
    h1_biology: 'H1_Biology',
    h2_physics: 'H2_Physics',
    h1_physics: 'H1_Physics',
    h2_chemistry: 'H2_Chemistry',
    h1_chemistry: 'H1_Chemistry',
  },
  ib: {
    hl_mathematics: 'HL_Mathematics',
    sl_mathematics: 'SL_Mathematics',
    hl_biology: 'HL_Biology',
    sl_biology: 'SL_Biology',
    hl_physics: 'HL_Physics',
    sl_physics: 'SL_Physics',
    hl_chemistry: 'HL_Chemistry',
    sl_chemistry: 'SL_Chemistry',
  },
};

type LevelKey = keyof typeof CATEGORY_SUBJECT_LIST;

export default function ChatPage() {
  const [selectedLevel, setSelectedLevel] = useState<LevelKey | ''>('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<
    { sender: 'user' | 'bot'; text: string }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const sendMessage = async () => {
    if (!input.trim() || !selectedLevel || !selectedSubject) {
      alert('Please select both level and subject, and enter a message.');
      return;
    }

    const userMessage = input;
    setMessages((prev) => [...prev, { sender: 'user', text: userMessage }]);
    setInput('');
    setLoading(true);

    // Add empty bot message and capture its index correctly
    let botMsgIndex = 0;
    setMessages((prev) => {
      botMsgIndex = prev.length;
      return [...prev, { sender: 'bot', text: '' }];
    });

    try {
      const res = await fetch('http://localhost:8000/api/chat/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          level: selectedLevel,
          subject: selectedSubject,
          history: messages.map((msg) => ({
            role: msg.sender === 'user' ? 'user' : 'assistant',
            content: msg.text,
          })),
        }),
      });

      if (!res.body) throw new Error("ReadableStream not supported");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let botReply = "";

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          botReply += decoder.decode(value, { stream: true });
          setMessages((prev) => {
            const newMessages = [...prev];
            newMessages[botMsgIndex] = { sender: "bot", text: botReply };
            return newMessages;
          });
        }
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: `Network error: ${String(error)}` },
      ]);
    } finally {
      setLoading(false);
    }
  };


  // Auto scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  function Header() {
    return (
      <header className="px-6 py-3 flex bg-sky-200 dark:bg-black justify-between items-center">
        <div className='flex items-center gap-4'>
          <Link href='/' className="">
            <Image 
              src="/Eddy.png"
              alt="Eddy the Educator"
              width={70}
              height={70}
              className="rounded-full"
            />
          </Link>

          <div className="px-2">
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">
              Eddy the Educator
            </h1>

            <h2 className="text-sm mt-1 text-slate-600 dark:text-slate-400">
              Select Level and Subject to start learning!
              <br/> Or click on Eddy to go back home.
            </h2>
          </div>
        </div>

        <div className="flex gap-4 mt-4">
          {/* LEVEL SELECT */}
          <select
            title="level-select"
            className="p-2 px-4 border rounded-2xl bg-white dark:bg-slate-800"
            value={selectedLevel}
            onChange={(e) => {
              setSelectedLevel(e.target.value as LevelKey | '');
              setSelectedSubject('');
            }}
          >
            <option value="">Select Level</option>
            {Object.keys(CATEGORY_SUBJECT_LIST).map((levelKey) => (
              <option key={levelKey} value={levelKey}>
                {levelKey.replace('_', ' ').toUpperCase()}
              </option>
            ))}
          </select>

          {/* SUBJECT SELECT */}
          <select
            title="subject-select"
            className="p-2 px-4 border rounded-2xl bg-white dark:bg-slate-800"
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            disabled={!selectedLevel}
          >
            <option value="">Select Subject</option>
            {selectedLevel &&
              Object.entries(CATEGORY_SUBJECT_LIST[selectedLevel as LevelKey]).map(
                ([subjectKey, subjectLabel]) => (
                  <option key={subjectKey} value={subjectKey}>
                    {subjectLabel.replace(/_/g, ' ')}
                  </option>
                )
              )}
          </select>
        </div>
      </header>
    )
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 text-slate-700 dark:text-slate-300">
      <Header />

      <main className="flex-1 overflow-y-auto p-6 w-full space-y-4">
        {messages.length === 0 && !loading && (
          <div className="flex flex-col justify-center items-center h-100">
            <p className="text-center text-xl text-slate-700 dark:text-slate-300">
              How can I assist you today? Please select a level and subject first to start learning!

              <br />

              You can ask me questions related to your syllabus, past papers, or any topic you need help with. 
            </p>
          </div>
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
              msg.text.split('\n').map((paragraph, i) => {
                const parsed = parseMarkdownWithMath(paragraph.trim());

                  const containsBlockMath = Array.isArray(parsed) &&
                    parsed.some(
                      (el: any) =>
                        React.isValidElement(el) &&
                        el.type === 'BlockMath'
                    );

                  return (
                    <div key={i} className="mb-2">
                      {containsBlockMath ? parsed : <p>{parsed}</p>}
                    </div>
                  );
                })
            ) : (
              msg.text
            )}
          </div>
        ))}

        {loading && (() => {
          const lastBotMessage = [...messages].reverse().find(msg => msg.sender === 'bot');
          if (lastBotMessage && lastBotMessage.text === '') {
            return (
              <div className="mr-auto bg-white dark:bg-slate-700 p-3 rounded-lg w-fit max-w-[70%]">
                <TypingDots />
              </div>
            );
          }
          return null;
        })()}


        <div ref={messagesEndRef} />
      </main>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage();
        }}
        className="flex justify-center p-4 border-t border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-black"
      >
        <div className="flex gap-2 w-4/5 max-w-4xl">
          <input
            type="text"
            className="flex-1 p-3 border border-gray-400 rounded-4xl bg-white dark:bg-slate-700 focus:outline-none focus:ring focus:ring-sky-500"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your question..."
            disabled={loading}
          />
          <button
            type="submit"
            className="px-6 py-3 dark:bg-slate-600 dark:hover:bg-slate-500 bg-sky-600 text-white rounded-4xl hover:bg-sky-700 disabled:opacity-50"
            disabled={loading || !selectedLevel || !selectedSubject}
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

function parseMarkdownWithMath(text: string) {
  // Regex to split text by inline \( ... \) and block \[ ... \] math
  const regex = /(\\\[.*?\\\]|\\\(.*?\\\))/g;
  const parts = text.split(regex);

  return parts.map((part, i) => {
    if (part.startsWith('\\[') && part.endsWith('\\]')) {
      // Remove delimiters \[ and \]
      const math = part.slice(2, -2);
      return <BlockMath key={i} math={math}/>;
    } else if (part.startsWith('\\(') && part.endsWith('\\)')) {
      // Remove delimiters \( and \)
      const math = part.slice(2, -2);
      return <InlineMath key={i} math={math}/>;
    } else {
      // For normal text, also parse **bold**
      return parseBoldMarkdown(part, i);
    }
  });
}

// Updated bold markdown parser to receive a key
function parseBoldMarkdown(text: string, keyBase: number) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      const content = part.slice(2, -2);
      return <strong key={`${keyBase}-${i}`}>{content}</strong>;
    }
    return <React.Fragment key={`${keyBase}-${i}`}>{part}</React.Fragment>;
  });
}