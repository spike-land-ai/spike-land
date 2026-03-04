import { beforeEach, describe, expect, it, vi } from "vitest";
import { MutationType } from "../../../../../src/react-ts-worker/react-worker-dom/bridge/protocol.js";

// We need to mock Worker since jsdom doesn't support it fully
class MockWorker {
  onmessage: ((ev: MessageEvent) => void) | null = null;
  postMessage = vi.fn();
  terminate = vi.fn();
  _url: string;
  _options: unknown;

  constructor(url: string, options?: unknown) {
    this._url = url;
    this._options = options;
  }
}

vi.stubGlobal("Worker", MockWorker);

// Import after stubbing
const { MainThreadApplier } = await import(
  "../../../../../src/react-ts-worker/react-worker-dom/bridge/main-applier.js"
);

describe("MainThreadApplier", () => {
  let container: HTMLElement;
  let applier: InstanceType<typeof MainThreadApplier>;
  let mockWorker: MockWorker;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    applier = new MainThreadApplier(container, "blob:fake-url");
    // Get reference to the mock worker
    mockWorker = (applier as unknown as Record<string, unknown>).worker as MockWorker;
  });

  function sendMutations(mutations: unknown[]) {
    mockWorker.onmessage?.({ data: { kind: "mutations", mutations } } as MessageEvent);
  }

  it("registers container as node 0", () => {
    const nodeMap = (applier as unknown as Record<string, unknown>).nodeMap as Map<number, Node>;
    expect(nodeMap.get(0)).toBe(container);
  });

  it("CREATE_ELEMENT mutation creates an element", () => {
    sendMutations([{ type: MutationType.CREATE_ELEMENT, targetId: 1, tagName: "div" }]);
    const nodeMap = (applier as unknown as Record<string, unknown>).nodeMap as Map<number, Node>;
    const el = nodeMap.get(1);
    expect(el).toBeDefined();
    expect((el as Element).tagName.toLowerCase()).toBe("div");
  });

  it("CREATE_ELEMENT_NS mutation creates namespaced element", () => {
    sendMutations([{
      type: MutationType.CREATE_ELEMENT_NS,
      targetId: 2,
      tagName: "svg",
      namespace: "http://www.w3.org/2000/svg",
    }]);
    const nodeMap = (applier as unknown as Record<string, unknown>).nodeMap as Map<number, Node>;
    const el = nodeMap.get(2);
    expect(el).toBeDefined();
    expect((el as Element).namespaceURI).toBe("http://www.w3.org/2000/svg");
  });

  it("CREATE_TEXT mutation creates text node", () => {
    sendMutations([{ type: MutationType.CREATE_TEXT, targetId: 3, value: "hello" }]);
    const nodeMap = (applier as unknown as Record<string, unknown>).nodeMap as Map<number, Node>;
    const node = nodeMap.get(3);
    expect(node).toBeDefined();
    expect((node as Text).data).toBe("hello");
  });

  it("CREATE_TEXT with null value", () => {
    sendMutations([{ type: MutationType.CREATE_TEXT, targetId: 10, value: null }]);
    const nodeMap = (applier as unknown as Record<string, unknown>).nodeMap as Map<number, Node>;
    expect((nodeMap.get(10) as Text).data).toBe("");
  });

  it("APPEND_CHILD appends child to parent", () => {
    sendMutations([
      { type: MutationType.CREATE_ELEMENT, targetId: 4, tagName: "span" },
      { type: MutationType.APPEND_CHILD, targetId: 4, parentId: 0 },
    ]);
    expect(container.children).toHaveLength(1);
    expect(container.children[0]!.tagName.toLowerCase()).toBe("span");
  });

  it("APPEND_CHILD skips missing parent", () => {
    sendMutations([
      { type: MutationType.CREATE_ELEMENT, targetId: 5, tagName: "p" },
      { type: MutationType.APPEND_CHILD, targetId: 5, parentId: 999 },
    ]);
    // Should not throw and no children appended to container
    expect(container.children).toHaveLength(0);
  });

  it("INSERT_BEFORE inserts element before reference", () => {
    sendMutations([
      { type: MutationType.CREATE_ELEMENT, targetId: 6, tagName: "div" },
      { type: MutationType.CREATE_ELEMENT, targetId: 7, tagName: "span" },
      { type: MutationType.APPEND_CHILD, targetId: 6, parentId: 0 },
      { type: MutationType.INSERT_BEFORE, targetId: 7, parentId: 0, refId: 6 },
    ]);
    expect(container.children).toHaveLength(2);
    expect(container.children[0]!.tagName.toLowerCase()).toBe("span");
  });

  it("INSERT_BEFORE with missing ref (inserts at end)", () => {
    sendMutations([
      { type: MutationType.CREATE_ELEMENT, targetId: 11, tagName: "div" },
      { type: MutationType.CREATE_ELEMENT, targetId: 12, tagName: "span" },
      { type: MutationType.APPEND_CHILD, targetId: 11, parentId: 0 },
      { type: MutationType.INSERT_BEFORE, targetId: 12, parentId: 0, refId: 999 },
    ]);
    // refId 999 not found, so insertBefore(child, null) => append
    expect(container.children).toHaveLength(2);
  });

  it("REMOVE_CHILD removes element from parent", () => {
    sendMutations([
      { type: MutationType.CREATE_ELEMENT, targetId: 8, tagName: "div" },
      { type: MutationType.APPEND_CHILD, targetId: 8, parentId: 0 },
    ]);
    expect(container.children).toHaveLength(1);
    sendMutations([
      { type: MutationType.REMOVE_CHILD, targetId: 8, parentId: 0 },
    ]);
    expect(container.children).toHaveLength(0);
  });

  it("REMOVE_CHILD skips when parent/child not found", () => {
    expect(() => sendMutations([
      { type: MutationType.REMOVE_CHILD, targetId: 999, parentId: 0 },
    ])).not.toThrow();
  });

  it("SET_ATTRIBUTE sets attribute on element", () => {
    sendMutations([
      { type: MutationType.CREATE_ELEMENT, targetId: 20, tagName: "div" },
      { type: MutationType.SET_ATTRIBUTE, targetId: 20, name: "data-x", value: "hello" },
    ]);
    const nodeMap = (applier as unknown as Record<string, unknown>).nodeMap as Map<number, Node>;
    expect((nodeMap.get(20) as Element).getAttribute("data-x")).toBe("hello");
  });

  it("REMOVE_ATTRIBUTE removes attribute from element", () => {
    sendMutations([
      { type: MutationType.CREATE_ELEMENT, targetId: 21, tagName: "div" },
      { type: MutationType.SET_ATTRIBUTE, targetId: 21, name: "data-y", value: "val" },
      { type: MutationType.REMOVE_ATTRIBUTE, targetId: 21, name: "data-y" },
    ]);
    const nodeMap = (applier as unknown as Record<string, unknown>).nodeMap as Map<number, Node>;
    expect((nodeMap.get(21) as Element).hasAttribute("data-y")).toBe(false);
  });

  it("SET_STYLE sets style property on HTMLElement", () => {
    sendMutations([
      { type: MutationType.CREATE_ELEMENT, targetId: 22, tagName: "div" },
      { type: MutationType.SET_STYLE, targetId: 22, name: "color", value: "red" },
    ]);
    const nodeMap = (applier as unknown as Record<string, unknown>).nodeMap as Map<number, Node>;
    expect((nodeMap.get(22) as HTMLElement).style.color).toBe("red");
  });

  it("SET_TEXT sets text node data", () => {
    sendMutations([
      { type: MutationType.CREATE_TEXT, targetId: 23, value: "initial" },
      { type: MutationType.SET_TEXT, targetId: 23, value: "updated" },
    ]);
    const nodeMap = (applier as unknown as Record<string, unknown>).nodeMap as Map<number, Node>;
    expect((nodeMap.get(23) as Text).data).toBe("updated");
  });

  it("SET_TEXT_CONTENT sets textContent", () => {
    sendMutations([
      { type: MutationType.CREATE_ELEMENT, targetId: 24, tagName: "div" },
      { type: MutationType.SET_TEXT_CONTENT, targetId: 24, value: "text content" },
    ]);
    const nodeMap = (applier as unknown as Record<string, unknown>).nodeMap as Map<number, Node>;
    expect((nodeMap.get(24) as HTMLElement).textContent).toBe("text content");
  });

  it("destroy terminates worker and clears nodeMap", () => {
    applier.destroy();
    expect(mockWorker.terminate).toHaveBeenCalled();
    const nodeMap = (applier as unknown as Record<string, unknown>).nodeMap as Map<number, Node>;
    expect(nodeMap.size).toBe(0);
  });

  it("ignores non-mutations messages", () => {
    expect(() => {
      mockWorker.onmessage?.({ data: { kind: "other" } } as MessageEvent);
    }).not.toThrow();
  });
});
