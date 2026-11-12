// A link is only made clickable when it is http(s). The backend checks this too (belt and braces).
export function isHttpUrl(url: string) {
  return /^https?:\/\//i.test(url);
}
