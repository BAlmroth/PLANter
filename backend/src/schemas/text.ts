import { z } from "zod";

// Postgres cannot store the null character (\u0000) in a text column: the insert fails, and the
// API answered 500 instead of 400. Every text field that is saved starts from this schema, so the
// request is rejected by Zod first. It is a regex check on a normal string, so .trim(), .min()
// and .max() can still be chained after it.
const NO_NULL_CHARACTER = /^[^\u0000]*$/;
const MESSAGE = "must not contain a null character";

export const textSchema = z.string().regex(NO_NULL_CHARACTER, MESSAGE);

// The same check for URL fields (z.url() is its own string format)
export const urlSchema = z.url().regex(NO_NULL_CHARACTER, MESSAGE);
