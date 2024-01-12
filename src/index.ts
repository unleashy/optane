import assert from "node:assert/strict";
import { parse } from "./parser.ts";
import * as t from "./handlers.ts";
import type { Handler, HandlerType } from "./handlers.ts";

function flatMapObject<K extends string, V, L extends string, U>(
  obj: Record<K, V>,
  f: (k: K, v: V) => Array<[L, U]>,
): Record<L, U> {
  return Object.fromEntries(
    Object.entries(obj).flatMap(([k, v]) => f(k as K, v as V)),
  ) as Record<L, U>;
}

function mapValues<K extends string, V, U>(
  obj: Record<K, V>,
  f: (v: V) => U,
): Record<K, U> {
  return flatMapObject(obj, (k, v) => [[k, f(v)]]);
}

function formatOption(name: string): string {
  return name.length === 1 ? `-${name}` : `--${name}`;
}

export type Spec = Record<string, Handler<unknown, unknown>>;

export type Options<S extends Spec> = { help: boolean } & {
  [P in keyof S]: HandlerType<S[P]>;
};

export type Result<S extends Spec> = {
  /**
   * The parsed options, as defined in your specification. Also includes the
   * `help` boolean option.
   */
  options: Options<S>;

  /** Any remaining positional arguments. */
  args: string[];

  /** Type or parse errors produced during processing */
  errors: string[];
};

export type Optane<S extends Spec> = (argv: string[]) => Result<S>;

function compile<S extends Spec>(spec: S): Optane<S> {
  let specWithHelp = { help: t.bool.alias("h"), ...spec };
  let aliases = flatMapObject(specWithHelp, (canonicalName, handler) =>
    handler.alias().map((alias) => [alias, canonicalName]),
  );
  let getHandler = (name: string) => {
    if (name in specWithHelp) {
      return { canonicalName: name, handler: specWithHelp[name] };
    } else if (name in aliases) {
      let canonicalName = aliases[name];
      return { canonicalName, handler: specWithHelp[canonicalName] };
    } else {
      return { canonicalName: undefined, handler: undefined };
    }
  };

  let optionDefaults = mapValues(specWithHelp, (h) => h.default());

  return (argv) => {
    let options = { ...optionDefaults };
    let args = [];

    let realArgv = argv === process.argv ? argv.slice(2) : argv;
    let { elements, errors } = parse(realArgv);

    for (let i = 0; i < elements.length; ) {
      let element = elements[i++];
      switch (element.type) {
        case "option": {
          let { canonicalName, handler } = getHandler(element.name);
          if (canonicalName && handler) {
            let result = handler.exec(elements, i);
            if (result.ok) {
              options[canonicalName] = result.value;

              i = result.nextIndex;
            } else {
              let optionName = formatOption(element.name);
              if (canonicalName !== element.name) {
                optionName += ` (alias of ${formatOption(canonicalName)})`;
              }

              errors.push(`${optionName}: ${result.error}`);
            }
          } else {
            errors.push(`${formatOption(element.name)}: unknown option`);
          }

          break;
        }

        case "free": {
          args.push(element.value);
          break;
        }

        case "end-options": {
          // ignored!
          break;
        }

        default: {
          assert.fail(`Malformed element ${JSON.stringify(element)}`);
        }
      }
    }

    return { options: options as Options<S>, args, errors };
  };
}

export function optane<S extends Spec>(spec: S): Optane<S>;
export function optane<S extends Spec>(argv: string[], spec: S): Result<S>;
export function optane<S extends Spec>(
  argvOrSpec: string[] | S,
  spec?: S,
): Optane<S> | Result<S> {
  if (spec) {
    return compile(spec)(argvOrSpec as string[]);
  } else {
    return compile(argvOrSpec as S);
  }
}

export * as t from "./handlers.ts";

////////////////////////////////////////////////////////////////////////////////

if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest;

  test("empty spec", () => {
    expect(optane([], {})).toMatchSnapshot();
  });

  test("skips the first two argv if it is process.argv", () => {
    expect(optane(process.argv, {})).toMatchSnapshot();
  });

  test("positional arguments are forwarded", () => {
    expect(optane(["a", "b", "c"], {})).toMatchSnapshot();
  });

  test("help option is always present", () => {
    expect(optane(["--help"], {})).toMatchSnapshot();
    expect(optane(["-h"], {})).toMatchSnapshot();
  });

  test("curried", () => {
    const getOpts = optane({});

    expect(getOpts(["foo", "bar"])).toMatchSnapshot();
  });

  test("basic string option", () => {
    expect(optane(["--foo", "bar"], { foo: t.string })).toMatchSnapshot();
  });

  test("string option requires argument", () => {
    let sut = optane({ wrong: t.string });

    expect(sut(["--wrong"])).toMatchSnapshot();
    expect(sut(["--wrong", "--wrong"])).toMatchSnapshot();
  });

  test("undefined options are errors", () => {
    expect(optane(["--what", "--the", "-f"], {})).toMatchSnapshot();
  });

  test("boolean options", () => {
    expect(
      optane(["--is-cool", "--awesome"], {
        isCool: t.bool,
        awesome: t.bool,
        epic: t.bool,
      }),
    ).toMatchSnapshot();
  });

  test("string option with default", () => {
    expect(optane([], { food: t.string.default("bread") })).toMatchSnapshot();
  });

  test("mixed options and arguments", () => {
    expect(
      optane(["a", "--foo", "bar", "--baz", "--bux", "something", "else"], {
        foo: t.string,
        baz: t.bool,
        bux: t.string,
      }),
    ).toMatchSnapshot();
  });

  test("option with long alias", () => {
    expect(
      optane(["--other", "name"], { foo: t.string.alias("other") }),
    ).toMatchSnapshot();
  });

  test("option with short alias", () => {
    expect(
      optane(["-o", "name"], { foo: t.string.alias("o") }),
    ).toMatchSnapshot();
  });

  test("short canonical option is rendered properly for error", () => {
    expect(optane(["--foo"], { o: t.string.alias("foo") })).toMatchSnapshot();
  });

  test("int option", () => {
    const sut = optane({ port: t.int });

    expect(sut(["--port", "8080"])).toMatchSnapshot();
    expect(sut(["--port", "nope"])).toMatchSnapshot();
  });

  test("oneOf option", () => {
    const sut = optane({
      verbose: t.oneOf("low", "medium", "high"),
    });

    expect(sut(["--verbose", "low"])).toMatchSnapshot();
    expect(sut(["--verbose", "medium"])).toMatchSnapshot();
    expect(sut(["--verbose", "high"])).toMatchSnapshot();
    expect(sut(["--verbose", "what"])).toMatchSnapshot();
  });

  test("-- represents end of options", () => {
    const sut = optane({ foo: t.string });

    expect(sut(["--"])).toMatchSnapshot();
    expect(sut(["--", "--foo"])).toMatchSnapshot();
    expect(sut(["--foo", "--", "--foo"])).toMatchSnapshot();
  });
}
