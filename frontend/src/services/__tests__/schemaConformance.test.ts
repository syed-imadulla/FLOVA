// =====================================================================
// Schema conformance: every column the frontend writes must exist in the
// real database schema (backend/supabase/migrations). The service tests run
// against an in-memory mock that accepts any column, which hid two production
// bugs (invoices.status = "draft", invoice_settlements.payment_reference).
// =====================================================================
// @ts-ignore
import fs from "node:fs";
// @ts-ignore
import path from "node:path";
// @ts-ignore
import { fileURLToPath } from "node:url";

declare const process: any;

const here = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.resolve(here, "../../../../backend/supabase/migrations");
const srcDir = path.resolve(here, "../..");

/** table -> set of columns, from CREATE TABLE and ALTER TABLE ... ADD COLUMN. */
export function loadSchema(): Map<string, Set<string>> {
  const sql = fs.readdirSync(migrationsDir).filter((f: string) => f.endsWith(".sql")).sort()
    .map((f: string) => fs.readFileSync(path.join(migrationsDir, f), "utf-8")).join("\n")
    .replace(/--[^\n]*/g, "");
  const schema = new Map<string, Set<string>>();
  const tableRe = /create table (?:if not exists )?public\.(\w+)\s*\(/gi;
  let m: RegExpExecArray | null;
  while ((m = tableRe.exec(sql))) {
    // Walk to the matching close paren of the column list.
    let depth = 1, i = tableRe.lastIndex;
    while (i < sql.length && depth > 0) { if (sql[i] === "(") depth++; else if (sql[i] === ")") depth--; i++; }
    const body = sql.slice(tableRe.lastIndex, i - 1);
    const cols = schema.get(m[1]) ?? new Set<string>();
    // Split on top-level commas only.
    let d = 0, start = 0;
    const parts: string[] = [];
    for (let j = 0; j < body.length; j++) {
      if (body[j] === "(") d++; else if (body[j] === ")") d--;
      else if (body[j] === "," && d === 0) { parts.push(body.slice(start, j)); start = j + 1; }
    }
    parts.push(body.slice(start));
    for (const p of parts) {
      const word = p.trim().split(/\s+/)[0]?.toLowerCase();
      if (word && !["constraint", "primary", "unique", "check", "foreign", "exclude"].includes(word)) cols.add(word);
    }
    schema.set(m[1], cols);
  }
  const alterRe = /alter table (?:only )?(?:if exists )?public\.(\w+)([\s\S]*?);/gi;
  while ((m = alterRe.exec(sql))) {
    const cols = schema.get(m[1]) ?? new Set<string>();
    for (const a of m[2].matchAll(/add column (?:if not exists )?(\w+)/gi)) cols.add(a[1].toLowerCase());
    schema.set(m[1], cols);
  }
  return schema;
}

function listTs(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e: any) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return e.name === "__tests__" ? [] : listTs(p);
    return /\.(ts|tsx)$/.test(e.name) ? [p] : [];
  });
}

/** Finds .from("table") ... .insert/update/upsert({ literal keys }) in source files. */
export function findWrites(): Array<{ file: string; table: string; op: string; keys: string[] }> {
  const out: Array<{ file: string; table: string; op: string; keys: string[] }> = [];
  for (const file of listTs(srcDir)) {
    const src: string = fs.readFileSync(file, "utf-8");
    const re = /\.from\(\s*["'](\w+)["']\s*\)\s*\.(insert|update|upsert)\(\s*\{/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(src))) {
      let depth = 1, i = re.lastIndex;
      while (i < src.length && depth > 0) { if (src[i] === "{") depth++; else if (src[i] === "}") depth--; i++; }
      const body = src.slice(re.lastIndex, i - 1);
      const keys: string[] = [];
      let d = 0;
      for (const line of body.split(/,(?![^{(\[]*[})\]])/)) {
        for (const ch of line) { if ("{([".includes(ch)) d++; else if ("})]".includes(ch)) d--; }
        const k = line.trim().match(/^["']?(\w+)["']?\s*(?::|$)/);
        if (k && d <= 0) keys.push(k[1]);
      }
      out.push({ file: path.relative(srcDir, file), table: m[1], op: m[2], keys });
    }
  }
  return out;
}

let passed = 0, failed = 0;
function check(name: string, fn: () => void) {
  try { fn(); passed++; console.log(`  ✔ ${name}`); } catch (e) { failed++; console.error(`  ✖ ${name}: ${(e as Error).message}`); }
}

const schema = loadSchema();
const writes = findWrites();

check("migrations define the tables the app writes to", () => {
  for (const t of ["profiles", "transactions", "payouts", "balance_checkins", "commitments", "invoices", "invoice_items", "invoice_settlements", "wish_goals", "wish_contributions"]) {
    if (!schema.has(t)) throw new Error(`table ${t} not found in migrations`);
  }
});

check("frontend writes are discovered", () => {
  if (writes.length < 5) throw new Error(`only ${writes.length} writes found; parser broken?`);
});

check("every column written by the frontend exists in the database schema", () => {
  const problems: string[] = [];
  for (const w of writes) {
    const cols = schema.get(w.table);
    if (!cols) { problems.push(`${w.file}: table ${w.table} does not exist`); continue; }
    for (const k of w.keys) if (!cols.has(k.toLowerCase())) problems.push(`${w.file}: ${w.table}.${k} (${w.op}) does not exist`);
  }
  if (problems.length) throw new Error("\n    " + problems.join("\n    "));
});

console.log(`Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
if (failed > 0) process.exit(1);
