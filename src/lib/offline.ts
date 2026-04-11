export function saveOffline(key: string, data: unknown): void {
  try {
    localStorage.setItem(
      "gsn_prep_" + key,
      JSON.stringify({ data, savedAt: new Date().toISOString() })
    );
  } catch (e) {
    console.error("Offline save failed:", e);
  }
}

export function loadOffline<T>(key: string): T | null {
  try {
    const item = localStorage.getItem("gsn_prep_" + key);
    if (!item) return null;
    return (JSON.parse(item) as { data: T }).data;
  } catch {
    return null;
  }
}

export function isOnline(): boolean {
  if (typeof window === "undefined") return true;
  return navigator.onLine;
}
