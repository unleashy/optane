/**
 * Represents a single element in a command-line, before any handling has been
 * done. Is used by {@link Handler | Handlers} which assign semantic meaning to
 * those elements.
 */
export type Element =
  | { type: "option"; name: string }
  | { type: "free"; value: string }
  | { type: "end-options" };

/**
 * Returned by {@link Handler | Handlers}. If `ok` is true, the handler was
 * successful; otherwise, it was not.
 */
export type HandlerResult<T> =
  | {
      ok: true;

      /** Parsed value from handler */
      value: T;

      /** From where to continue parsing the elements array */
      nextIndex: number;
    }
  | {
      ok: false;

      /** Error message for failure */
      error: string;
    };

/**
 * Holds help information for {@link Handler | Handlers}.
 * @interface
 */
export type Help = {
  /** Usage text if any */
  text?: string;

  /** Argument name if any */
  argName?: string;
};

/**
 * Parses {@link Element | Elements} to give them a richer representation.
 * {@link Spec | Specs} associate Handlers with option names.
 *
 * @typeParam T - the type output on success
 * @typeParam D - the type of the default value; must extend from T or be
 *   `undefined`
 * @interface
 */
export type Handler<T, D extends T | undefined> = {
  /**
   * Parse an {@link Element} array starting at `i` as per the rules of this
   * handler.
   *
   * @param elements - The array of elements to use
   * @param i - The index to start parsing at. Usually is the index right after
   *   the option this handler is associated with in a {@link Spec}
   * @returns A successful {@link HandlerResult} with a
   *   parsed value of type `T` if possible. Otherwise, a failure with an error
   *   message.
   */
  exec(elements: Element[], i: number): HandlerResult<T>;

  /** Get the default value of this Handler. */
  default(): D;

  /**
   * Set the default value of this handler.
   *
   * @returns A new Handler with the default value.
   */
  default(value: T): Handler<T, T>;

  /** Get all aliases of this Handler. */
  alias(): string[];

  /**
   * Set new aliases for this Handler.
   *
   * @param names - One or more aliases to assign
   * @returns A new Handler with the defined aliases
   */
  alias(...names: string[]): Handler<T, D>;

  /** Get help info for this Handler. */
  help(): Help;

  /**
   * Set help text for this Handler.
   *
   * @param text - The help text
   * @returns A new Handler with the defined help text
   */
  help(text: string): Handler<T, D>;
};

/**
 * Determines the result type of a {@link Handler}, taking defaults into
 * account. Equals `never` if the type parameter is not a Handler.
 *
 * @typeParam H - a Handler
 */
export type HandlerType<H> = H extends Handler<infer T, infer D>
  ? T | D
  : never;

/**
 * Base type for an option specification: an object associating option names
 * to {@link Handler | Handlers}.
 */
export type Spec = Record<string, Handler<unknown, unknown>>;

/**
 * Represents the final parsed options object of a command line, including the
 * automatic `help` option. Is an object associating option names to values
 * returned by handlers (or their defaults) as per the associated {@link Spec}.
 *
 * @typeParam S - {@link Spec} this options object is associated with
 */
export type Options<S extends Spec> = { help: boolean } & {
  [P in keyof S]: HandlerType<S[P]>;
};

/**
 * Returned by {@link optane} after parsing the command line; holds parsed
 * options, arguments, and any error messages.
 * @interface
 */
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

  /** The original spec this result used; includes help option */
  spec: { help: Handler<boolean, boolean> } & S;
};

/**
 * Function taking command-line arguments as a `string[]` and returning an
 * optane {@link Result}. Returned by a curried call to {@link optane}.
 *
 * @typeParam S - {@link Spec} this Optane parser is associated with
 */
export type Optane<S extends Spec> = (argv: string[]) => Result<S>;
