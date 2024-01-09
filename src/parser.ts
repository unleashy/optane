export type Element =
  | { type: "option"; name: string; isShort: boolean }
  | { type: "free"; value: string };

export type Result = { elements: Element[]; errors: string[] };

export function parse(argv: string[]): Result {
  let cleanArgv = argv
    .map((value) => value.trim())
    .filter((value) => value.length > 0);

  let errors: string[] = [];
  let elements: Element[] = cleanArgv.flatMap((arg): Element[] => {
    if (arg.startsWith("-")) {
      if (arg.startsWith("--")) {
        let name = arg.slice(2);

        return [{ type: "option", name, isShort: false }];
      } else {
        let name = arg.slice(1);
        if (name.length > 1) {
          errors.push(
            `invalid option "-${name}": short options must only use a single character`,
          );
          return [];
        }

        return [{ type: "option", name, isShort: true }];
      }
    } else {
      return [{ type: "free", value: arg }];
    }
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
}
