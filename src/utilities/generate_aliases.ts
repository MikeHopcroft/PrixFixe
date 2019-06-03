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
    prefix: string,
    options: string[][]
): IterableIterator<string> {
    if (options.length > 0) {
        for (const option of options[0]) {
            yield* aliasesFromPatternHelper(
                combine(prefix, option),
                options.slice(1)
            );
        }
    } else {
        yield prefix;
    }
}

export function* aliasesFromPattern(query: string) {
    const m = /(\[[^\]]*\])|(\([^\)]*\))|([^\[^\()]*)/g;

    // Remove leading, trailing, and consecutive spaces.
    const query2 = query.replace(/\s+/g, ' ').trim();

    // Throw on comma before ] and ).
    if (query2.search(/(,\])|(,\))/g) !== -1) {
        throw TypeError(
            `generateAliases: illegal trailing comma in "${query}".`
        );
    }

    const matches = query2.match(m);

    if (matches !== null) {
        const options = matches
            .map(match => {
                if (match.startsWith('[')) {
                    // Selects an option or leaves blank
                    return [...match.slice(1, -1).split(','), ''].map(x =>
                        x.trim()
                    );
                } else if (match.startsWith('(')) {
                    // Must select from one of the options
                    return match
                        .slice(1, -1)
                        .split(',')
                        .map(x => x.trim());
                } else {
                    return [match.trim()];
                }
            })
            .filter(match => match[0].length > 0);
        yield* aliasesFromPatternHelper('', options);
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
