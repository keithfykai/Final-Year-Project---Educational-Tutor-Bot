'use client';

import React, { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { getAuthClient, getFirestoreClient } from 'firebase/firebaseClient';
import {
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';
import { Home, BookOpen, Pencil } from 'lucide-react';
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
  timestamp?: Date;
  imageUrl?: string;
};

type SessionMeta = {
  id: string;
  title: string;
  level: LevelKey | null;
  subject: string | null;
  createdAt: Date;
  lastMessageAt: Date;
  messageCount: number;
};

function isIOSDevice() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const iOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (ua.includes('Mac') && 'ontouchend' in document);
  return iOS;
}

function isMobileDevice() {
  if (typeof navigator === 'undefined') return false;
  return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '');
}

function relativeTime(date: Date): string {
  const now = Date.now();
  const diff = now - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

// ─── Inner chat component (uses useSearchParams) ──────────────────────────────
function ChatInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionIdParam = searchParams.get('session');

  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<LevelKey | ''>('');
  const [input, setInput] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Session state
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(sessionIdParam);
  const currentSessionIdRef = useRef<string | null>(sessionIdParam);
  const [sessions, setSessions] = useState<SessionMeta[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sessionMessagesLoading, setSessionMessagesLoading] = useState(false);
  const [renamingSessionId, setRenamingSessionId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);
  const chatScrollRef = useRef<HTMLElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [isNearBottom, setIsNearBottom] = useState(true);
  const shouldAutoScrollRef = useRef(true);
  const prevLevelRef = useRef<LevelKey | ''>('');
  const skipNextSessionLoadRef = useRef<string | null>(null);
  const conversationHistory = useRef<Array<{ sender: 'user' | 'bot'; text: string }>>([]);

  const isIOS = useMemo(() => (typeof window === 'undefined' ? false : isIOSDevice()), []);
  const isMobile = useMemo(() => (typeof window === 'undefined' ? false : isMobileDevice()), []);
  const useIOSKeyboardFix = isIOS && isMobile;
  const [isDesktop, setIsDesktop] = useState(false);

  const [kbLiftPx, setKbLiftPx] = useState(0);
  const inputBarRef = useRef<HTMLFormElement>(null);
  const [inputBarH, setInputBarH] = useState(76);
  const [attachmentBarH, setAttachmentBarH] = useState(0);

  // ─── Auth ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const auth = getAuthClient();
    const unsub = onAuthStateChanged(auth, (user) => {
      setAuthUser(user);
      setAuthChecked(true);
      if (!user) router.replace('/signin');
    });
    return () => unsub();
  }, [router]);

  // ─── Load sessions list ────────────────────────────────────────────────────
  useEffect(() => {
    if (!authUser) return;
    const fetchSessions = async () => {
      setSessionsLoading(true);
      try {
        const db = getFirestoreClient();
        const sessionsRef = collection(db, 'users', authUser.uid, 'chatSessions');
        const q = query(sessionsRef, orderBy('lastMessageAt', 'desc'), limit(30));
        const snap = await getDocs(q);
        const loaded: SessionMeta[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            title: data.title || 'Untitled Chat',
            level: data.level || null,
            subject: data.subject || null,
            createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
            lastMessageAt: (data.lastMessageAt as Timestamp)?.toDate() || new Date(),
            messageCount: data.messageCount || 0,
          };
        });
        setSessions(loaded);
      } catch (e) {
        console.error('Error loading sessions:', e);
      } finally {
        setSessionsLoading(false);
      }
    };
    fetchSessions();
  }, [authUser]);

  // ─── One-time migration from old flat schema ───────────────────────────────
  useEffect(() => {
    if (!authUser) return;
    const migrate = async () => {
      const db = getFirestoreClient();
      const userDocRef = doc(db, 'users', authUser.uid);
      const userDoc = await getDoc(userDocRef);
      const migrationVersion = userDoc.data()?.migrationVersion ?? 0;
      if (migrationVersion >= 1) return; // already migrated

      const oldMessagesRef = collection(db, 'users', authUser.uid, 'messages');
      const oldSnap = await getDocs(query(oldMessagesRef, orderBy('timestamp', 'asc')));
      if (oldSnap.empty) {
        // Nothing to migrate — just mark as done
        await setDoc(userDocRef, { migrationVersion: 1 }, { merge: true });
        return;
      }

      // Create an "Imported Chat" session
      const sessionsRef = collection(db, 'users', authUser.uid, 'chatSessions');
      const importedSessionRef = await addDoc(sessionsRef, {
        title: 'Imported Chat',
        level: null,
        subject: null,
        createdAt: serverTimestamp(),
        lastMessageAt: serverTimestamp(),
        messageCount: oldSnap.size,
        isArchived: false,
        topicsDetected: [],
      });

      // Copy messages to new session
      const newMessagesRef = collection(
        db,
        'users',
        authUser.uid,
        'chatSessions',
        importedSessionRef.id,
        'messages'
      );
      for (const d of oldSnap.docs) {
        const data = d.data();
        await addDoc(newMessagesRef, {
          sender: data.sender,
          text: data.text || '',
          timestamp: data.timestamp || serverTimestamp(),
          imageUrl: data.imageUrl || null,
        });
      }

      await setDoc(userDocRef, { migrationVersion: 1 }, { merge: true });
      console.log('[Migration] Imported', oldSnap.size, 'messages into session', importedSessionRef.id);
    };
    migrate().catch(console.error);
  }, [authUser]);

  // ─── Load messages for a session ──────────────────────────────────────────
  const loadSessionMessages = async (sessionId: string, uid: string) => {
    setSessionMessagesLoading(true);
    setMessages([]);
    conversationHistory.current = [];
    try {
      const db = getFirestoreClient();
      const msgsRef = collection(db, 'users', uid, 'chatSessions', sessionId, 'messages');
      const q = query(msgsRef, orderBy('timestamp', 'asc'), limit(100));
      const snap = await getDocs(q);
      const loaded: ChatMessage[] = snap.docs.map((d) => {
        const data = d.data();
        return {
          sender: data.sender as 'user' | 'bot' | 'system',
          text: data.text || '',
          timestamp: (data.timestamp as Timestamp)?.toDate(),
          imageUrl: data.imageUrl || undefined,
        };
      });
      setMessages(loaded);
      // Rebuild conversation history from loaded messages (last 10 user/bot)
      conversationHistory.current = loaded
        .filter((m) => m.sender === 'user' || m.sender === 'bot')
        .map((m) => ({ sender: m.sender as 'user' | 'bot', text: m.text }))
        .slice(-20);
    } catch (e) {
      console.error('Error loading session messages:', e);
    } finally {
      setSessionMessagesLoading(false);
    }
  };

  // ─── React to session ID changes (URL param or state) ─────────────────────
  useEffect(() => {
    if (!authUser || !currentSessionId) return;
    if (skipNextSessionLoadRef.current === currentSessionId) {
      skipNextSessionLoadRef.current = null;
      return;
    }
    loadSessionMessages(currentSessionId, authUser.uid);
  }, [currentSessionId, authUser]);

  // ─── Core: create a Firestore session doc and return its ID ──────────────
  const createSessionDoc = async ({ navigate = true }: { navigate?: boolean } = {}): Promise<string | null> => {
    if (!authUser) return null;
    try {
      const db = getFirestoreClient();
      const sessionsRef = collection(db, 'users', authUser.uid, 'chatSessions');
      const newDoc = await addDoc(sessionsRef, {
        title: 'New Chat',
        level: null,
        subject: null,
        createdAt: serverTimestamp(),
        lastMessageAt: serverTimestamp(),
        messageCount: 0,
        isArchived: false,
        topicsDetected: [],
      });
      const newSession: SessionMeta = {
        id: newDoc.id,
        title: 'New Chat',
        level: null,
        subject: null,
        createdAt: new Date(),
        lastMessageAt: new Date(),
        messageCount: 0,
      };
      setSessions((prev) => [newSession, ...prev]);
      setCurrentSessionId(newDoc.id);
      currentSessionIdRef.current = newDoc.id;
      if (navigate) {
        router.replace(`/chat?session=${newDoc.id}`);
      }
      return newDoc.id;
    } catch (e) {
      console.error('Error creating session:', e);
      return null;
    }
  };

  // ─── New Chat button: reset conversation and create a fresh session ───────
  const createNewSession = async () => {
    setMessages([]);
    conversationHistory.current = [];
    setSelectedLevel('');
    prevLevelRef.current = '';
    setCurrentSessionId(null);
    currentSessionIdRef.current = null;
    router.replace('/chat');
  };

  // ─── Switch to an existing session ────────────────────────────────────────
  const switchSession = (sessionId: string) => {
    if (sessionId === currentSessionId) return;
    setCurrentSessionId(sessionId);
    currentSessionIdRef.current = sessionId;
    router.push(`/chat?session=${sessionId}`);
  };

  // ─── Delete a session ─────────────────────────────────────────────────────
  const deleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!authUser) return;
    try {
      const db = getFirestoreClient();
      await deleteDoc(doc(db, 'users', authUser.uid, 'chatSessions', sessionId));
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      if (currentSessionId === sessionId) {
        setCurrentSessionId(null);
        currentSessionIdRef.current = null;
        setMessages([]);
        router.replace('/chat');
      }
    } catch (e) {
      console.error('Error deleting session:', e);
    }
  };

  // ─── Rename a session ─────────────────────────────────────────────────────
  const renameSession = async (sessionId: string, newTitle: string) => {
    const trimmed = newTitle.trim();
    setRenamingSessionId(null);
    if (!trimmed || !authUser) return;
    try {
      const db = getFirestoreClient();
      await updateDoc(doc(db, 'users', authUser.uid, 'chatSessions', sessionId), { title: trimmed });
      setSessions((prev) => prev.map((s) => (s.id === sessionId ? { ...s, title: trimmed } : s)));
    } catch (e) {
      console.error('Error renaming session:', e);
    }
  };

  // ─── Save a message to Firestore (session-based) ──────────────────────────
  const saveMessageToFirestore = async (message: ChatMessage, sessionId: string) => {
    if (!authUser?.uid || !sessionId) return;
    try {
      const db = getFirestoreClient();
      const msgsRef = collection(db, 'users', authUser.uid, 'chatSessions', sessionId, 'messages');
      await addDoc(msgsRef, {
        sender: message.sender,
        text: message.text,
        timestamp: Timestamp.now(),
        imageUrl: message.imageUrl || null,
      });
      // Update session metadata
      const sessionRef = doc(db, 'users', authUser.uid, 'chatSessions', sessionId);
      await updateDoc(sessionRef, {
        lastMessageAt: Timestamp.now(),
        messageCount: (sessions.find((s) => s.id === sessionId)?.messageCount ?? 0) + 1,
      });
    } catch (error) {
      console.error('Error saving message:', error);
    }
  };

  // ─── Auto-generate session title after first message ─────────────────────
  const generateSessionTitle = async (firstMessage: string, sessionId: string) => {
    if (!authUser) return;
    try {
      const res = await fetch(`${backendBaseUrl()}/llm/chat/title`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: firstMessage, level: selectedLevel || 'general' }),
      });
      if (!res.ok) return;
      const data = await res.json();
      const title: string = data.title || firstMessage.slice(0, 40);
      const db = getFirestoreClient();
      await updateDoc(doc(db, 'users', authUser.uid, 'chatSessions', sessionId), { title });
      setSessions((prev) =>
        prev.map((s) => (s.id === sessionId ? { ...s, title } : s))
      );
    } catch {
      // Non-critical — title just stays "New Chat"
    }
  };

  // ─── Level system messages ─────────────────────────────────────────────────
  function formatLevel(level: string) {
    if (level === 'psle') return 'PSLE';
    if (level === 'o_level') return 'O Level';
    if (level === 'a_level') return 'A Level';
    if (level === 'ib') return 'IB';
    return level;
  }

  useEffect(() => {
    if (!selectedLevel) return;
    const prev = prevLevelRef.current;
    if (prev === selectedLevel) return;
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
    // Update session level
    if (authUser && currentSessionId) {
      const db = getFirestoreClient();
      updateDoc(doc(db, 'users', authUser.uid, 'chatSessions', currentSessionId), {
        level: selectedLevel,
      }).catch(console.error);
    }
  }, [selectedLevel]);

  // ─── Input bar / attachment measurements ──────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => textInputRef.current?.focus(), useIOSKeyboardFix ? 150 : 0);
    return () => clearTimeout(t);
  }, [useIOSKeyboardFix]);

  useEffect(() => {
    const el = inputBarRef.current;
    if (!el) return;
    const measure = () => {
      const rect = el.getBoundingClientRect();
      if (rect.height > 20) setInputBarH(rect.height);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const el = document.getElementById('attachment-bar');
    if (!el) { setAttachmentBarH(0); return; }
    const measure = () => {
      const rect = el.getBoundingClientRect();
      if (rect.height >= 0) setAttachmentBarH(rect.height);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [imageFile]);

  // ─── iOS keyboard fix ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!useIOSKeyboardFix) return;
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => {
      const lift = Math.max(0, window.innerHeight - vv.height - (vv.offsetTop || 0));
      setKbLiftPx(lift);
    };
    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    window.addEventListener('resize', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [useIOSKeyboardFix]);

  // ─── SSE stream helper ─────────────────────────────────────────────────────
  const streamSSE = async (res: Response, onDelta: (t: string) => void) => {
    if (!res.body) throw new Error('No response body.');
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
        for (const line of part.split('\n')) {
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice('data: '.length).trim();
          if (!jsonStr) continue;
          try {
            const evt = JSON.parse(jsonStr);
            if (evt.type === 'delta' && typeof evt.delta === 'string') onDelta(evt.delta);
            else if (evt.type === 'error') throw new Error(evt.error || 'Stream error');
          } catch { /* ignore partial */ }
        }
      }
    }
  };

  // ─── Send message ──────────────────────────────────────────────────────────
  const sendMessage = async () => {
    if (loading) return;

    if (!selectedLevel) {
      setErrorMessage('Please choose a level first');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }
    if (!input.trim() && !imageFile) {
      setErrorMessage('Please enter a message or upload an image');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    // Ensure a session exists — use ref for synchronous access, create inline if missing
    let sessionId = currentSessionIdRef.current;
    let createdSessionId: string | null = null;
    if (!sessionId) {
      if (!authUser) return;
      try {
        const newId = await createSessionDoc({ navigate: false });
        if (newId) {
          sessionId = newId;
          createdSessionId = newId;
          skipNextSessionLoadRef.current = newId;
        } else {
          setErrorMessage('Chat history could not be saved, but you can still chat in this session.');
          setTimeout(() => setErrorMessage(''), 4000);
        }
      } catch {
        setErrorMessage('Chat history could not be saved, but you can still chat in this session.');
        setTimeout(() => setErrorMessage(''), 4000);
      }
    }

    setErrorMessage('');
    const userMessage = input;
    setInput('');
    setLoading(true);
    shouldAutoScrollRef.current = true;

    const isFirstMessage = messages.filter((m) => m.sender === 'user').length === 0;
    const userText = imageFile ? `${userMessage || ''}\n[Image uploaded]` : userMessage;
    conversationHistory.current.push({ sender: 'user', text: userText });
    const contextMessages = conversationHistory.current.slice(-20);

    const userMsg: ChatMessage = { sender: 'user', text: userText };
    setMessages((prev) => [...prev, userMsg, { sender: 'bot', text: '' }].slice(-40));

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000);

    try {
      const url = `${backendBaseUrl()}/llm/chat/stream`;
      let res: Response;

      if (imageFile) {
        const formData = new FormData();
        formData.append('level', selectedLevel);
        if (userMessage.trim()) formData.append('prompt', userMessage);
        formData.append('image', imageFile);
        formData.append('context', JSON.stringify(contextMessages));
        res = await fetch(url, { method: 'POST', body: formData, signal: controller.signal });
      } else {
        res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ level: selectedLevel, prompt: userMessage, context: contextMessages }),
          signal: controller.signal,
        });
      }

      if (!res.ok) throw new Error(await res.text());

      let acc = '';
      await streamSSE(res, (delta) => {
        acc += delta;
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = { sender: 'bot', text: acc };
          return next.slice(-40);
        });
      });

      clearTimeout(timeoutId);
      setImageFile(null);
      conversationHistory.current.push({ sender: 'bot', text: acc });

      // Save both messages to Firestore
      if (sessionId) {
        await saveMessageToFirestore({ sender: 'user', text: userText, timestamp: new Date() }, sessionId);
        await saveMessageToFirestore({ sender: 'bot', text: acc, timestamp: new Date() }, sessionId);
      }

      if (createdSessionId && sessionId) {
        router.replace(`/chat?session=${createdSessionId}`);
      }

      // Generate title after first user message
      if (isFirstMessage && userMessage.trim()) {
        generateSessionTitle(userMessage.trim(), sessionId);
      }
    } catch (err) {
      clearTimeout(timeoutId);
      const isTimeout = err instanceof DOMException && err.name === 'AbortError';
      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = {
          sender: 'bot',
          text: isTimeout ? 'Request timed out, please try again.' : `Error: ${String(err)}`,
        };
        return next.slice(-40);
      });
    } finally {
      setLoading(false);
      setTimeout(() => textInputRef.current?.focus(), useIOSKeyboardFix ? 80 : 0);
    }
  };

  // ─── Auto-scroll ───────────────────────────────────────────────────────────
  useEffect(() => {
    const el = chatScrollRef.current;
    if (!el) return;
    if (!isNearBottom && !shouldAutoScrollRef.current) return;
    requestAnimationFrame(() => {
      el.scrollTo({ top: el.scrollHeight, behavior: shouldAutoScrollRef.current ? 'smooth' : 'auto' });
      shouldAutoScrollRef.current = false;
    });
  }, [messages, isNearBottom]);

  useEffect(() => {
    const inputEl = textInputRef.current;
    if (!inputEl) return;
    const onFocus = () => {
      requestAnimationFrame(() => messagesEndRef.current?.scrollIntoView({ block: 'end' }));
    };
    inputEl.addEventListener('focus', onFocus);
    return () => inputEl.removeEventListener('focus', onFocus);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(min-width: 768px)');
    const updateDesktop = () => setIsDesktop(mediaQuery.matches);
    updateDesktop();
    mediaQuery.addEventListener('change', updateDesktop);
    return () => mediaQuery.removeEventListener('change', updateDesktop);
  }, []);

  const chatBottomPadStyle: React.CSSProperties = useMemo(() => {
    const base = inputBarH + attachmentBarH + 12;
    const extra = useIOSKeyboardFix ? kbLiftPx : 0;
    return { paddingBottom: `calc(${Math.max(0, base + extra)}px + var(--safe-bottom, 0px))` };
  }, [inputBarH, attachmentBarH, kbLiftPx, useIOSKeyboardFix]);

  const inputBarPositionStyle: React.CSSProperties = useMemo(() => {
    if (!useIOSKeyboardFix) return {};
    return { transform: `translateY(-${kbLiftPx}px)` };
  }, [useIOSKeyboardFix, kbLiftPx]);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDraggingFile(true); };
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDraggingFile(false);
  };
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingFile(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) setImageFile(file);
  };

  if (!authChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }
  if (!authUser) return null;

  const desktopShiftStyle: React.CSSProperties = isDesktop
    ? { marginLeft: isSidebarOpen ? '280px' : '56px' }
    : {};

  return (
    <div
      className="flex flex-col min-h-[100dvh] h-[100dvh] min-h-0 bg-black text-white"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div
        className="flex min-h-0 flex-1 flex-col transition-[margin-left] duration-200 ease-out"
        style={desktopShiftStyle}
      >
        <Header
          selectedLevel={selectedLevel}
          setSelectedLevel={setSelectedLevel}
          onNewChat={createNewSession}
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
        className={`fixed inset-0 z-40 transition-opacity md:hidden ${isSidebarOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        aria-hidden={!isSidebarOpen}
      >
        <button
          type="button"
          onClick={() => setIsSidebarOpen(false)}
          className="absolute inset-0 bg-black/40"
          aria-label="Close sidebar"
        />
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-50 h-full bg-slate-900 border-r border-blue-900/40 flex flex-col overflow-hidden transition-[width] duration-200 ease-out ${
          isSidebarOpen ? 'w-[280px]' : 'w-0 md:w-14'
        }`}
      >
        {/* Sidebar header — burger always visible */}
        <div className="h-[72px] flex-shrink-0 flex items-center px-3 gap-3">
          <button
            type="button"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-full hover:bg-gray-900 flex-shrink-0"
            aria-label="Toggle sidebar"
          >
            {isSidebarOpen ? '✕' : '☰'}
          </button>
          <div className={`transition-opacity duration-150 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <span className="font-semibold text-white whitespace-nowrap">Eduble</span>
          </div>
        </div>

        {/* New Chat button */}
        <div className="px-3 pt-4 pb-2 flex-shrink-0">
          {isSidebarOpen ? (
            <button
              onClick={() => { createNewSession(); }}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-white text-black text-sm font-semibold py-2.5 hover:opacity-80 transition"
            >
              + New Chat
            </button>
          ) : (
            <button
              onClick={() => { createNewSession(); }}
              className="w-full flex items-center justify-center rounded-xl bg-white text-black font-bold text-lg py-2 hover:opacity-80 transition"
              aria-label="New Chat"
            >
              +
            </button>
          )}
        </div>

        {/* Session list */}
        <div className={`flex-1 overflow-y-auto px-3 py-2 space-y-1 transition-opacity duration-150 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          {sessionsLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-14 rounded-xl bg-gray-800/40 animate-pulse" />
            ))
          ) : sessions.length === 0 ? (
            <p className="text-xs text-gray-600 px-2 py-4 text-center">No chats yet. Start one above!</p>
          ) : (
            sessions.map((session) => {
              const isRenaming = renamingSessionId === session.id;
              const activeClass = session.id === currentSessionId
                ? 'bg-blue-500/10 border border-blue-500/30'
                : 'hover:bg-gray-900';

              if (isRenaming) {
                return (
                  <div
                    key={session.id}
                    className={`rounded-xl px-3 py-3 flex items-start gap-2 ${activeClass}`}
                  >
                    <div className="flex-1 min-w-0">
                      <input
                        autoFocus
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') renameSession(session.id, renameValue);
                          if (e.key === 'Escape') setRenamingSessionId(null);
                        }}
                        onBlur={() => renameSession(session.id, renameValue)}
                        className="w-full bg-transparent border-b border-blue-500/50 text-sm text-white focus:outline-none py-0.5"
                      />
                    </div>
                    <div className="flex flex-col gap-0.5 flex-shrink-0">
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteSession(session.id, e); }}
                        className="p-1 rounded hover:bg-gray-700 text-gray-500 hover:text-red-400 transition-colors"
                        aria-label="Delete session"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setRenamingSessionId(null)}
                        className="p-1 rounded hover:bg-gray-700 text-blue-400 transition-colors"
                        aria-label="Cancel rename"
                      >
                        <Pencil size={14} />
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <button
                  key={session.id}
                  onClick={() => switchSession(session.id)}
                  className={`group w-full text-left rounded-xl px-3 py-3 transition flex items-start gap-2 ${activeClass}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">{session.title}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      {session.level && (
                        <span className="text-[10px] text-gray-500 uppercase">{session.level.replace('_', ' ')}</span>
                      )}
                      <span className="text-[10px] text-gray-600">{relativeTime(session.lastMessageAt)}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => deleteSession(session.id, e)}
                      className="p-1 rounded hover:bg-gray-700 text-gray-500 hover:text-red-400 transition-colors"
                      aria-label="Delete session"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setRenamingSessionId(session.id); setRenameValue(session.title); }}
                      className="p-1 rounded hover:bg-gray-700 text-gray-500 hover:text-blue-400 transition-colors"
                      aria-label="Rename session"
                    >
                      <Pencil size={14} />
                    </button>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Sidebar footer nav */}
        <div className={`px-3 py-3 flex-shrink-0 space-y-1 ${isSidebarOpen ? 'border-t border-blue-900/40' : ''}`}>
          {isSidebarOpen ? (
            <>
              <Link
                href="/dashboard"
                onClick={() => setIsSidebarOpen(false)}
                className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm text-gray-400 hover:text-white hover:bg-gray-800/50 transition"
              >
                <Home size={16} />
                Dashboard
              </Link>
              <Link
                href="/quizmode"
                onClick={() => setIsSidebarOpen(false)}
                className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm text-gray-400 hover:text-white hover:bg-gray-800/50 transition"
              >
                <BookOpen size={16} />
                Quiz Mode
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/dashboard"
                className="flex items-center justify-center rounded-xl py-2.5 text-gray-400 hover:text-white hover:bg-gray-800/50 transition"
                aria-label="Dashboard"
              >
                <Home size={18} />
              </Link>
              <Link
                href="/quizmode"
                className="flex items-center justify-center rounded-xl py-2.5 text-gray-400 hover:text-white hover:bg-gray-800/50 transition"
                aria-label="Quiz Mode"
              >
                <BookOpen size={18} />
              </Link>
            </>
          )}
        </div>
      </aside>

      {/* CHAT AREA */}
      <main
        ref={chatScrollRef as React.Ref<HTMLElement>}
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain"
        onClick={() => textInputRef.current?.focus()}
        onScroll={(e) => {
          const el = e.currentTarget;
          const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
          setIsNearBottom(distanceFromBottom < 140);
        }}
      >
        <div className="w-full max-w-none px-6 md:px-10 lg:px-16 py-8 space-y-6" style={chatBottomPadStyle}>
          {sessionMessagesLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-3">
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span className="text-sm text-gray-500">Loading conversation...</span>
              </div>
            </div>
          ) : messages.length === 0 && !currentSessionId ? (
            <div className="flex items-center justify-center h-full py-20">
              <p className="text-gray-500 text-center">
                Select a level and start chatting with Eddy! ✨
              </p>
            </div>
          ) : messages.length === 0 && selectedLevel === '' ? (
            <div className="flex items-center justify-center h-full py-20">
              <p className="text-gray-500 text-center">
                Chat with Eddy by first selecting your Educational Level! ✨
              </p>
            </div>
          ) : (
            messages.map((msg, idx) => {
              if (msg.sender === 'system') {
                return (
                  <div key={idx} className="flex justify-center">
                    <div className="text-xs px-4 py-2 rounded-full bg-blue-500/10 text-blue-300">
                      {msg.text}
                    </div>
                  </div>
                );
              }
              return (
                <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.sender === 'user' ? (
                    <div className="inline-block max-w-[75%] px-5 py-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words bg-white/90 text-black border border-gray-300">
                      {msg.text}
                    </div>
                  ) : (
                    <div className="w-[80%] min-w-[120px]">
                      <div className="bg-blue-600/10 rounded-4xl px-6 py-5 border border-blue-500/30 text-sm leading-relaxed whitespace-pre-wrap text-white">
                        {msg.text ? renderMath(msg.text) : <TypingDots />}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Attachment bar */}
      {imageFile && (
        <div id="attachment-bar" className="border-t border-gray-800 bg-gray-900">
          <div className="w-full max-w-none px-6 md:px-10 lg:px-16 py-2 flex items-center justify-between text-sm">
            <span className="text-gray-400">Image attached: {imageFile.name}</span>
            <button onClick={() => setImageFile(null)} className="text-red-500 hover:underline">Remove</button>
          </div>
        </div>
      )}

      {/* Error bar */}
      {errorMessage && (
        <div className="border-t border-gray-800 bg-red-900/30">
          <div className="w-full max-w-none px-6 md:px-10 lg:px-16 py-2 flex items-center justify-center text-sm">
            <span className="text-red-300">{errorMessage}</span>
          </div>
        </div>
      )}

      {/* Input bar */}
      <form
        ref={inputBarRef}
        onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
        className={
          useIOSKeyboardFix
            ? 'fixed left-0 right-0 bottom-0 z-50 border-t border-gray-800 bg-black/95 backdrop-blur pb-[env(safe-area-inset-bottom)]'
            : 'sticky bottom-0 z-50 border-t border-gray-800 bg-black/95 backdrop-blur pb-[env(safe-area-inset-bottom)]'
        }
        style={inputBarPositionStyle}
      >
        <div className="w-full max-w-3xl mx-auto px-6 md:px-10 lg:px-16 py-4">
          <div className="relative flex items-center">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute left-3 p-2 rounded-full hover:bg-gray-800 z-10"
              aria-label="Attach file"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
              </svg>
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => setImageFile(e.target.files?.[0] ?? null)} />
            <input
              ref={textInputRef}
              type="text"
              inputMode="text"
              autoCorrect="on"
              autoCapitalize="sentences"
              className="flex-1 pl-14 pr-24 py-3 rounded-full bg-black border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
              placeholder="Ask a question, paste a problem, or upload an image…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  void sendMessage();
                }
              }}
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => void sendMessage()}
              disabled={loading}
              className="absolute right-2 px-3 py-2 rounded-full bg-blue-600 text-white hover:opacity-80 disabled:opacity-60"
              aria-label="Send message"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </div>
        </div>
      </form>

      </div>

      <style jsx global>{`
        html, body, #__next { height: 100%; }
        body { margin: 0; overscroll-behavior-y: none; -webkit-text-size-adjust: 100%; touch-action: manipulation; }
        :root { --safe-bottom: env(safe-area-inset-bottom, 0px); }
        .katex-display { overflow-x: auto; max-width: 100%; margin: 0.75rem 0; }
        .katex { white-space: normal; max-width: 100%; }
      `}</style>
    </div>
  );
}

// ─── Exported page wrapper (required for useSearchParams) ────────────────────
export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    }>
      <ChatInner />
    </Suspense>
  );
}

/* ─── Sub-components ─────────────────────────────────────────────────────── */
function Header({
  selectedLevel,
  setSelectedLevel,
  onNewChat,
}: {
  selectedLevel: LevelKey | '';
  setSelectedLevel: (v: LevelKey | '') => void;
  onNewChat: () => void;
}) {
  return (
    <header className="flex-shrink-0 border-b border-gray-800 bg-black">
      <div className="w-full max-w-none px-6 md:px-10 lg:px-16 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="group flex items-center gap-3 px-3 py-2 rounded-full h-[48px]">
            <Image src="/Eddy.png" alt="Eduble" width={36} height={36} className="rounded-full shrink-0" />
            <div className="relative overflow-hidden">
              <div className="flex flex-col justify-center">
                <span className="text-lg font-semibold text-white">Eddy Chat</span>
                <span className="text-xs text-gray-300">AI-powered study assistant</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onNewChat}
            className="hidden sm:flex items-center gap-1.5 text-xs text-gray-400 hover:text-white border border-blue-500/30 hover:border-blue-500/60 rounded-full px-3 py-1.5 transition"
          >
            + New
          </button>
          <LevelSelect selectedLevel={selectedLevel} setSelectedLevel={setSelectedLevel} />
        </div>
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
    <div className="relative w-44">
      <select
        className="appearance-none w-full px-4 py-2 pr-10 rounded-xl bg-black border border-gray-700 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all hover:border-blue-500/50 shadow-sm"
        value={selectedLevel}
        onChange={(e) => setSelectedLevel(e.target.value as LevelKey)}
      >
        <option value="" disabled>Select level…</option>
        <option value="psle">PSLE</option>
        <option value="o_level">O Level</option>
        <option value="a_level">A Level</option>
        <option value="ib">IB</option>
      </select>
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
        <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6"/></svg>
      </span>
    </div>
  );
}

function TypingDots() {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setSeconds((p) => p + 1), 1000);
    return () => clearInterval(interval);
  }, []);
  return (
    <div className="flex flex-col items-center justify-center py-2">
      <div className="flex items-center justify-center mb-2">
        <span className="inline-block w-7 h-7 border-4 border-black border-t-white rounded-full animate-spin" />
      </div>
      <span className="text-xs text-white opacity-80">Generating Response ({seconds}s)</span>
    </div>
  );
}

function renderMath(text: string) {
  const parts = text.split(/(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$|\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\))/g);
  return parts.map((part, idx) => {
    if (part.startsWith('$$') && part.endsWith('$$')) return <BlockMath key={idx} math={part.slice(2, -2)} />;
    if (part.startsWith('$') && part.endsWith('$')) return <InlineMath key={idx} math={part.slice(1, -1)} />;
    if (part.startsWith('\\[') && part.endsWith('\\]')) return <BlockMath key={idx} math={part.slice(2, -2)} />;
    if (part.startsWith('\\(') && part.endsWith('\\)')) return <InlineMath key={idx} math={part.slice(2, -2)} />;
    return <span key={idx}>{part}</span>;
  });
}
