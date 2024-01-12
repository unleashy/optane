import { type Element } from "./parser.ts";

export const HandlerError = {
  unknown: "unknown problem",
  missingValue: "missing value for option",
  notInt: "expected an integer",
  notOneOf: "expected one of the valid values",
} as const;

export type HandlerResult<T> =
  | { ok: true; value: T; nextIndex: number }
  | { ok: false; error: string };
export type Handler<T, D extends T | undefined> = {
  exec(elements: Element[], i: number): HandlerResult<T>;

  default(): D;
  default(value: T): Handler<T, T>;

  alias(): string[];
  alias(...names: string[]): Handler<T, D>;
};

export type HandlerType<H> = H extends Handler<infer T, infer D>
  ? T | D
  : never;

export function createHandler<T>(
  exec: (elements: Element[], i: number) => HandlerResult<T>,
): Handler<T, undefined> {
  class Impl<D extends T | undefined> implements Handler<T, D> {
    readonly #default: D;
    readonly #aliases: string[] = [];

    constructor(default_: D, aliases: string[]) {
      this.#default = default_;
      this.#aliases = aliases;
    }

    exec(elements: Element[], i: number): HandlerResult<T> {
      return exec(elements, i);
    }

    default(): D;
    default(value: T): Handler<T, T>;
    default(value?: T): D | Handler<T, T> {
      if (value === undefined) {
        return this.#default;
      } else {
        return new Impl(value, this.#aliases);
      }
    }

    alias(): string[];
    alias(...names: string[]): Handler<T, D>;
    alias(...names: string[]): string[] | Handler<T, D> {
      if (names.length === 0) {
        return this.#aliases;
      } else {
        return new Impl(this.#default, [...this.#aliases, ...names]);
      }
    }
  }

  return new Impl(undefined, []);
}

export const string = createHandler((elements, i) => {
  let next = elements[i] as Element | undefined;
  if (next && next.type === "free") {
    return { ok: true, value: next.value, nextIndex: i + 1 };
  } else {
    return { ok: false, error: HandlerError.missingValue };
  }
});

export const bool = createHandler((_elements, i) => ({
  ok: true,
  value: true,
  nextIndex: i,
})).default(false);

export const int = createHandler((elements, i) => {
  let next = elements[i] as Element | undefined;
  if (next && next.type === "free") {
    if (/^\d+$/.test(next.value)) {
      return { ok: true, value: Number(next.value), nextIndex: i + 1 };
    } else {
      return { ok: false, error: HandlerError.notInt };
    }
  } else {
    return { ok: false, error: HandlerError.missingValue };
  }
});

export const oneOf = <K extends string>(...strings: [K, ...K[]]) =>
  createHandler((elements, i) => {
    let next = elements[i] as Element | undefined;
    if (next && next.type === "free") {
      if ((strings as string[]).includes(next.value)) {
        return { ok: true, value: next.value as K, nextIndex: i + 1 };
      } else {
        return { ok: false, error: HandlerError.notOneOf };
      }
    } else {
      return { ok: false, error: HandlerError.missingValue };
    }
  });

////////////////////////////////////////////////////////////////////////////////

if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("string handler", () => {
    it("uses the argument", () => {
      expect(string.exec([{ type: "free", value: "foo" }], 0)).toEqual({
        ok: true,
        value: "foo",
        nextIndex: 1,
      });
    });

    it("expects an argument", () => {
      expect(string.exec([], 0)).toEqual({
        ok: false,
        error: HandlerError.missingValue,
      });
      expect(string.exec([{ type: "option", name: "foo" }], 0)).toEqual({
        ok: false,
        error: HandlerError.missingValue,
      });
    });

    it("has default undefined", () => {
      expect(string.default()).toBe(undefined);
    });
  });

  describe("bool handler", () => {
    it("uses no arguments", () => {
      expect(bool.exec([], 0)).toEqual({
        ok: true,
        value: true,
        nextIndex: 0,
      });

      expect(bool.exec([{ type: "free", value: "foo" }], 0)).toEqual({
        ok: true,
        value: true,
        nextIndex: 0,
      });
    });

    it("has default false", () => {
      expect(bool.default()).toBe(false);
    });
  });

  describe("int handler", () => {
    it("uses the argument", () => {
      expect(int.exec([{ type: "free", value: "1234" }], 0)).toEqual({
        ok: true,
        value: 1234,
        nextIndex: 1,
      });
    });

    it("expects an argument", () => {
      expect(int.exec([], 0)).toEqual({
        ok: false,
        error: HandlerError.missingValue,
      });
      expect(int.exec([{ type: "option", name: "foo" }], 0)).toEqual({
        ok: false,
        error: HandlerError.missingValue,
      });
      expect(int.exec([{ type: "free", value: "not a number" }], 0)).toEqual({
        ok: false,
        error: HandlerError.notInt,
      });
    });

    it("has default undefined", () => {
      expect(int.default()).toBe(undefined);
    });
  });

  describe("oneOf handler", () => {
    it("uses the argument", () => {
      expect(
        oneOf("a", "b", "c").exec([{ type: "free", value: "a" }], 0),
      ).toEqual({
        ok: true,
        value: "a",
        nextIndex: 1,
      });
    });

    it("expects an argument", () => {
      let sut = oneOf("low", "high");

      expect(sut.exec([], 0)).toEqual({
        ok: false,
        error: HandlerError.missingValue,
      });
      expect(sut.exec([{ type: "option", name: "low" }], 0)).toEqual({
        ok: false,
        error: HandlerError.missingValue,
      });
      expect(sut.exec([{ type: "free", value: "?" }], 0)).toEqual({
        ok: false,
        error: HandlerError.notOneOf,
      });
      expect(sut.exec([{ type: "free", value: "medium" }], 0)).toEqual({
        ok: false,
        error: HandlerError.notOneOf,
      });
    });
  });
}
