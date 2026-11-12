// A color is only used in a style attribute when it looks like "#RRGGBB". The backend checks this too.
export function isHexColor(value: string) {
  return /^#[0-9a-f]{6}$/i.test(value);
}
