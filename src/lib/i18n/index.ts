import type { Dict } from "./types";
import { en as commonEn, fr as commonFr } from "./dict/common";
import { en as learnEn, fr as learnFr } from "./dict/learn";
import { en as workEn, fr as workFr } from "./dict/work";
import { en as prepAEn, fr as prepAFr } from "./dict/prepA";
import { en as prepBEn, fr as prepBFr } from "./dict/prepB";
import { en as payEn, fr as payFr } from "./dict/pay";

const en: Dict = { ...commonEn, ...learnEn, ...workEn, ...prepAEn, ...prepBEn, ...payEn };
const fr: Dict = { ...commonFr, ...learnFr, ...workFr, ...prepAFr, ...prepBFr, ...payFr };

export const locale: "en" | "fr" = "fr";

const dictionaries: Record<"en" | "fr", Dict> = { en, fr };
const active = dictionaries[locale];

/**
 * Translate a key to the active locale (French by default).
 * Falls back to English, then to the raw key, if a translation is missing.
 * `vars` fills `{placeholder}` tokens in the translated string.
 */
export function t(key: string, vars?: Record<string, string | number>): string {
  let str = active[key] ?? fr[key] ?? en[key] ?? key;
  if (vars) {
    for (const [name, value] of Object.entries(vars)) {
      str = str.split(`{${name}}`).join(String(value));
    }
  }
  return str;
}
