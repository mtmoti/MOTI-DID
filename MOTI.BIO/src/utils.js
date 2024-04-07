import words from "./badWords.json";

export function checkForBadWords(name) {
  for (const e of words) {
    if (e.endsWith("*")) {
      if (name.includes(e.split("*")[0])) return false;
    } else if (e === name) return false;
  }
  return true;
}
