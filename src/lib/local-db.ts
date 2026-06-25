"use client";

import type { LocalState } from "@/types/local";

const DB_NAME = "chunkflow-local";
const DB_VERSION = 1;
const STORE_NAME = "state";
const STATE_KEY = "current";

export function createEmptyLocalState(): LocalState {
  const now = new Date().toISOString();

  return {
    version: 1,
    entries: [],
    chunks: [],
    personalSentences: [],
    reviews: [],
    dailyGoals: {},
    updatedAt: now,
  };
}

function isBrowser() {
  return typeof window !== "undefined" && "indexedDB" in window;
}

function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function normalizeState(value: unknown): LocalState {
  const empty = createEmptyLocalState();

  if (!value || typeof value !== "object") {
    return empty;
  }

  const state = value as Partial<LocalState>;

  return {
    version: 1,
    entries: Array.isArray(state.entries) ? state.entries : [],
    chunks: Array.isArray(state.chunks) ? state.chunks : [],
    personalSentences: Array.isArray(state.personalSentences)
      ? state.personalSentences
      : [],
    reviews: Array.isArray(state.reviews) ? state.reviews : [],
    dailyGoals:
      state.dailyGoals && typeof state.dailyGoals === "object"
        ? state.dailyGoals
        : {},
    updatedAt:
      typeof state.updatedAt === "string" ? state.updatedAt : empty.updatedAt,
  };
}

export async function readLocalState() {
  if (!isBrowser()) {
    return createEmptyLocalState();
  }

  const db = await openDatabase();

  return new Promise<LocalState>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(STATE_KEY);

    request.onsuccess = () => resolve(normalizeState(request.result));
    request.onerror = () => reject(request.error);
  }).finally(() => db.close());
}

export async function writeLocalState(state: LocalState) {
  if (!isBrowser()) {
    return;
  }

  const db = await openDatabase();

  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(
      { ...state, updatedAt: new Date().toISOString() },
      STATE_KEY,
    );

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  }).finally(() => db.close());
}

export async function clearLocalState() {
  if (!isBrowser()) {
    return;
  }

  const db = await openDatabase();

  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(STATE_KEY);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  }).finally(() => db.close());
}

export function parseImportedState(payload: string) {
  return normalizeState(JSON.parse(payload));
}
