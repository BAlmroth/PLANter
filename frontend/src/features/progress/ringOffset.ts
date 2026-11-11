// How the progress ring is drawn: the colored circle has a dash as long as the whole circle
// (stroke-dasharray = circumference). stroke-dashoffset moves that dash back along the line,
// so an offset of 0 shows the full circle and an offset of the circumference shows nothing.
// The part that is hidden is the part that is not done.
export function ringOffset(percent: number, circumference: number): number {
  // A percent outside 0–100 would draw past the start of the circle, so it is clamped
  const clamped = Math.min(100, Math.max(0, percent));
  return circumference * (1 - clamped / 100);
}
