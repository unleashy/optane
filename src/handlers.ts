import { type Element } from "./parser.ts";

export const HandlerError = {
  unknown: "unknown problem",
  missingValue: "missing value for option",
} as const;
export type HandlerError = (typeof HandlerError)[keyof typeof HandlerError];

export type HandlerResult<T> =
  | { ok: true; value: T; nextIndex: number }
  | { ok: false; error: HandlerError };
export type Handler<T> = {
  exec(elements: Element[], i: number): HandlerResult<T>;

  default(): T | undefined;
  default(value: T): Handler<T>;

  alias(): string[];
  alias(...names: string[]): Handler<T>;
};

export type HandlerType<H> = H extends Handler<infer T> ? T : never;

export function createHandler<T>(
  exec: (elements: Element[], i: number) => HandlerResult<T>,
): () => Handler<T> {
  return () => {
    let defaultValue: T | undefined;
    let aliases: string[] = [];

    let handler = {
      exec,
      default: (value?: T) => {
        if (value === undefined) {
          return defaultValue;
        } else {
          defaultValue = value;
          return handler;
        }
      },
      alias: (...names: string[]) => {
        if (names.length === 0) {
          return aliases;
        } else {
          aliases.push(...names);
          return handler;
        }
      },
    } as Handler<T>;

    return handler;
  };
}

export const string = createHandler((elements, i) => {
  let next = elements[i] as Element | undefined;
  if (next && next.type === "free") {
    return { ok: true, value: next.value, nextIndex: i + 1 };
  } else {
    return { ok: false, error: HandlerError.missingValue };
  }
});

export const bool = () =>
  createHandler((_elements, i) => ({
    ok: true,
    value: true,
    nextIndex: i,
  }))().default(false);

if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("string handler", () => {
    it("uses the argument", () => {
      expect(string().exec([{ type: "free", value: "foo" }], 0)).toEqual({
        ok: true,
        value: "foo",
        nextIndex: 1,
      });
    });

    it("expects an argument", () => {
      expect(string().exec([], 0)).toEqual({
        ok: false,
        error: HandlerError.missingValue,
      });
      expect(string().exec([{ type: "option", name: "foo" }], 0)).toEqual({
        ok: false,
        error: HandlerError.missingValue,
      });
    });

    it("has default undefined", () => {
      expect(string().default()).toBe(undefined);
    });
  });

  describe("bool handler", () => {
    it("uses no arguments", () => {
      expect(bool().exec([], 0)).toEqual({
        ok: true,
        value: true,
        nextIndex: 0,
      });

      expect(bool().exec([{ type: "free", value: "foo" }], 0)).toEqual({
        ok: true,
        value: true,
        nextIndex: 0,
      });
    });

    it("has default false", () => {
      expect(bool().default()).toBe(false);
    });
  });
}
