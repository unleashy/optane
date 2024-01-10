# ☣️ optane

A command line parser.

## 🆘 Usage

In your CLI script, import and call `optane` with the `process.argv` and a
parameter specification:

```typescript
import { optane, t, printUsage } from "optane";

const cli = optane(process.argv, {
  foo: t.string(),
  verbose: t.bool().alias("v"),
  some: t.string(),
  i: t.int().repeats().help("Custom help text"),
  forgotten: t.enum("yes", "no").default("yes"),
});

if (cli.options.help) {
  printUsage("Awesome CLI v1.0.0", result);
} else {
  console.log("Options:\n", cli.options);
  console.log("\nArguments:\n", cli.args);
}
```

Output:

```shell
$ node .\cli.js --foo bar -v --some=thing -iii bread eggs ham
Options:
{ help: false, foo: "bar", verbose: true, some: "thing", i: 3 }

Arguments:
["bread", "eggs", "ham"]

$ node .\cli.js -h
Awesome CLI v1.0.0

Usage:
  .\cli.js [option] [arguments...]

Options:
  -h | --help              Show help
  --foo <string>           Foo
  --forgotten <yes | no>   Forgotten (default yes)
  -i                       Custom help text
  --some <string>          Some
  -v | --verbose           Verbose
```

## 💻 Development

1. Clone this repository
2. Enable Corepack with `corepack enable`
3. Install dependencies with `yarn install`
4. Test with `yarn test`
5. Code, commit, etc.

## ⚖️ Licence

[MIT.](LICENSE.txt)
