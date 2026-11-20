// =====================================================================
// FLOVA Local Transaction Extractor (M4)
// Parses a natural-language transcript into a FinancialExtractionDTO
// using pattern matching. No external API or key required.
// Follows the extraction contract in frontend/src/engine/EXTRACTION_CONTRACT.md
// and rules in docs/CONTRACT.md.
// =====================================================================

import type { FinancialExtractionDTO } from "../engine/extractionTypes";
import { todayLocalISO } from "../data/dates";

// ---- Amount extraction ----
// Matches: "1500", "Rs 1500", "Rs. 1500", "₹1500", "1,500", "1500.50"
const AMOUNT_RE =
  /(?:rs\.?\s*|₹\s*)?(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)/i;

function extractAmount(text: string): string | null {
  const m = AMOUNT_RE.exec(text);
  if (!m) return null;
  const raw = m[1].replace(/,/g, "");
  const n = parseFloat(raw);
  if (!isFinite(n) || n <= 0) return null;
  return n.toFixed(2).replace(/\.00$/, "");
}

// ---- Keyword maps ----
const INCOME_KEYWORDS = [
  "earned", "earn", "received", "got", "income", "salary", "payment",
  "tips", "tip", "incentive", "bonus", "payout", "paid me", "collected",
  "made", "profit", "revenue",
];

const EXPENSE_KEYWORDS = [
  "spent", "spend", "paid", "pay", "bought", "buy", "purchased",
  "expense", "cost", "charged", "deducted", "withdrew", "withdrawal",
];

const LIVING_KEYWORDS = [
  "lunch", "dinner", "breakfast", "food", "meal", "chai", "tea", "coffee",
  "groceries", "grocery", "vegetables", "rice", "dal", "snack", "water",
  "milk", "medicine", "medical", "hospital", "doctor", "cloth", "clothes",
  "rent", "house",
];

const WORK_KEYWORDS = [
  "petrol", "diesel", "fuel", "cng", "gas", "phone", "recharge", "data",
  "mobile", "vehicle", "bike", "maintenance", "repair", "oil", "tyre",
  "helmet", "battery", "tool",
];

const CATEGORY_MAP: Record<string, string> = {
  // income
  "earnings":    "earnings",
  "earned":      "earnings",
  "salary":      "earnings",
  "tips":        "tips",
  "tip":         "tips",
  "incentive":   "incentive",
  "bonus":       "incentive",
  "payout":      "payout",
  "advance":     "advance",
  // expense
  "lunch":       "food",
  "dinner":      "food",
  "breakfast":   "food",
  "food":        "food",
  "meal":        "food",
  "groceries":   "food",
  "grocery":     "food",
  "petrol":      "fuel",
  "diesel":      "fuel",
  "fuel":        "fuel",
  "cng":         "fuel",
  "phone":       "phone",
  "recharge":    "phone",
  "mobile":      "phone",
  "maintenance": "maintenance",
  "repair":      "maintenance",
  "rent":        "rent",
  "emi":         "emi",
};

function guessCategory(text: string, type: "income" | "expense"): string {
  const lower = text.toLowerCase();
  for (const [keyword, cat] of Object.entries(CATEGORY_MAP)) {
    if (lower.includes(keyword)) return cat;
  }
  return type === "income" ? "earnings" : "other";
}

function guessExpenseType(text: string): "living" | "work" | null {
  const lower = text.toLowerCase();
  for (const kw of WORK_KEYWORDS) {
    if (lower.includes(kw)) return "work";
  }
  for (const kw of LIVING_KEYWORDS) {
    if (lower.includes(kw)) return "living";
  }
  return null;
}

function guessDescription(text: string): string | null {
  // Strip leading intent words and return a clean description
  const cleaned = text
    .replace(/^(i\s+)?(earned|spent|paid|received|got|bought|made)\s+/i, "")
    .replace(/^(rs\.?\s*|₹\s*)?[\d,]+(\.\d+)?\s*/i, "")
    .replace(/\s*(today|yesterday|this morning|this evening|just now)\s*/i, "")
    .trim();
  return cleaned.length > 2 ? cleaned : null;
}

// ---- Main extractor ----
export function extractTransaction(transcript: string): FinancialExtractionDTO {
  const text = transcript.trim();
  const lower = text.toLowerCase();

  const amount = extractAmount(text);

  // Determine intent
  const isIncome = INCOME_KEYWORDS.some((kw) => lower.includes(kw));
  const isExpense = EXPENSE_KEYWORDS.some((kw) => lower.includes(kw));

  let transactionType: "income" | "expense" | null = null;
  if (isIncome && !isExpense) transactionType = "income";
  else if (isExpense && !isIncome) transactionType = "expense";
  else if (isExpense && isIncome) {
    // If both fire, prefer the first keyword found
    const firstIncome = Math.min(...INCOME_KEYWORDS.map((kw) => lower.indexOf(kw)).filter((i) => i >= 0), Infinity);
    const firstExpense = Math.min(...EXPENSE_KEYWORDS.map((kw) => lower.indexOf(kw)).filter((i) => i >= 0), Infinity);
    transactionType = firstExpense < firstIncome ? "expense" : "income";
  }

  const category = transactionType ? guessCategory(text, transactionType) : null;
  const expenseType = transactionType === "expense" ? guessExpenseType(text) : null;
  const description = guessDescription(text);

  const missingAmount = !amount;
  const missingType = !transactionType;
  const missingExpenseType = transactionType === "expense" && !expenseType;

  const clarificationQuestions: string[] = [];
  if (missingAmount) clarificationQuestions.push("How much was the amount?");
  if (missingType) clarificationQuestions.push("Was this income or an expense?");
  if (missingExpenseType) clarificationQuestions.push("Was this a living expense (food, personal) or a work expense (fuel, phone)?");

  const clarificationRequired = clarificationQuestions.length > 0;
  const certainty = clarificationRequired
    ? missingAmount && missingType ? 0.1 : 0.4
    : expenseType || transactionType === "income" ? 0.9 : 0.75;

  return {
    entry_intent: transactionType ? "transaction" : "unknown",
    action_intent: "create",
    target_id: null,
    transaction: transactionType
      ? {
          type: transactionType,
          amount,
          category,
          expense_type: expenseType,
          ownership: "mine",
          date: todayLocalISO(),
          description,
        }
      : null,
    expected_payout: null,
    balance_checkin: null,
    metadata: {
      certainty,
      clarification_required: clarificationRequired,
      clarification_reason: clarificationRequired
        ? clarificationQuestions.join(" ")
        : null,
      clarification_questions: clarificationQuestions,
      raw_utterance: text,
    },
  };
}
