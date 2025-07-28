'use client';

import React, { useState } from 'react';

const levels = ['PSLE', 'A Levels', 'O Levels'];
const subjects = ['Mathematics', 'Science'];

export default function ChatPage() {
  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<
    { sender: 'user' | 'bot'; text: string }[]
  >([]);

  const sendMessage = () => {
    if (!input.trim()) return;

    setMessages((prev) => [...prev, { sender: 'user', text: input }]);
    // Simulate bot response (replace with real API call)
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { sender: 'bot', text: `Bot response to: "${input}"` },
      ]);
    }, 500);

    setInput('');
  };

  return (
    <main className="max-w-3xl mx-auto p-6 text-slate-700 dark:text-slate-300">
      <h1 className="text-3xl font-bold mb-4 text-slate-800 dark:text-slate-100">Educational Tutor Chat</h1>

      <div className="flex gap-4 mb-6">
        <select
          title='level-select'
          className="p-2 px-4 border rounded bg-white dark:bg-slate-800"
          value={selectedLevel}
          onChange={(e) => setSelectedLevel(e.target.value)}
        >
          <option value="">Select Level</option>
          {levels.map((level) => (
            <option key={level} value={level}>{level}</option>
          ))}
        </select>

        <select
          title='subject-select'
          className="p-2 border rounded bg-white dark:bg-slate-800"
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
        >
          <option value="">Select Subject</option>
          {subjects.map((subject) => (
            <option key={subject} value={subject}>{subject}</option>
          ))}
        </select>
      </div>

      <div className="h-96 overflow-y-auto p-4 border rounded-lg bg-slate-50 dark:bg-slate-800 mb-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-center text-slate-400">Start chatting with your tutor bot...</p>
        )}
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`p-3 rounded-lg w-fit max-w-[70%] ${
              msg.sender === 'user'
                ? 'ml-auto bg-sky-100 dark:bg-sky-900'
                : 'mr-auto bg-white dark:bg-slate-700'
            }`}
          >
            {msg.text}
          </div>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage();
        }}
        className="flex gap-2"
      >
        <input
          type="text"
          className="flex-1 p-2 border rounded bg-white dark:bg-slate-800"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your question..."
        />
        <button
          type="submit"
          className="px-4 py-2 bg-sky-600 text-white rounded hover:bg-sky-700"
        >
          Send
        </button>
      </form>
    </main>
  );
}
