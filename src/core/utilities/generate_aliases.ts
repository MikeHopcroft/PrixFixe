function cartesianProduct<T>(arr: T[][]): T[][] {
  return arr.reduce(
    (a, b) => {
      return a
        .map(x => {
          return b.map(y => {
            return x.concat(y);
          });
        })
        .reduce((c, d) => c.concat(d), []);
    },
    [[]] as T[][]
  );
}

export function* aliasesFromPattern(query: string) {
  if (!query || query.length === 0) {
    throw new Error('Tried to parse null or empty string');
  }

  let i = 0;
  const currentChar = () => query[i];

  function match(c: string) {
    const char = currentChar();
    if (c.includes(char)) {
      i++;
      return char;
    }
    else if (i >= query.length) {
      throw new Error(
        `Ran off the end of the string expecting to find: '${c}', i: ${i}`
      );
    } else {
      throw new Error(
        `Unexpected character: '${currentChar()}'. Expected '${c}'.`
      );
    }
  }

  //Intrinsics
  const whitespace = () => match(' ');
  const letter = () =>
    match(
      'ABCDEFGHIJKLMNOPQRSTUVWXYZ' +
      'abcdefghijklmnopqrstuvwxyz' +
      'ÁáÍíøOóÚúÜüÑñ' +
      ' '
    );
  const token = () => [kleenePlus(letter).join('')];
  const constant = (s: string) => {
    for (let i = 0; i < s.length; i++) match(s.charAt(i));
  };
  const separator = () => match('|,;');

  //Lists
  const listGap = () => {
    separator();
    kleene(whitespace);
  };
  const group = () => kleenePlus(phrase, listGap);

  //Branches
  function choice(): string[] {
    constant('(');
    const contents = group();
    constant(')');
    return ([] as string[]).concat(...contents);
  }

  function optional(): string[] {
    constant('[');
    const contents = group();
    constant(']');
    const result = ([] as string[]).concat(...contents);
    result.push('');
    return result;
  }

  const term = () => union(choice, optional, token);
  const phrase = () => cartesianProduct(kleenePlus(term)).map(a => a.join(''));
  const grammar = () => phrase();

  const results = grammar();
  if (i !== query.length) {
    throw new TypeError('Failed expanding alias at index ' + i);
  }

  yield* aliasesFromPatternHelper(results);

  function kleene<T>(match: () => T, separator?: () => void): T[] {
    const results: T[] = [];
    try {
      while (true) {
        results.concat(match());
        if (separator) separator();
      }
    } catch (e) {
      return results;
    }
  }

  function kleenePlus<T>(match: () => T, separator?: () => void): T[] {
    const results: T[] = [];
    results.push(match());
    try {
      while (true) {
        if (separator) separator();
        results.push(match());
      }
    } catch (e) {
      return results;
    }
  }

  function union<T>(...matches: Array<() => T>) {
    const backtrackPointer = i;
    const errors: string[] = [];
    for (const match of matches) {
      try {
        return match();
      } catch (e) {
        errors.push(e);
        i = backtrackPointer;
      }
    }
    throw new Error('Matched none of union:\n- ' + errors.join('\n- '));
  }
}

function combine(left: string, right: string) {
  if (left.length === 0) {
    return right;
  } else if (right.length === 0) {
    return left;
  } else {
    return left + ' ' + right;
  }
}

function* aliasesFromPatternHelper(
  options: string[]
): IterableIterator<string> {
  if (options.length > 0) {
    for (const option of options) {
      yield option.replace(/\s\s+/g, ' ').trim();
    }
  }
}

/**
 * Defaults to defaultMatcher is no function is specified.
 *
 * @returnType Returns the matching function specified by an expression of the form
 * `['exact' | 'prefix' | 'levenshtein' ':']`
 */
export function matcherFromExpression(
  alias: string,
  defaultMatcher: string
): string {
  const index = alias.indexOf(':');
  if (index !== -1) {
    return alias.slice(0, index).trim();
  }

  return defaultMatcher;
}

/**
 * @returnType the pattern portion of an expression of the form `['exact' | 'prefix'`
 * `| 'levenshtein' ':']`
 */
export function patternFromExpression(alias: string) {
  const index = alias.indexOf(':');
  if (index !== -1) {
    return alias.slice(index + 1);
  }
  return alias;
}
