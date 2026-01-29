'use client';

import { useState } from 'react';
import ChatCore from './ChatCore';

export default function ChatWidget() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className={`
            fixed bottom-6 right-6 z-50
            w-35 h-12 rounded-full
            bg-sky-600 text-white
            shadow-lg hover:scale-105 transition
          `}
        >
          💬 Chat Now!
        </button>
      )}

      {/* Chat window */}
      {open && (
        <div
          className={`
            fixed bottom-6 right-6 z-50
            w-[360px] h-[520px]
            rounded-2xl shadow-2xl
            border dark:border-slate-700
            overflow-hidden
            bg-white dark:bg-slate-900
            flex flex-col
          `}
        >
        {/* Info banner */}
        <div className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300
                        bg-slate-50 dark:bg-slate-800
                        border-b dark:border-slate-700
                        flex items-center justify-between">
        <span>
            For the best experience, open this chat in a new tab.
        </span>

        <a
            href="/chat"
            target="_blank"
            rel="noopener noreferrer"
            className="
            ml-3 inline-flex items-center gap-1
            font-medium text-sky-600 dark:text-sky-400
            hover:text-sky-700 dark:hover:text-sky-300
            transition-colors
            "
        >
            Open Chat
            <span aria-hidden>↗</span>
        </a>
        </div>

          {/* Close bar */}
          <div className="flex justify-end px-3 py-2 border-b dark:border-slate-700">
            <button
              onClick={() => setOpen(false)}
              className="text-sm text-slate-500 hover:text-slate-800"
            >
              ✕
            </button>
          </div>

          <ChatCore />
        </div>
      )}
    </>
  );
}
