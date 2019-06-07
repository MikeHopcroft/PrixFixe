# Contributing

Everyone should start by reading [concepts.md](https://github.com/MikeHopcroft/PrixFixe/blob/master/documentation/concepts.md) for a conceptual overview of the project.

## Table of Contents
* [Git Configuration](#Git-Configuration)
* [Ignored Files](#Ignored-Files)
* [Styling](#Styling)
   * [Imports](#Imports)
   * [Line Length](#Line-Length)
   * [Naming](#)
* [VS Code Extensions](#VS-Code-Extensions)

## Git Configuration

Before pushing to the remote, developers should configure pushing tags as default.

To do this globally for any one machine, run:

`git config --global push.followTags true`

Or, to do this locally for a single project, `cd` into `PrixFixe/` and run:

`git config --local push.followTags true`

## Ignored Files

### .coveralls.yml

[Coveralls.io](https://coveralls.io/) can be linked to repos on any GitHub account. It will generate the code coverage badge found in README.md. Upon enabling the PrixFixe repo, you will be given a `repo_token`.

Create a file `./.coveralls.yml` and paste the `repo_token` in, following this structure:

```
repo_token: someRepoTokenHereYgRjsQWoaH`
```

## Style

### Imports
Import external packages first, and then any local files. Imports in the two groups should be organized alphabetically.

### Line Length
Each line of code or comments should be **<= 80 characters**. [Rewrap](#Extensions) will help with this.

### Naming

**Abbreviations**</br>Abbreviations should not be used in variable, type, or interface names unless they are common and readable. For example, `pid` is an acceptable name for `productID`, but `atr` is not an acceptable abbreviation for `attribute`.

**Interfaces**</br>On this project, we use the `I` prefix for interfaces that are like abstract base classes, but not interfaces that are POJO structs. For example, `Catalog` would implement `ICatalog`. TSLint only offers the choice of **all** interfaces start with `I` or **no** interfaces start with `I`. To locally disable this rule, use:

    // tslint:disable-next-line:interface-name

## VS Code Extensions

**Mocha Test Explorer** *Recommended*</br>Run your Mocha tests using a UI embedded in VS Code.

**Rewrap** *Highly Recommended*</br>Reformats code comments and other text to a given line length. In settings.json is the following:

    "rewrap.wrappingColumn": 80