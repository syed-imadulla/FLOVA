// =====================================================================
// FLOVA Local Transaction Extractor (M4 & M1)
// Parses a natural-language transcript into a FinancialExtractionDTO
// using pattern matching. No external API or key required.
// Supports English, Hindi, Kannada, Urdu, and Telugu.
// Follows the extraction contract in frontend/src/engine/EXTRACTION_CONTRACT.md
// and rules in docs/CONTRACT.md.
// =====================================================================

import type { FinancialExtractionDTO } from "../engine/extractionTypes";
import { todayLocalISO } from "../data/dates";

// Normalize Indic numerals (Devanagari, Kannada, Telugu, Eastern Arabic/Perso-Arabic) to ASCII 0-9
function normalizeNumerals(str: string): string {
  return str
    .replace(/[०-९]/g, (d) => String(d.charCodeAt(0) - 0x0966))
    .replace(/[೦-೯]/g, (d) => String(d.charCodeAt(0) - 0x0ce6))
    .replace(/[౦-౯]/g, (d) => String(d.charCodeAt(0) - 0x0c66))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0));
}

// Matches: "1500", "Rs 1500", "Rs. 1500", "₹1500", "1,500", "1500.50", "300 रुपये", "300 ರೂಪಾಯಿ", "300 روپے", "300 రూపాయలు"
const AMOUNT_RE =
  /(?:rs\.?\s*|₹\s*|रुपये\s*|रूपಾಯಿ\s*|రూపాయలు\s*|روپے\s*)?([0-9]+(?:,[0-9]{3})*(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)(?:\s*(?:रुपये|रुपया|रूपಾಯಿ|ರೂಪಾಯಿ|రూపಾಯలు|روپے|rupees|rupaye|roopayi|rs))?/i;

function extractAmount(text: string): string | null {
  const normalized = normalizeNumerals(text);
  const m = AMOUNT_RE.exec(normalized) || normalized.match(/(\d+(?:\.\d{1,2})?)/);
  if (!m) return null;
  const raw = m[1].replace(/,/g, "");
  const n = parseFloat(raw);
  if (!isFinite(n) || n <= 0) return null;
  return n.toFixed(2).replace(/\.00$/, "");
}

// ---- Multilingual Keyword Maps (English, Hindi, Kannada, Urdu, Telugu) ----
const INCOME_KEYWORDS = [
  // English
  "earned", "earn", "received", "got", "income", "salary", "payment",
  "tips", "tip", "incentive", "bonus", "payout", "paid me", "collected",
  "made", "profit", "revenue",
  // Hindi
  "कमाए", "कमाई", "मिला", "मिली", "आया", "आए", "प्राप्त", "kamaye", "mila", "aaya", "kamai",
  // Kannada
  "ಬಂತು", "ಗಳಿಸಿದೆ", "ಸಂಪಾದಿಸಿದೆ", "ಗಳಿಸಿದ", "ಬಂದಿದೆ", "bantu", "galiside", "sampadiside",
  // Urdu
  "کمائے", "ملا", "آمدنی", "ملے", "آیا", "حاصل", "kamaye", "aamdani",
  // Telugu
  "వచ్చింది", "సంపాదించాను", "వచ్చాయి", "తీసుకున్నాను", "vachindi", "sampadinchano", "sampadinchina",
];

const EXPENSE_KEYWORDS = [
  // English
  "spent", "spend", "paid", "pay", "bought", "buy", "purchased",
  "expense", "cost", "charged", "deducted", "withdrew", "withdrawal",
  // Hindi
  "खर्च", "खर्चा", "दिए", "दिया", "भरा", "खरीदा", "लगाया", "डाला", "kharch", "kharcha", "diye", "diya", "bhara",
  // Kannada
  "ಖರ್ಚು", "ಕೊಟ್ಟೆ", "ತುಂಬಿದೆ", "ಖರೀದಿಸಿದೆ", "ಹಾಕಿಸಿದೆ", "ಮಾಡಿದೆ", "ಹಾಕಿದೆ", "kharchu", "kotte", "tumbide", "haakiside", "madide",
  // Urdu
  "خرچ", "خرچہ", "دیے", "دیا", "بھرا", "خریدا", "kharch", "kharcha", "diye", "bhara",
  // Telugu
  "ఖర్చు", "ఇచ్చాను", "కొన్నాను", "కట్టాను", "పోశాను", "చేసాను", "చేశాను", "పోయించాను", "kharchu", "ichanu", "kattanu", "chesanu", "poyinchanu",
];

const LIVING_KEYWORDS = [
  // English
  "lunch", "dinner", "breakfast", "food", "meal", "chai", "tea", "coffee",
  "groceries", "grocery", "vegetables", "rice", "dal", "snack", "water",
  "milk", "medicine", "medical", "hospital", "doctor", "cloth", "clothes",
  "rent", "house",
  // Hindi
  "चाय", "खाना", "नाश्ता", "समोसा", "समोसे", "रोटी", "चावल", "दाल", "किराना", "सब्ज़ी", "सब्जी", "किराया", "दवा", "फल",
  // Kannada
  "ಊಟ", "ತಿಂಡಿ", "ಚಹಾ", "ಕಾಫಿ", "ದಿನಸಿ", "ಹಾಲು", "ಔಷಧಿ", "ಬಾಡಿಗೆ", "oota", "tindi", "chaha",
  // Urdu
  "چائے", "کھانا", "ناشتہ", "سموسہ", "روٹی", "چاول", "دال", "راشن", "کرایہ", "دوا",
  // Telugu
  "భోజనం", "టిఫిన్", "టీ", "చాయ్", "సరుకులు", "పాలు", "మందులు", "అద్దె", "bhojanam", "tiffin",
];

const WORK_KEYWORDS = [
  // English
  "petrol", "diesel", "fuel", "cng", "gas", "phone", "recharge", "data",
  "mobile", "vehicle", "bike", "maintenance", "repair", "oil", "tyre",
  "helmet", "battery", "tool",
  // Hindi
  "पेट्रोल", "डीजल", "ईंधन", "गाड़ी", "बाइक", "रिपेयर", "सर्विस", "रिचार्ज", "मोबाइल", "हवा", "पंक्चर",
  // Kannada
  "ಪೆಟ್ರೋಲ್", "ಡೀಸೆಲ್", "ಇಂಧನ", "ಗಾಡಿ", "ಬೈಕ್", "ರಿಪೇರಿ", "ರೀಚಾರ್ಜ್", "ಮೊಬೈಲ್", "ಪೆಟ್ರೋಲ್ಗೆ", "ಪೆಟ್ರೋಲ್ ಹಾಕಿಸಿದೆ",
  // Urdu
  "پیٹرول", "ڈیزل", "گاڑی", "بائیک", "مرمت", "ریچارج", "موبائل", "پنکچر",
  // Telugu
  "పెట్రోల్", "డీజిల్", "ఇంధనం", "బండి", "బైక్", "రిపేరు", "రీఛార్జ్", "మొబైల్", "పెట్రోల్ కోసం",
];

const CATEGORY_MAP: Record<string, string> = {
  // Income
  "earnings":    "earnings",
  "earned":      "earnings",
  "salary":      "earnings",
  "tips":        "tips",
  "tip":         "tips",
  "incentive":   "incentive",
  "bonus":       "incentive",
  "payout":      "payout",
  "advance":     "advance",
  "कमाई":        "earnings",
  "कमाए":        "earnings",
  "ಬಂತು":        "earnings",
  "آمدنی":       "earnings",
  "సంపాదన":      "earnings",
  // Fuel / Work
  "petrol":      "fuel",
  "diesel":      "fuel",
  "fuel":        "fuel",
  "cng":         "fuel",
  "पेट्रोल":     "fuel",
  "डीजल":        "fuel",
  "ಪೆಟ್ರೋಲ್":    "fuel",
  "ಪೆಟ್ರೋಲ್ಗೆ":  "fuel",
  "ಡೀಸೆಲ್":      "fuel",
  "پیٹرول":      "fuel",
  "ڈیزل":        "fuel",
  "పెట్రోల్":    "fuel",
  "డీజిల్":      "fuel",
  // Food / Living
  "lunch":       "food",
  "dinner":      "food",
  "breakfast":   "food",
  "food":        "food",
  "meal":        "food",
  "groceries":   "food",
  "grocery":     "food",
  "chai":        "food",
  "tea":         "food",
  "चाय":         "food",
  "खाना":        "food",
  "नाश्ता":      "food",
  "समोसा":       "food",
  "समोसे":       "food",
  "ಊಟ":          "food",
  "ತಿಂಡಿ":       "food",
  "ಚಹಾ":         "food",
  "چائے":        "food",
  "کھانا":       "food",
  "ناشتہ":       "food",
  "سموسہ":       "food",
  "భోజనం":       "food",
  "టిఫిన్":      "food",
  "టీ":          "food",
  "చాయ్":        "food",
  // Phone / Tech
  "phone":       "phone",
  "recharge":    "phone",
  "mobile":      "phone",
  "रिचार्ज":     "phone",
  "ರೀಚಾರ್ಜ್":    "phone",
  "ریچارج":      "phone",
  "రీఛార్జ్":    "phone",
  // Maintenance
  "maintenance": "maintenance",
  "repair":      "maintenance",
  "service":     "maintenance",
  "रिपेयर":      "maintenance",
  "सर्विस":      "maintenance",
  "ರಿಪೇರಿ":      "maintenance",
  "مرمت":        "maintenance",
  "రిపేరు":      "maintenance",
  // Rent
  "rent":        "rent",
  "emi":         "emi",
  "किराया":      "rent",
  "ಬಾಡಿಗೆ":      "rent",
  "کرایہ":       "rent",
  "అద్దె":       "rent",
};

function guessCategory(text: string, type: "income" | "expense"): string {
  const lower = text.toLowerCase();
  for (const [keyword, cat] of Object.entries(CATEGORY_MAP)) {
    if (lower.includes(keyword.toLowerCase())) return cat;
  }
  return type === "income" ? "earnings" : "other";
}

function guessExpenseType(text: string): "living" | "work" | null {
  const lower = text.toLowerCase();
  for (const kw of WORK_KEYWORDS) {
    if (lower.includes(kw.toLowerCase())) return "work";
  }
  for (const kw of LIVING_KEYWORDS) {
    if (lower.includes(kw.toLowerCase())) return "living";
  }
  return null;
}

function guessDescription(text: string): string | null {
  const cleaned = text
    .replace(/^(i\s+)?(earned|spent|paid|received|got|bought|made)\s+/i, "")
    .replace(/^(rs\.?\s*|₹\s*)?[\d,]+(\.\d+)?\s*/i, "")
    .replace(/\s*(today|yesterday|this morning|this evening|just now)\s*/i, "")
    .trim();
  return cleaned.length > 2 ? cleaned : null;
}

// ---- Query & Intent Detection ----
const QUERY_PATTERNS = [
  // English
  /how much (money|balance|cash) (do i have|left|remaining)/i,
  /what is my (confirmed )?(balance|runway)/i,
  /how many days (of )?runway/i,
  /can i pay (rent|bill|emi)/i,
  /when (is|will) my payout/i,
  /any shortfall/i,
  // Hindi
  /कितना पैसा बचा/i,
  /पैसा कितना बचा/i,
  /बैलेंस क्या है/i,
  /कितना बैलेंस है/i,
  /कितना पैसा है/i,
  /किराया दे सकता/i,
  // Kannada
  /ಎಷ್ಟು ದುಡ್ಡು ಉಳಿದಿದೆ/i,
  /ಬ್ಯಾಲೆನ್ಸ್ ಎಷ್ಟು/i,
  /ಎಷ್ಟು ಹಣ ಇದೆ/i,
  /ಬಾಡಿಗೆ ಕಟ್ಟಬಹುದಾ/i,
  // Urdu
  /کتنے پیسے بچے/i,
  /بیلنس کتنا ہے/i,
  /کتنے پیسے باقی ہیں/i,
  /کرایہ دے سکتا/i,
  // Telugu
  /ఎంత డబ్బు మిగిలి ఉంది/i,
  /బ్యాలెన్స్ ఎంత/i,
  /ఎంత మిగిలింది/i,
  /అద్దె కట్టవచ్చా/i,
];

// ---- Main extractor ----
export function extractTransaction(transcript: string, _language?: string): FinancialExtractionDTO {
  const text = transcript.trim();
  const lower = text.toLowerCase();

  // 1. Check for financial queries first across all 5 languages
  if (
    QUERY_PATTERNS.some((p) => p.test(lower)) ||
    lower.includes("how much money") ||
    lower.includes("what is my balance") ||
    lower.includes("how many days") ||
    lower.includes("कितना पैसा बचा") ||
    lower.includes("बैलेंस क्या") ||
    lower.includes("ಎಷ್ಟು ದುಡ್ಡು ಉಳಿದಿದೆ") ||
    lower.includes("ಬ್ಯಾಲೆನ್ಸ್ ಎಷ್ಟು") ||
    lower.includes("کتنے پیسے بچے") ||
    lower.includes("بیلنس کتنا") ||
    lower.includes("ఎంత డబ్బు మిగిలి ఉంది") ||
    lower.includes("బ్యాలెన్స్ ఎంత")
  ) {
    let queryType: "runway_check" | "balance_check" | "payout_check" | "commitment_check" | "general" = "general";
    if (
      lower.includes("balance") ||
      lower.includes("how much money") ||
      lower.includes("पैसा बचा") ||
      lower.includes("बैलेंस") ||
      lower.includes("ದುಡ್ಡು ಉಳಿದಿದೆ") ||
      lower.includes("ಬ್ಯಾಲೆನ್ಸ್") ||
      lower.includes("پیسے بچے") ||
      lower.includes("بیلنس") ||
      lower.includes("డబ్బు మిగిలి") ||
      lower.includes("బ్యాలెన్స్")
    ) {
      queryType = "balance_check";
    } else if (
      lower.includes("runway") ||
      lower.includes("how many days") ||
      lower.includes("shortfall") ||
      lower.includes("रनवे") ||
      lower.includes("ರನ್‌ವೇ") ||
      lower.includes("رن وے") ||
      lower.includes("రన్ వే")
    ) {
      queryType = "runway_check";
    } else if (lower.includes("payout") || lower.includes("पेआउट") || lower.includes("ಪೇಔಟ್")) {
      queryType = "payout_check";
    } else if (
      lower.includes("rent") ||
      lower.includes("emi") ||
      lower.includes("bill") ||
      lower.includes("किराया") ||
      lower.includes("ಬಾಡಿಗೆ") ||
      lower.includes("کرایہ") ||
      lower.includes("అద్దె")
    ) {
      queryType = "commitment_check";
    }

    return {
      entry_intent: "financial_query",
      action_intent: "unknown",
      target_id: null,
      transaction: null,
      expected_payout: null,
      balance_checkin: null,
      financial_query: {
        query_type: queryType,
        target_date: null,
        target_entity: null,
      },
      metadata: {
        certainty: 0.95,
        clarification_required: false,
        clarification_reason: null,
        clarification_questions: [],
        raw_utterance: text,
      },
    };
  }

  // 2. Check for expected payout intent (future platform payouts, NOT received yet)
  const isExpectedPayout =
    (lower.includes("expecting") ||
      lower.includes("expected") ||
      lower.includes("will receive") ||
      lower.includes("scheduled") ||
      lower.includes("आएंगे") ||
      lower.includes("मिलेगा") ||
      lower.includes("बರುತ್ತೆ") ||
      lower.includes("ಬರಲಿದೆ") ||
      lower.includes("ملیں گے") ||
      lower.includes("آئیں گے") ||
      lower.includes("వస్తుంది") ||
      lower.includes("రావాలి")) &&
    (lower.includes("payout") ||
      lower.includes("payment") ||
      lower.includes("salary") ||
      lower.includes("swiggy") ||
      lower.includes("zomato") ||
      lower.includes("uber") ||
      lower.includes("स्विग्गी") ||
      lower.includes("ज़ोमैटो") ||
      lower.includes("ಸ್ವಿಗ್ಗಿ") ||
      lower.includes("ಜೊಮ್ಯಾಟೊ") ||
      lower.includes("سوئگی") ||
      lower.includes("زومیٹو") ||
      lower.includes("స్విగ్గీ") ||
      lower.includes("జొమాటో"));

  if (isExpectedPayout) {
    const amount = extractAmount(text);
    const source =
      lower.includes("swiggy") || lower.includes("स्विग्गी") || lower.includes("ಸ್ವಿಗ್ಗಿ") || lower.includes("سوئگی") || lower.includes("స్విగ్గీ")
        ? "Swiggy"
        : lower.includes("zomato") || lower.includes("ज़ोमैटो") || lower.includes("ಜೊಮ್ಯಾಟೊ") || lower.includes("زومیٹو") || lower.includes("జొమాటో")
        ? "Zomato"
        : lower.includes("uber")
        ? "Uber"
        : null;

    return {
      entry_intent: "expected_payout",
      action_intent: "create",
      target_id: null,
      transaction: null,
      expected_payout: {
        expected_amount: amount,
        kind: "platform_payout",
        source,
        expected_date: null,
        status: "scheduled",
        note: text,
      },
      balance_checkin: null,
      metadata: {
        certainty: amount ? 0.9 : 0.6,
        clarification_required: !amount,
        clarification_reason: !amount ? "Payout amount was not specified." : null,
        clarification_questions: !amount ? ["What is the expected payout amount?"] : [],
        raw_utterance: text,
      },
    };
  }

  // 3. Check for balance check-in intent ("I have 500 in cash and 2000 in bank" / "میرے پاس نقد 500 اور بینک میں 2000 ہیں")
  const isCheckin =
    (lower.includes("in cash") ||
      lower.includes("cash in hand") ||
      lower.includes("in bank") ||
      lower.includes("in my account") ||
      lower.includes("नकद") ||
      lower.includes("ನಗದು") ||
      lower.includes("نقد") ||
      lower.includes("నగదు") ||
      lower.includes("बैंक") ||
      lower.includes("ಬ್ಯಾಂಕ್") ||
      lower.includes("بینک") ||
      lower.includes("బ్యాంకు")) &&
    (lower.includes("i have") ||
      lower.includes("balance") ||
      lower.includes("pocket") ||
      lower.includes("मेरे पास") ||
      lower.includes("नकल") ||
      lower.includes("ನನ್ನ ಹತ್ತಿರ") ||
      lower.includes("میرے پاس") ||
      lower.includes("నా దగ్గర"));

  if (isCheckin) {
    const normalized = normalizeNumerals(lower);
    const cashMatch =
      /cash\s*(?:of|is|:)?\s*(?:rs\.?|₹)?\s*(\d+)/i.exec(normalized) ||
      /(\d+)\s*(?:rs\.?|₹|रुपये|ರೂಪಾಯಿ|روپے|రూపాయలు)?\s*(?:in\s+)?cash/i.exec(normalized) ||
      /नकद\s*(\d+)/i.exec(normalized) ||
      /(\d+)\s*नकद/i.exec(normalized) ||
      /ನಗದು\s*(\d+)/i.exec(normalized) ||
      /(\d+)\s*ನಗದು/i.exec(normalized) ||
      /نقد\s*(\d+)/i.exec(normalized) ||
      /(\d+)\s*نقد/i.exec(normalized) ||
      /నగదు\s*(\d+)/i.exec(normalized) ||
      /(\d+)\s*నగదు/i.exec(normalized);

    const bankMatch =
      /bank\s*(?:of|is|:)?\s*(?:rs\.?|₹)?\s*(\d+)/i.exec(normalized) ||
      /(\d+)\s*(?:rs\.?|₹|रुपये|ರೂಪಾಯಿ|روپے|రూపాయలు)?\s*(?:in\s+)?bank/i.exec(normalized) ||
      /बैंक\s*(?:में)?\s*(\d+)/i.exec(normalized) ||
      /(\d+)\s*बैंक/i.exec(normalized) ||
      /ಬ್ಯಾಂಕ್\s*(?:ನಲ್ಲಿ)?\s*(\d+)/i.exec(normalized) ||
      /(\d+)\s*ಬ್ಯಾಂಕ್/i.exec(normalized) ||
      /بینک\s*(?:میں)?\s*(\d+)/i.exec(normalized) ||
      /(\d+)\s*بینک/i.exec(normalized) ||
      /బ్యాంకు\s*(?:లో)?\s*(\d+)/i.exec(normalized) ||
      /(\d+)\s*బ్యాంకు/i.exec(normalized);

    const cashAmount = cashMatch ? cashMatch[1] : null;
    const bankAmount = bankMatch ? bankMatch[1] : null;

    return {
      entry_intent: "balance_checkin",
      action_intent: "create",
      target_id: null,
      transaction: null,
      expected_payout: null,
      balance_checkin: {
        cash_amount: cashAmount,
        bank_amount: bankAmount,
        not_mine_amount: "0",
        note: text,
        checked_at: new Date().toISOString(),
      },
      metadata: {
        certainty: cashAmount && bankAmount ? 0.95 : 0.6,
        clarification_required: !cashAmount && !bankAmount,
        clarification_reason: !cashAmount && !bankAmount ? "Please specify your cash and bank amounts." : null,
        clarification_questions: !cashAmount && !bankAmount ? ["How much cash and bank balance do you have?"] : [],
        raw_utterance: text,
      },
    };
  }

  // 4. Default: Transaction extraction across English and Indic scripts
  const amount = extractAmount(text);

  // Determine intent (income vs expense)
  const isIncome = INCOME_KEYWORDS.some((kw) => lower.includes(kw.toLowerCase()));
  const isExpense = EXPENSE_KEYWORDS.some((kw) => lower.includes(kw.toLowerCase()));

  // If text mentions work or living keywords directly without an explicit verb (e.g. "ಪೆಟ್ರೋಲ್ ಹಾಕಿಸಿದೆ" or "300 petrol"), it's an expense
  const hasWorkWord = WORK_KEYWORDS.some((kw) => lower.includes(kw.toLowerCase()));
  const hasLivingWord = LIVING_KEYWORDS.some((kw) => lower.includes(kw.toLowerCase()));

  let transactionType: "income" | "expense" | null = null;
  if (isIncome && !isExpense) {
    transactionType = "income";
  } else if (isExpense && !isIncome) {
    transactionType = "expense";
  } else if (isExpense && isIncome) {
    const firstIncome = Math.min(...INCOME_KEYWORDS.map((kw) => lower.indexOf(kw.toLowerCase())).filter((i) => i >= 0), Infinity);
    const firstExpense = Math.min(...EXPENSE_KEYWORDS.map((kw) => lower.indexOf(kw.toLowerCase())).filter((i) => i >= 0), Infinity);
    transactionType = firstExpense < firstIncome ? "expense" : "income";
  } else if (!isIncome && !isExpense && (hasWorkWord || hasLivingWord)) {
    // Implicit expense by mentioning fuel, food, etc.
    transactionType = "expense";
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
