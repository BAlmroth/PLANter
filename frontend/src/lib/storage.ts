// Small yes/no flags in localStorage, for example "the user closed the intro on this page".
// Stored per browser only: on a new browser or device the intros show again, which is fine for help text.
// localStorage can throw (private windows, blocked site data), so every access is wrapped:
// if it fails, the flag counts as not set and the app keeps working.

const PREFIX = "planter:";

export function readFlag(key: string): boolean {
  try {
    return localStorage.getItem(PREFIX + key) === "1";
  } catch {
    return false;
  }
}

export function writeFlag(key: string, value: boolean): void {
  try {
    if (value) localStorage.setItem(PREFIX + key, "1");
    else localStorage.removeItem(PREFIX + key);
  } catch {
    // Not saved. The intro shows again next time, nothing breaks.
  }
}

// Removes every flag that starts with `group` (for example "tour:"), used by "Restart the tutorial"
export function clearFlags(group: string): void {
  try {
    const keys = Object.keys(localStorage).filter((key) => key.startsWith(PREFIX + group));
    for (const key of keys) localStorage.removeItem(key);
  } catch {
    // Nothing to clear
  }
}
