import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// api.ts imports the Supabase client and the env check. Both need real environment variables,
// so they are replaced with fakes here. These tests only look at how apiRequest handles responses.
// vi.mock calls are moved to the top of the file, so the fake must be created with vi.hoisted
const getSession = vi.hoisted(() => vi.fn());
vi.mock("./supabaseClient", () => ({ supabase: { auth: { getSession } } }));
vi.mock("../config/env", () => ({ env: { VITE_API_URL: "http://api.test" } }));

import { ApiError, apiRequest } from "./api";

// fetch is replaced with a fake, so no real request is sent
const fetchMock = vi.fn();

beforeEach(() => {
  getSession.mockResolvedValue({ data: { session: { access_token: "token-a" } } });
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

// Builds a Response like the one the backend would send
function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status });
}

describe("apiRequest: requests", () => {
  it("sends the token as a Bearer header to the API url", async () => {
    fetchMock.mockResolvedValue(jsonResponse([]));
    await apiRequest("/api/projects");

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe("http://api.test/api/projects");
    expect(options.headers.Authorization).toBe("Bearer token-a");
  });

  it("sends no Authorization header when there is no session", async () => {
    getSession.mockResolvedValue({ data: { session: null } });
    fetchMock.mockResolvedValue(jsonResponse([]));
    await apiRequest("/api/projects");

    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBeUndefined();
  });
});

describe("apiRequest: success", () => {
  it("returns the parsed JSON body", async () => {
    fetchMock.mockResolvedValue(jsonResponse([{ id: "1", name: "My app" }]));
    expect(await apiRequest("/api/projects")).toEqual([{ id: "1", name: "My app" }]);
  });

  it("returns undefined for 204 No Content (DELETE)", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    expect(await apiRequest("/api/projects/1", { method: "DELETE" })).toBeUndefined();
  });
});

describe("apiRequest: errors", () => {
  it("throws an ApiError with status, message and details from the backend's error shape", async () => {
    const details = { formErrors: [], fieldErrors: { name: ["Too small"] } };
    fetchMock.mockResolvedValue(
      jsonResponse({ error: { message: "Invalid request body", details } }, 400),
    );

    const error = await apiRequest("/api/projects").catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 400, message: "Invalid request body", details });
  });

  it("keeps the 404 status so a page can show 'not found'", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ error: { message: "Project not found" } }, 404));

    const error = await apiRequest("/api/projects/1").catch((e: unknown) => e);
    expect(error).toMatchObject({ status: 404, message: "Project not found" });
  });

  it("falls back to a generic message when the error body is not JSON", async () => {
    fetchMock.mockResolvedValue(new Response("<html>Bad gateway</html>", { status: 502 }));

    const error = await apiRequest("/api/projects").catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 502, message: "Request failed (502)" });
  });

  it("falls back to a generic message when the JSON does not have the error shape", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ oops: true }, 500));

    const error = await apiRequest("/api/projects").catch((e: unknown) => e);
    expect(error).toMatchObject({ status: 500, message: "Request failed (500)" });
  });

  it("throws an ApiError with status 0 when the server cannot be reached", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

    const error = await apiRequest("/api/projects").catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 0 });
  });
});
