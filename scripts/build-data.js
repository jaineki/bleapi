import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import * as cheerio from "cheerio";

const exec = promisify(execFile);
const root = path.resolve(new URL("..", import.meta.url).pathname);
const zipUrl = "https://ebible.org/Scriptures/cebocb_html.zip";
const work = await fs.mkdtemp(path.join(os.tmpdir(), "cebocb-"));
const zip = path.join(work, "source.zip");
const outDir = path.join(root, "data");
const bookNames = {
  GEN: "Genesis", EXO: "Exodo", LEV: "Levitico", NUM: "Numeros", DEU: "Deuteronomio", JOS: "Josue", JDG: "Mga Maghuhukom", RUT: "Ruth", "1SA": "1 Samuel", "2SA": "2 Samuel", "1KI": "1 Mga Hari", "2KI": "2 Mga Hari", "1CH": "1 Cronicas", "2CH": "2 Cronicas", EZR: "Esdras", NEH: "Nehemias", EST: "Ester", JOB: "Job", PSA: "Mga Salmo", PRO: "Mga Panultihon", ECC: "Ecclesiastes", SNG: "Awit ni Solomon", ISA: "Isaias", JER: "Jeremias", LAM: "Mga Pagbangotan", EZK: "Ezekiel", DAN: "Daniel", HOS: "Oseas", JOL: "Joel", AMO: "Amos", OBA: "Obadias", JON: "Jonas", MIC: "Miqueas", NAM: "Nahum", HAB: "Habakuk", ZEP: "Sofonias", HAG: "Hageo", ZEC: "Zacarias", MAL: "Malakias", MAT: "Mateo", MRK: "Marcos", LUK: "Lucas", JHN: "Juan", ACT: "Mga Buhat", ROM: "Mga Taga-Roma", "1CO": "1 Mga Taga-Corinto", "2CO": "2 Mga Taga-Corinto", GAL: "Mga Taga-Galacia", EPH: "Mga Taga-Efeso", PHP: "Mga Taga-Filipos", COL: "Mga Taga-Colosas", "1TH": "1 Mga Taga-Tesalonica", "2TH": "2 Mga Taga-Tesalonica", "1TI": "1 Timoteo", "2TI": "2 Timoteo", TIT: "Tito", PHM: "Filemon", HEB: "Mga Hebreohanon", JAS: "Santiago", "1PE": "1 Pedro", "2PE": "2 Pedro", "1JN": "1 Juan", "2JN": "2 Juan", "3JN": "3 Juan", JUD: "Judas", REV: "Gipadayag"
};
const order = Object.keys(bookNames);
await fs.mkdir(outDir, { recursive: true });
console.log(`Downloading ${zipUrl}`);
await exec("curl", ["-L", "--fail", "--silent", "--show-error", "-o", zip, zipUrl]);
await exec("unzip", ["-q", "-o", zip, "-d", work]);
const files = (await fs.readdir(work)).filter((file) => /^[A-Z0-9]{3}\d{2,3}\.htm$/i.test(file));
const grouped = new Map();
for (const file of files) {
  const match = file.match(/^([A-Z0-9]{3})(\d{2,3})\.htm$/i);
  const code = match[1].toUpperCase();
  if (!bookNames[code]) continue;
  const chapterNumber = Number(match[2]);
  if (chapterNumber === 0) continue;
  const $ = cheerio.load(await fs.readFile(path.join(work, file), "utf8"));
  const verses = [];
  $("span.verse").each((_i, element) => {
    const number = Number($(element).attr("id")?.replace(/^V/, "") || $(element).text().trim());
    let text = $(element).parent().clone().children("span.verse").remove().end().text();
    if (!text.trim()) text = $(element).parent().text();
    text = text.replace(/^\s*\d+\s*/, "").replace(/\s+/g, " ").trim();
    if (number && text) verses.push({ number, text });
  });
  if (!grouped.has(code)) grouped.set(code, []);
  grouped.get(code).push({ number: chapterNumber, verses });
}
const books = order.filter((code) => grouped.has(code)).map((code, index) => ({
  id: bookNames[code].toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
  name: bookNames[code],
  testament: index < 39 ? "OT" : "NT",
  aliases: [],
  chapters: grouped.get(code).sort((a, b) => a.number - b.number)
}));
const result = {
  translation: "Biblica® Open Ang Pulong sa Dios™",
  language: "Cebuano / Bisaya",
  license: "CC BY-SA 4.0",
  source: "https://ebible.org/find/details.php?id=cebocb",
  attribution: "Original Work by Biblica, Inc., available at www.biblica.com and open.bible. Distributed under CC BY-SA 4.0.",
  generatedAt: new Date().toISOString(),
  books
};
await fs.writeFile(path.join(outDir, "bible.json"), JSON.stringify(result));
console.log(`Wrote ${books.length} books and ${books.reduce((n, b) => n + b.chapters.length, 0)} chapters to data/bible.json`);
