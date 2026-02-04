"use client";

import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

function firebaseConfig() {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  if (!apiKey || !authDomain || !projectId) {
    // This will only happen if called in a context without inlined envs
    // or if env vars are genuinely missing.
    throw new Error(
      `Firebase client env missing at runtime: ` +
        `apiKey=${Boolean(apiKey)} authDomain=${Boolean(authDomain)} projectId=${Boolean(projectId)}`
    );
  }

  return {
    apiKey,
    authDomain,
    projectId,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };
}

export function getFirebaseApp() {
  if (getApps().length) return getApp();
  return initializeApp(firebaseConfig());
}

export function getAuthClient(): Auth {
  return getAuth(getFirebaseApp());
}
