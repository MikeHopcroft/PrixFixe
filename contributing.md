# Contributing

Welcome to `prix-fixe`. Please look at [concepts.md](documentation/concepts.md) for a conceptual overview of the project.

## Table of Contents
* [Before Starting](#Before-Starting)
* [Git Methodology](#Git-Methodology)
* [Building and Testing](#Building-And-Testing)
* [Code Style](#Code-Style)
   * [Imports](#Imports)
   * [Line Length](#Line-Length)
   * [Naming](#)
* [VS Code Extensions](#VS-Code-Extensions)

## Before Starting
We welcome contributions.
Before starting on your contribution, it's a good idea to discuss your idea and plans with the project maintainer (presently Mike Hopcroft).
This will increase the likelihood that your PR will be accepted with minimal rework.

## Git Methodology

We use rebasing to ensure a linear commit history. See [A Tidy Linear Git History](http://www.bitsnbites.eu/a-tidy-linear-git-history/) for more information. We will not accept PRs with merge commits.

As the `prix-fixe` matures we will likely move to the [GitFlow](https://www.atlassian.com/git/tutorials/comparing-workflows/gitflow-workflow) process for accepting outside contributions.

For now, please fork the repo and make your changes in a feature branch off of master and then submit a PR. 
Our naming convention for feature branches is `github_account_name/feature_name`.

Before submitting your PR, please ensure that `npm run test` runs clean after `npm install` and `npm run clean`.
Note that you can use `npm run fix` to correct many linting and formatting issues.

Please be sure to rebase onto the latest master commit before submitting your PR and after any rework. Our committers will review your changes, possibly ask for rework, and then eventually make the commit into master.

## Building and Testing
To build `prix-fixe` from sources, first clone the repo.
Then
~~~
% npm install
% npm run compile
~~~

We use [mocha](https://www.npmjs.com/package/mocha) and [chai](https://www.npmjs.com/package/chai) for testing. You can run the tests, along with building, linting and checking code style with
~~~
% npm run test
~~~

You can fix many linting and formatting issues with
~~~
% npm run fix
~~~


## Code Style

We use [GTS](https://www.npmjs.com/package/gts) for linting and enforcing style.
Invoking `npm run test` or `npm run check` will run the linter and `prettier`.
Note that you can run `npm run fix` to automatically fix most linting and style problems.
Here are a couple of notes:
* We prefer tabs over spaces
* Our indentation is currently 4 spaces. This may change to 2 in the future.
* Interfaces that represent abstract bases classes have names starting with an upper-case `I`, (e.g. `IFoo`).
Since there is no way to suppress the linter rule on interface names for abstract base classes while keeping it for plain-old-javascript-objects (POJOs), we suppress the linter rule on inline at the interface declaration in the source file. 

### Imports
Import statements should be at the top of the file.
They are organized into blocks in the following order:

* Public npm packages
* `prix-fixe` modules in other directories.
* Modules in the current directory.

Within a block, imports statements are arranged alphabetically by package name or director path.

Within an import, symbols are listed alphabetically.

### Line Length
Each line of code or comments should be **<= 80 characters**. [Rewrap](#Extensions) will help with this.

### Naming

* **Classes**</br>Class names are `PascalCase`.
* **Functions, Member Functions**<br>Names are `camelCase`.
Prefer `private` members whereever possible.
We tend to avoid arrow functions for top-level declarations
and member functions, but we do use arrow functions when a 
class member is intended to be used with `map`. Arrow functions are fine for anonymous lambda expressions.
* **Variables, Member Variables** Names are `camelCase`. Prefer `const` variables and a more immutable style whenever possible. Prefer `private` and `readonly` for member variables, whenever possible. Simple/trivial initializer expressions are appropriate for member variables. More complex initializations where execution
order is important should be done in the constructer.
* **Abbreviations**</br>Abbreviations should not be used in variable, type, or interface names unless they are common and readable. For example, `pid` is an acceptable name for `productID`, but `atr` is not an acceptable abbreviation for `attribute`.

* **Interfaces**</br>On this project, we use the `I` prefix for interfaces that are like abstract base classes, but not interfaces that are POJO structs. For example, `Catalog` would implement `ICatalog`. TSLint only offers the choice of **all** interfaces start with `I` or **no** interfaces start with `I`. To locally disable this rule, use:

~~~
tslint:disable-next-line:interface-name
interface IFoo {
}
~~~

TODO:
* Preference for immutable style. Avoid state machines.
* Keep public API surface to a minimum. Avoid unnecessary export.
* Don't make methods public to enable unit testing. Unit tests can access private methods using ['name'].
* Appropriate amount of code coverage and unit testing.
* Rules of thumb for unit tests.
* **TODO:** comments
* **DESIGN NOTE:** comments
* **WARNING:** comments
* Block comments
* JSDoc comments
* Source tree organization
* NPM package publishing
* Logging/tracing
* VSCode configuration and tips
* Mocha test explorer and test debugging
* Guidelines for use of YAML and AJV
* Guidelines for error handling/exceptions

## VS Code Extensions
TODO: add hyperlinks to extensions here
TODO: add automatic extension recommendations to VSCode

**Mocha Test Explorer** *Recommended*</br>Run your Mocha tests using a UI embedded in VS Code.

**Rewrap** *Highly Recommended*</br>Reformats code comments and other text to a given line length. In settings.json is the following:

    "rewrap.wrappingColumn": 80


-----
# OUT OF DATE INFORMATION BELOW

Over time we will clean up this section. Right now it mainly contains instructions for project maintainers who are publishing to npm and configuring CI.

## Git Configuration

**NOTE: THESE INSTRUCTIONS ARE ONLY FOR PEOPLE WHO PUBLISH THE NPM PACKAGE**

Before pushing to the remote, developers should configure pushing tags as default.

To do this globally for any one machine, run:

`git config --global push.followTags true`

Or, to do this locally for a single project, `cd` into `PrixFixe/` and run:

`git config --local push.followTags true`

## Ignored Files

**NOTE: THESE INSTRUCTIONS ARE ONLY FOR PEOPLE SETTING UP CODE COVERAGE TOOLING**

### .coveralls.yml

[Coveralls.io](https://coveralls.io/) can be linked to repos on any GitHub account. It will generate the code coverage badge found in README.md. Upon enabling the PrixFixe repo, you will be given a `repo_token`.

Create a file `./.coveralls.yml` and paste the `repo_token` in, following this structure:

```
repo_token: someRepoTokenHereYgRjsQWoaH`
```
