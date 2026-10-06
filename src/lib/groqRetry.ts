import Groq from "groq-sdk";
import type { ChatCompletion, ChatCompletionCreateParamsNonStreaming } from "groq-sdk/resources/chat/completions";

export interface GroqRetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  totalBudgetMs?: number;
  fallbackModel?: string;
  onRetry?: (attempt: number, delayMs: number, error: unknown, model: string) => void;
  onFallback?: (fromModel: string, toModel: string, error: unknown) => void;
}

export const WARM_RETRY_ERROR_MESSAGE =
  "Le service de révision est très sollicité en ce moment ! Pas d'inquiétude, tes révisions et crédits sont préservés. Réessaie dans quelques instants.";

/**
 * Extracts retry delay in ms from error headers (Retry-After) or defaults.
 */
function extractRetryDelayMs(error: unknown, fallbackDelayMs: number, maxDelayMs: number): number {
  if (error && typeof error === "object") {
    const errObj = error as Record<string, unknown>;
    const headers = errObj.headers as Headers | Record<string, string> | undefined;

    let retryAfterHeader: string | null = null;
    if (headers) {
      if (typeof (headers as Headers).get === "function") {
        retryAfterHeader = (headers as Headers).get("retry-after");
      } else if (typeof headers === "object") {
        retryAfterHeader = (headers as Record<string, string>)["retry-after"] ?? null;
      }
    }

    if (retryAfterHeader) {
      const parsed = parseFloat(retryAfterHeader);
      if (!isNaN(parsed) && parsed > 0) {
        return Math.min(Math.ceil(parsed * 1000), maxDelayMs);
      }
    }

    // Sometimes error message contains "Please try again in X.XXs"
    if (typeof errObj.message === "string") {
      const match = errObj.message.match(/try again in ([0-9.]+)s/i);
      if (match?.[1]) {
        const seconds = parseFloat(match[1]);
        if (!isNaN(seconds) && seconds > 0) {
          return Math.min(Math.ceil(seconds * 1000) + 200, maxDelayMs);
        }
      }
    }
  }

  return Math.min(fallbackDelayMs, maxDelayMs);
}

function isRetryableError(error: unknown): boolean {
  if (error && typeof error === "object") {
    const status = (error as { status?: number }).status;
    if (typeof status === "number") {
      // 429 = Rate Limit, 5xx = Server Error
      return status === 429 || (status >= 500 && status < 600);
    }
    const message = ((error as { message?: string }).message || "").toLowerCase();
    if (message.includes("rate limit") || message.includes("429") || message.includes("overloaded") || message.includes("503") || message.includes("timeout")) {
      return true;
    }
  }
  return false;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function getDefaultTimeBudgetMs(): number {
  if (typeof process !== "undefined" && process.env?.PREP_TIME_BUDGET_MS) {
    const parsed = parseInt(process.env.PREP_TIME_BUDGET_MS, 10);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  return 45000; // 45 secondes par défaut (compatible maxDuration = 60 sur Vercel)
}

/**
 * Executes a Groq chat completion with retries (progressive backoff + retry-after header).
 * Ne coupe jamais une génération en cours : le budget temporel ne limite que la planification des réessais.
 */
export async function createGroqChatCompletionWithRetry(
  groq: Groq,
  params: ChatCompletionCreateParamsNonStreaming,
  options: GroqRetryOptions = {}
): Promise<ChatCompletion> {
  const maxRetries = options.maxRetries ?? 2; // 2 réessais rétablis
  const initialDelayMs = options.initialDelayMs ?? 1500;
  const maxDelayMs = options.maxDelayMs ?? 8000;
  const totalBudgetMs = options.totalBudgetMs ?? getDefaultTimeBudgetMs();
  const fallbackModel = options.fallbackModel;

  const startTime = Date.now();
  let currentModel = params.model;
  let hasSwitchedToFallback = false;

  while (true) {
    let lastError: unknown = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await groq.chat.completions.create({
          ...params,
          model: currentModel,
        });
      } catch (err: unknown) {
        lastError = err;

        const canRetry = attempt < maxRetries && isRetryableError(err);
        if (!canRetry) {
          break;
        }

        // Calculate progressive backoff or respect retry-after header
        const progressiveDelay = initialDelayMs * Math.pow(2, attempt);
        const waitMs = extractRetryDelayMs(err, progressiveDelay, maxDelayMs);

        // Si l'attente du prochain réessai dépasserait le budget, on s'arrête proprement
        const elapsed = Date.now() - startTime;
        if (elapsed + waitMs > totalBudgetMs) {
          console.warn(`[GroqRetry] Le réessai dépasserait le budget de ${totalBudgetMs}ms (${elapsed + waitMs}ms). Arrêt avant timeout.`);
          throw new Error(WARM_RETRY_ERROR_MESSAGE);
        }

        options.onRetry?.(attempt + 1, waitMs, err, currentModel);
        console.warn(`[GroqRetry] Model "${currentModel}" failed (${(err as { status?: number })?.status || "error"}). Retrying attempt ${attempt + 1}/${maxRetries} after ${waitMs}ms...`);

        await sleep(waitMs);
      }
    }

    // If primary model failed with retryable error and a fallback model is available
    if (!hasSwitchedToFallback && fallbackModel && fallbackModel !== currentModel && isRetryableError(lastError)) {
      console.warn(`[GroqRetry] Primary model "${currentModel}" failed after retries. Switching to fallback model "${fallbackModel}".`);
      options.onFallback?.(currentModel, fallbackModel, lastError);
      currentModel = fallbackModel;
      hasSwitchedToFallback = true;
      continue;
    }

    // Si erreur 429 ou 5xx après épuisement du réessai, propager le message chaleureux
    if (isRetryableError(lastError)) {
      throw new Error(WARM_RETRY_ERROR_MESSAGE);
    }

    // If no fallback or fallback also failed, rethrow the last error
    throw lastError;
  }
}
