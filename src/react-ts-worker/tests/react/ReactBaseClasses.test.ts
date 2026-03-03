import { describe, it, expect, vi } from "vitest";
import { Component, PureComponent } from "../../react/ReactBaseClasses.js";

describe("Component", () => {
  it("sets props on construction", () => {
    const props = { name: "test" };
    const comp = new (Component as unknown as new (props: unknown) => { props: unknown })(props);
    expect(comp.props).toBe(props);
  });

  it("has isReactComponent marker", () => {
    expect(Component.prototype.isReactComponent).toBeDefined();
    expect(typeof Component.prototype.isReactComponent).toBe("object");
  });

  it("has setState method", () => {
    expect(typeof Component.prototype.setState).toBe("function");
  });

  it("has forceUpdate method", () => {
    expect(typeof Component.prototype.forceUpdate).toBe("function");
  });

  it("setState throws for non-object non-function partialState", () => {
    const updater = { enqueueSetState: vi.fn(), enqueueForceUpdate: vi.fn() };
    const comp = new (
      Component as unknown as new (
        props: unknown,
        context: unknown,
        updater: unknown,
      ) => { setState: (state: unknown) => void }
    )({}, {}, updater);
    expect(() => comp.setState(42)).toThrow();
    expect(() => comp.setState("invalid" as unknown as null)).toThrow();
  });

  it("setState does not throw for object partialState", () => {
    const updater = { enqueueSetState: vi.fn(), enqueueForceUpdate: vi.fn() };
    const comp = new (
      Component as unknown as new (
        props: unknown,
        context: unknown,
        updater: unknown,
      ) => { setState: (state: unknown, cb?: unknown) => void }
    )({}, {}, updater);
    expect(() => comp.setState({ count: 1 })).not.toThrow();
    expect(updater.enqueueSetState).toHaveBeenCalled();
  });

  it("setState does not throw for function partialState", () => {
    const updater = { enqueueSetState: vi.fn(), enqueueForceUpdate: vi.fn() };
    const comp = new (
      Component as unknown as new (
        props: unknown,
        context: unknown,
        updater: unknown,
      ) => { setState: (state: unknown) => void }
    )({}, {}, updater);
    expect(() => comp.setState(() => ({ count: 1 }))).not.toThrow();
  });

  it("setState with null does not throw", () => {
    const updater = { enqueueSetState: vi.fn(), enqueueForceUpdate: vi.fn() };
    const comp = new (
      Component as unknown as new (
        props: unknown,
        context: unknown,
        updater: unknown,
      ) => { setState: (state: unknown) => void }
    )({}, {}, updater);
    expect(() => comp.setState(null)).not.toThrow();
  });

  it("forceUpdate calls enqueueForceUpdate", () => {
    const updater = { enqueueSetState: vi.fn(), enqueueForceUpdate: vi.fn() };
    const comp = new (
      Component as unknown as new (
        props: unknown,
        context: unknown,
        updater: unknown,
      ) => { forceUpdate: (cb?: unknown) => void }
    )({}, {}, updater);
    const cb = vi.fn();
    comp.forceUpdate(cb);
    expect(updater.enqueueForceUpdate).toHaveBeenCalledWith(comp, cb, "forceUpdate");
  });

  it("sets refs to empty object on construction", () => {
    const comp = new (
      Component as unknown as new (
        props: unknown,
      ) => {
        refs: Record<string, unknown>;
      }
    )({});
    expect(comp.refs).toEqual({});
  });
});

describe("PureComponent", () => {
  it("has isPureReactComponent marker", () => {
    expect(PureComponent.prototype.isPureReactComponent).toBe(true);
  });

  it("inherits from Component prototype", () => {
    expect(typeof PureComponent.prototype.setState).toBe("function");
    expect(typeof PureComponent.prototype.forceUpdate).toBe("function");
  });

  it("sets props on construction", () => {
    const props = { value: 10 };
    const comp = new (PureComponent as unknown as new (props: unknown) => { props: unknown })(
      props,
    );
    expect(comp.props).toBe(props);
  });

  it("PureComponent instances are not the same as Component instances", () => {
    const c = new (Component as unknown as new () => object)();
    const p = new (PureComponent as unknown as new () => object)();
    expect(c instanceof PureComponent).toBe(false);
    // PureComponent extends Component prototype chain
    expect(p instanceof (Component as unknown as new () => object)).toBe(true);
  });
});
