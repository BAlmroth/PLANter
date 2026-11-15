// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Group } from "../groups/types";
import { ItemForm } from "./ItemForm";

// Tells React that this is a test environment, so act() works without warnings
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function group(id: string, name: string): Group {
  return { id, projectId: "p1", name, description: null, color: "#3D8FD1", createdAt: "2026-11-04T10:00:00Z", itemIds: [] };
}

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

// The checkbox of a group, found by the group name in its label
function checkboxFor(name: string) {
  const label = [...container.querySelectorAll("label")].find((l) => l.textContent === name);
  return label?.querySelector<HTMLInputElement>('input[type="checkbox"]') ?? null;
}

async function fillTitleAndSubmit(title: string) {
  const input = container.querySelector<HTMLInputElement>('input[type="text"]')!;
  // React listens for "input" events, and the value has to be set the way the browser sets it
  const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
  await act(async () => {
    setValue.call(input, title);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await act(async () => {
    container.querySelector("form")!.requestSubmit();
  });
}

describe("ItemForm groups", () => {
  const groups = [group("nav", "Navigation"), group("forms", "Forms")];

  it("shows no group checkboxes when there are no groups", () => {
    act(() => root.render(<ItemForm submitLabel="Add" onSubmit={vi.fn()} onCancel={vi.fn()} />));
    expect(container.querySelector("fieldset")).toBeNull();
  });

  it("sends the ticked groups with the other values", async () => {
    const onSubmit = vi.fn().mockResolvedValue(null);
    act(() => root.render(<ItemForm groups={groups} submitLabel="Add" onSubmit={onSubmit} onCancel={vi.fn()} />));

    expect(checkboxFor("Navigation")?.checked).toBe(false);
    act(() => checkboxFor("Forms")!.click());
    await fillTitleAndSubmit("Login form");

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ title: "Login form", groupIds: ["forms"] }));
  });

  it("starts with the item's groups ticked and can untick them", async () => {
    const onSubmit = vi.fn().mockResolvedValue(null);
    act(() =>
      root.render(
        <ItemForm
          groups={groups}
          initialValues={{ title: "Header", groupIds: ["nav", "forms"] }}
          submitLabel="Save"
          onSubmit={onSubmit}
          onCancel={vi.fn()}
        />,
      ),
    );

    expect(checkboxFor("Navigation")?.checked).toBe(true);
    act(() => checkboxFor("Navigation")!.click());
    await act(async () => {
      container.querySelector("form")!.requestSubmit();
    });

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ groupIds: ["forms"] }));
  });
});
