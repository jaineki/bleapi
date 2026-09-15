import express from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, "..", "data", "bible.json");
const PORT = Number(process.env.PORT || 3000);
const allowedOrigins = new Set([
  "http://localhost:3000",
  "http://localhost:2435", 
  "http://localhost:5173",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:5173",
  "https://bibliatica.onrender.com"
]);

const fallback = {
  translation: "Biblica Open Ang Pulong sa Dios",
  language: "Cebuano / Bisaya",
  license: "CC BY-SA 4.0",
  books: []
};

function loadBible() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  } catch {
    return fallback;
  }
}

const bible = loadBible();
const app = express();
app.disable("x-powered-by");
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});
app.use(express.json());

const normalize = (value = "") => String(value).trim().toLowerCase();
const findBook = (name) => bible.books.find((book) =>
  normalize(book.id) === normalize(name) ||
  normalize(book.name) === normalize(name) ||
  (book.aliases || []).some((alias) => normalize(alias) === normalize(name))
);

app.get("/", (_req, res) => res.json({
  name: "Bisaya Bible API",
  version: "1.0.0",
  translation: bible.translation,
  language: bible.language,
  endpoints: {
    health: "/health",
    books: "/api/books",
    chapters: "/api/books/:book/chapters",
    chapter: "/api/:book/:chapter",
    verse: "/api/:book/:chapter/:verse",
    search: "/api/search?q=gugma&limit=20"
  }
}));

app.get("/health", (_req, res) => res.json({ ok: true, books: bible.books.length }));

app.get("/api/books", (_req, res) => res.json({
  translation: bible.translation,
  books: bible.books.map(({ id, name, testament, chapters }) => ({
    id, name, testament, chapters: chapters.length,
    verses: chapters.reduce((total, chapter) => total + chapter.verses.length, 0)
  }))
}));

app.get("/api/books/:book/chapters", (req, res) => {
  const book = findBook(req.params.book);
  if (!book) return res.status(404).json({ error: "Book not found" });
  return res.json({ book: { id: book.id, name: book.name }, chapters: book.chapters.map((chapter) => ({
    chapter: chapter.number,
    verses: chapter.verses.length,
    url: `/api/${book.id}/${chapter.number}`
  })) });
});

app.get("/api/:book/:chapter", (req, res) => {
  const book = findBook(req.params.book);
  const chapterNumber = Number(req.params.chapter);
  const chapter = book?.chapters.find((item) => item.number === chapterNumber);
  if (!book || !chapter) return res.status(404).json({ error: "Chapter not found" });
  return res.json({ translation: bible.translation, book: book.name, bookId: book.id, chapter: chapter.number, verses: chapter.verses });
});

app.get("/api/:book/:chapter/:verse", (req, res) => {
  const book = findBook(req.params.book);
  const chapterNumber = Number(req.params.chapter);
  const verseNumber = Number(req.params.verse);
  const verse = book?.chapters.find((item) => item.number === chapterNumber)?.verses.find((item) => item.number === verseNumber);
  if (!book || !verse) return res.status(404).json({ error: "Verse not found" });
  return res.json({ translation: bible.translation, book: book.name, bookId: book.id, chapter: chapterNumber, verse });
});

app.get("/api/search", (req, res) => {
  const query = normalize(req.query.q);
  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
  if (!query) return res.status(400).json({ error: "Query parameter q is required" });
  const results = [];
  for (const book of bible.books) {
    for (const chapter of book.chapters) {
      for (const verse of chapter.verses) {
        if (normalize(verse.text).includes(query)) results.push({ book: book.name, bookId: book.id, chapter: chapter.number, verse });
        if (results.length >= limit) return res.json({ query: req.query.q, count: results.length, results });
      }
    }
  }
  return res.json({ query: req.query.q, count: results.length, results });
});

app.use((_req, res) => res.status(404).json({ error: "Route not found" }));
app.listen(PORT, "0.0.0.0", () => console.log(`Bisaya Bible API listening on port ${PORT}`));
