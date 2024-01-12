import dedent from "ts-dedent";
import type { Result, Spec } from "./types.ts";

/**
 * Renders a {@link Result} into nicely formatted help text.
 *
 * @param cliName - Name of your CLI
 * @param synopsis - Any text you want to include at the very top of the help
 * @param result - Result as supplied by a call to {@link optane}.
 * @returns Help text you can print
 * @see {@link printUsage}
 */
export function usage<S extends Spec>(
  cliName: string,
  synopsis: string,
  result: Result<S>,
): string {
  let usageTxt = `${cliName} [options] [arguments]`;

  let optionsRows = Object.entries(result.spec)
    .map(([name, handler]): [string[], string] => [
      [name, ...handler.alias()].toSorted((a, b) => a.length - b.length),
      handler.help() ?? name,
    ])
    .toSorted(([a], [b]) => String(a).localeCompare(String(b)))
    .map(([names, desc]): [string, string] => [
      names
        .map((name) => (name.length === 1 ? `-${name}` : `--${name}`))
        .join(" | "),
      desc,
    ]);

  let longestOptionLen = Math.max(...optionsRows.map(([name]) => name.length));
  longestOptionLen = 3 * Math.ceil(longestOptionLen / 3);
  let optionsTxt = optionsRows
    .map(([name, desc]) => [name.padEnd(longestOptionLen), desc].join(" "))
    .join("\n");

  return dedent`
    ${synopsis}
    
    Usage:
      ${usageTxt}
    
    Options:
      ${optionsTxt}
  `;
}

/**
 * Same as {@link usage}, but uses `console.log` to print the usage directly to
 * the screen as a side-effect. All parameters are forwarded as-is to `usage`.
 *
 * @see {@link usage}
 */
export function printUsage<S extends Spec>(
  ...args: Parameters<typeof usage<S>>
): void {
  console.log(usage(...args));
}

if (import.meta.vitest) {
  const { expect, test } = import.meta.vitest;
  const { optane, t } = await import("./index.ts");

  const sut = optane([], {
    foo: t.string.help("Crimbus nimbus"),
    xy: t.int.help("Some number"),
    aaaaa: t.bool.alias("a", "aa"),
  });

  test("usage has synopsis and options", () => {
    expect(usage("test", "Test CLI v1.0.0", sut)).toMatchSnapshot();
  });
}
