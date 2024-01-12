function snakeToCamel(snake: string): string {
  return snake.replaceAll(
    /([^-])-([^-])/g,
    (_, l: string, r: string) => `${l}${r.toUpperCase()}`,
  );
}

export type Element =
  | { type: "option"; name: string }
  | { type: "free"; value: string }
  | { type: "end-options" };

export type Result = { elements: Element[]; errors: string[] };

export function parse(argv: string[]): Result {
  let cleanArgv = argv
    .map((value) => value.trim())
    .filter((value) => value.length > 0);

  let errors: string[] = [];
  let optionsEnded = false;
  let elements: Element[] = cleanArgv.flatMap((arg): Element[] => {
    if (!optionsEnded) {
      if (arg === "--") {
        optionsEnded = true;
        return [{ type: "end-options" }];
      }

      if (arg.startsWith("--")) {
        let name = snakeToCamel(arg.slice(2));

        return [{ type: "option", name }];
      } else if (arg.startsWith("-") && arg !== "-") {
        let name = arg.slice(1);
        if (name.length > 1) {
          errors.push(
            `-${name}: short options must only use a single character`,
          );
          return [];
        }

        return [{ type: "option", name }];
      }
    }

    return [{ type: "free", value: arg }];
  });

  return { elements, errors };
}

////////////////////////////////////////////////////////////////////////////////

if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest;

  test("empty args", () => {
    expect(parse([])).toMatchSnapshot();
  });

  test("one positional arg", () => {
    expect(parse(["foo"])).toMatchSnapshot();
  });

  test("multiple positional args", () => {
    expect(parse(["foo", "bar", " baz "])).toMatchSnapshot();
  });

  test("empty strings are ignored", () => {
    expect(parse(["", "a", "   ", "b", "\n", "c"])).toMatchSnapshot();
  });

  test("one short option", () => {
    expect(parse(["-a"])).toMatchSnapshot();
  });

  test("multiple short options", () => {
    expect(parse(["-x", "-y", "-z"])).toMatchSnapshot();
  });

  test("short options must be a single character", () => {
    expect(parse(["-foo"])).toMatchSnapshot();
  });

  test("one long option", () => {
    expect(parse(["--foo"])).toMatchSnapshot();
  });

  test("multiple long options", () => {
    expect(parse(["--bread", "--eggs", "--ham"])).toMatchSnapshot();
  });

  test("mixed arguments and options", () => {
    expect(
      parse(["rice", "--sausage", "french", "-f", "ries"]),
    ).toMatchSnapshot();
  });

  test("snake-case becomes camelCase", () => {
    expect(
      parse([
        "--a-b",
        "--foo-bar",
        "--is-the-thing-on",
        "--a",
        "--a--b--c",
        "--a-",
        "---b",
      ]),
    ).toMatchSnapshot();
  });

  test("- is not interpreted as an option", () => {
    expect(parse(["-"])).toMatchSnapshot();
  });

  test("-- is interpreted as the end of options", () => {
    expect(parse(["--", "-a"])).toMatchSnapshot();
  });
}
