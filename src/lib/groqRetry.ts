import Groq from "groq-sdk";
import type { ChatCompletion, ChatCompletionCreateParamsNonStreaming } from "groq-sdk/resources/chat/completions";

export interface GroqRetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  fallbackModel?: string;
  onRetry?: (attempt: number, delayMs: number, error: unknown, model: string) => void;
  onFallback?: (fromModel: string, toModel: string, error: unknown) => void;
}

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

/**
 * Executes a Groq chat completion with 2 retries (progressive backoff + retry-after header).
 * If primary model exhausts retries with 429/5xx, seamlessly falls back to fallbackModel if provided.
 */
export async function createGroqChatCompletionWithRetry(
  groq: Groq,
  params: ChatCompletionCreateParamsNonStreaming,
  options: GroqRetryOptions = {}
): Promise<ChatCompletion> {
  const maxRetries = options.maxRetries ?? 2;
  const initialDelayMs = options.initialDelayMs ?? 1500;
  const maxDelayMs = options.maxDelayMs ?? 10000;
  const fallbackModel = options.fallbackModel;

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

        // Calculate progressive backoff (1.5s, 3s, etc.) or respect retry-after header
        const progressiveDelay = initialDelayMs * Math.pow(2, attempt);
        const waitMs = extractRetryDelayMs(err, progressiveDelay, maxDelayMs);

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

    // If no fallback or fallback also failed, rethrow the last error
    throw lastError;
  }
}
