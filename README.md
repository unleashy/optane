# optane

A command line parser.

## Usage

In your CLI script, import and call `optane` with the `process.argv` and a
parameter specification:

```js
import { optane, t, print } from "optane";

const cli = optane(process.argv, {
  foo: t.string,
  verbose: t.bool.alias("v"),
  some: t.string,
  i: t.int.repeats().help("Custom help text"),
  forgotten: t.enum("yes", "no").default("yes"),
});

if (cli.isHelpWanted) {
  print("Awesome CLI v1.0.0", result);
}

console.log("Options:\n", cli.options);
console.log("\nArguments:\n", cli.args);
```

Output:

```shell
$ node .\cli.js --foo bar -v --some=thing -iii bread eggs ham
Options:
{ foo: "bar", verbose: true, some: "thing", i: 3 }

Arguments:
["bread", "eggs", "ham"]

$ node .\cli.js -h
Awesome CLI v1.0.0

Usage:
  .\cli.js [options] [arguments...]

Options:
  -h | --help              Show help
  --foo [string]           Foo
  --forgotten [yes | no]   Forgotten (default yes)
  -i                       Custom help text
  --some [string]          Some
  -v | --verbose           Verbose
```

## Licence

[MIT.](LICENSE.txt)
