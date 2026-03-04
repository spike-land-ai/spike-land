import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createContainerNode,
  MutationCollector,
  nodeMap,
  WorkerDocumentImpl,
  WorkerElementImpl,
  WorkerNodeImpl,
  WorkerTextImpl,
} from "../../../../../src/react-ts-worker/react-worker-dom/bridge/worker-document.js";
import { MutationType } from "../../../../../src/react-ts-worker/react-worker-dom/bridge/protocol.js";

describe("WorkerDocument", () => {
  beforeEach(() => {
    // Mock self.postMessage
    vi.stubGlobal("self", { postMessage: vi.fn() });
    vi.stubGlobal("queueMicrotask", (fn: () => void) => Promise.resolve().then(fn));
  });

  describe("MutationCollector", () => {
    it("records mutations and flushes via microtask", async () => {
      const postMessage = vi.fn();
      vi.stubGlobal("self", { postMessage });

      const collector = new MutationCollector();
      collector.record({
        type: MutationType.CREATE_ELEMENT,
        targetId: 1,
        tagName: "div",
      });

      // Flush microtasks
      await Promise.resolve();

      expect(postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          kind: "mutations",
          mutations: expect.arrayContaining([
            expect.objectContaining({ type: MutationType.CREATE_ELEMENT }),
          ]),
        }),
      );
    });

    it("batches multiple mutations in one flush", async () => {
      const postMessage = vi.fn();
      vi.stubGlobal("self", { postMessage });

      const collector = new MutationCollector();
      collector.record({ type: MutationType.CREATE_ELEMENT, targetId: 1, tagName: "div" });
      collector.record({ type: MutationType.CREATE_TEXT, targetId: 2, value: "hello" });

      await Promise.resolve();

      expect(postMessage).toHaveBeenCalledTimes(1);
      const batch = postMessage.mock.calls[0][0];
      expect(batch.mutations.length).toBe(2);
    });

    it("does not flush when queue is empty", async () => {
      const postMessage = vi.fn();
      vi.stubGlobal("self", { postMessage });

      // Don't record anything
      await Promise.resolve();

      expect(postMessage).not.toHaveBeenCalled();
    });
  });

  describe("WorkerNodeImpl", () => {
    it("creates with unique node id", () => {
      const node1 = new WorkerNodeImpl();
      const node2 = new WorkerNodeImpl();
      expect(node1.__nodeId).not.toBe(node2.__nodeId);
    });

    it("registers in nodeMap", () => {
      const node = new WorkerNodeImpl();
      expect(nodeMap.has(node.__nodeId)).toBe(true);
    });

    it("initial childNodes is empty", () => {
      const node = new WorkerNodeImpl();
      expect(node.childNodes).toHaveLength(0);
    });

    it("initial parentNode is null", () => {
      const node = new WorkerNodeImpl();
      expect(node.parentNode).toBeNull();
    });

    it("textContent returns empty string for no children", () => {
      const node = new WorkerNodeImpl();
      expect(node.textContent).toBe("");
    });

    it("appendChild adds child and sets parentNode", async () => {
      const parent = new WorkerNodeImpl();
      const child = new WorkerNodeImpl();

      parent.appendChild(child);

      expect(parent.childNodes).toHaveLength(1);
      expect(child.parentNode).toBe(parent);

      await Promise.resolve(); // flush mutations
    });

    it("appendChild moves child from old parent", async () => {
      const parent1 = new WorkerNodeImpl();
      const parent2 = new WorkerNodeImpl();
      const child = new WorkerNodeImpl();

      parent1.appendChild(child);
      parent2.appendChild(child);

      expect(parent1.childNodes).toHaveLength(0);
      expect(parent2.childNodes).toHaveLength(1);
      expect(child.parentNode).toBe(parent2);

      await Promise.resolve();
    });

    it("insertBefore inserts child before ref", async () => {
      const parent = new WorkerNodeImpl();
      const child1 = new WorkerNodeImpl();
      const child2 = new WorkerNodeImpl();
      const child3 = new WorkerNodeImpl();

      parent.appendChild(child2);
      parent.insertBefore(child1, child2);

      const nodes = Array.from(parent.childNodes);
      expect(nodes[0]).toBe(child1);
      expect(nodes[1]).toBe(child2);
      expect(child1.parentNode).toBe(parent);

      // insertBefore when ref not found - appends
      parent.insertBefore(child3, new WorkerNodeImpl());
      expect(Array.from(parent.childNodes).pop()).toBe(child3);

      await Promise.resolve();
    });

    it("removeChild removes child and clears parentNode", async () => {
      const parent = new WorkerNodeImpl();
      const child = new WorkerNodeImpl();

      parent.appendChild(child);
      parent.removeChild(child);

      expect(parent.childNodes).toHaveLength(0);
      expect(child.parentNode).toBeNull();

      await Promise.resolve();
    });

    it("setting textContent removes children and records mutation", async () => {
      const postMessage = vi.fn();
      vi.stubGlobal("self", { postMessage });

      const parent = new WorkerNodeImpl();
      const child = new WorkerNodeImpl();
      parent.appendChild(child);

      parent.textContent = "new content";

      expect(parent.childNodes).toHaveLength(0);
      await Promise.resolve();
    });
  });

  describe("WorkerElementImpl", () => {
    it("creates with uppercase tagName", async () => {
      const el = new WorkerElementImpl("div");
      expect(el.tagName).toBe("DIV");
      await Promise.resolve();
    });

    it("creates with namespace", async () => {
      const el = new WorkerElementImpl("svg", "http://www.w3.org/2000/svg");
      expect(el.namespaceURI).toBe("http://www.w3.org/2000/svg");
      await Promise.resolve();
    });

    it("setAttribute records mutation", async () => {
      const postMessage = vi.fn();
      vi.stubGlobal("self", { postMessage });

      const el = new WorkerElementImpl("div");
      el.setAttribute("class", "foo");

      await Promise.resolve();

      const mutations = postMessage.mock.calls.flatMap((c) => c[0].mutations);
      const setAttrMutation = mutations.find((m: { type: number }) => m.type === MutationType.SET_ATTRIBUTE);
      expect(setAttrMutation).toBeDefined();
      expect(setAttrMutation.name).toBe("class");
      expect(setAttrMutation.value).toBe("foo");
    });

    it("removeAttribute records mutation", async () => {
      const postMessage = vi.fn();
      vi.stubGlobal("self", { postMessage });

      const el = new WorkerElementImpl("div");
      el.removeAttribute("class");

      await Promise.resolve();

      const mutations = postMessage.mock.calls.flatMap((c) => c[0].mutations);
      const removeAttrMutation = mutations.find((m: { type: number }) => m.type === MutationType.REMOVE_ATTRIBUTE);
      expect(removeAttrMutation).toBeDefined();
      expect(removeAttrMutation.name).toBe("class");
    });

    it("style proxy records SET_STYLE mutation", async () => {
      const postMessage = vi.fn();
      vi.stubGlobal("self", { postMessage });

      const el = new WorkerElementImpl("div");
      el.style.color = "red";

      await Promise.resolve();

      const mutations = postMessage.mock.calls.flatMap((c) => c[0].mutations);
      const styleMutation = mutations.find((m: { type: number }) => m.type === MutationType.SET_STYLE);
      expect(styleMutation).toBeDefined();
      expect(styleMutation.name).toBe("color");
      expect(styleMutation.value).toBe("red");
    });

    it("style proxy returns empty string for unset property", () => {
      const el = new WorkerElementImpl("div");
      expect(el.style.color).toBe("");
    });
  });

  describe("WorkerTextImpl", () => {
    it("creates with text data", () => {
      const text = new WorkerTextImpl("hello");
      expect(text.data).toBe("hello");
    });

    it("data setter records mutation", async () => {
      const postMessage = vi.fn();
      vi.stubGlobal("self", { postMessage });

      const text = new WorkerTextImpl("hello");
      text.data = "world";

      await Promise.resolve();

      const mutations = postMessage.mock.calls.flatMap((c) => c[0].mutations);
      const textMutation = mutations.find((m: { type: number }) => m.type === MutationType.SET_TEXT);
      expect(textMutation).toBeDefined();
      expect(textMutation.value).toBe("world");
    });

    it("nodeValue getter returns data", () => {
      const text = new WorkerTextImpl("test");
      expect(text.nodeValue).toBe("test");
    });

    it("nodeValue setter updates data", async () => {
      const text = new WorkerTextImpl("old");
      text.nodeValue = "new";
      expect(text.data).toBe("new");
      await Promise.resolve();
    });

    it("nodeValue setter with null uses empty string", async () => {
      const text = new WorkerTextImpl("old");
      text.nodeValue = null;
      expect(text.data).toBe("");
      await Promise.resolve();
    });

    it("textContent getter returns data", () => {
      const text = new WorkerTextImpl("content");
      expect(text.textContent).toBe("content");
    });

    it("textContent setter updates data", async () => {
      const text = new WorkerTextImpl("old");
      text.textContent = "new";
      expect(text.data).toBe("new");
      await Promise.resolve();
    });

    it("textContent setter with null uses empty string", async () => {
      const text = new WorkerTextImpl("old");
      text.textContent = null;
      expect(text.data).toBe("");
      await Promise.resolve();
    });
  });

  describe("WorkerDocumentImpl", () => {
    it("createElement creates a WorkerElementImpl", async () => {
      const postMessage = vi.fn();
      vi.stubGlobal("self", { postMessage });

      const doc = new WorkerDocumentImpl();
      const el = doc.createElement("span");

      expect(el instanceof WorkerElementImpl).toBe(true);
      expect(el.tagName).toBe("SPAN");

      await Promise.resolve();

      const mutations = postMessage.mock.calls.flatMap((c) => c[0].mutations);
      const createMutation = mutations.find((m: { type: number }) => m.type === MutationType.CREATE_ELEMENT);
      expect(createMutation).toBeDefined();
    });

    it("createElementNS creates a WorkerElementImpl with namespace", async () => {
      const postMessage = vi.fn();
      vi.stubGlobal("self", { postMessage });

      const doc = new WorkerDocumentImpl();
      const el = doc.createElementNS("http://www.w3.org/2000/svg", "circle");

      expect(el.namespaceURI).toBe("http://www.w3.org/2000/svg");

      await Promise.resolve();

      const mutations = postMessage.mock.calls.flatMap((c) => c[0].mutations);
      const createMutation = mutations.find((m: { type: number }) => m.type === MutationType.CREATE_ELEMENT_NS);
      expect(createMutation).toBeDefined();
    });

    it("createTextNode creates a WorkerTextImpl", async () => {
      const postMessage = vi.fn();
      vi.stubGlobal("self", { postMessage });

      const doc = new WorkerDocumentImpl();
      const text = doc.createTextNode("hello world");

      expect(text instanceof WorkerTextImpl).toBe(true);

      await Promise.resolve();

      const mutations = postMessage.mock.calls.flatMap((c) => c[0].mutations);
      const createMutation = mutations.find((m: { type: number }) => m.type === MutationType.CREATE_TEXT);
      expect(createMutation).toBeDefined();
      expect(createMutation.value).toBe("hello world");
    });
  });

  describe("createContainerNode", () => {
    it("creates a WorkerElementImpl registered as node 0", () => {
      const container = createContainerNode();
      expect(container instanceof WorkerElementImpl).toBe(true);
      expect(container.__nodeId).toBe(0);
      expect(nodeMap.get(0)).toBe(container);
    });
  });
});
