# homebrew-makensis

[![BSD 2-Clause License](https://flat.badgen.net/badge/license/BSD%202-Clause/blue)](https://opensource.org/licenses/BSD-2-Clause)
[![Latest Release](https://flat.badgen.net/github/release/NSIS-Dev/homebrew-makensis)](https://github.com/NSIS-Dev/homebrew-makensis/releases)
[![Build](https://flat.badgen.net/github/checks/NSIS-Dev/homebrew-makensis/master)](https://github.com/NSIS-Dev/homebrew-makensis/actions)

Homebrew tap for Nullsoft Scriptable Install System (NSIS)

**Note:** The Homebrew core repository already supports NSIS. This tap repository is meant to allow the installation of older versions and to build `makensis` with [options](#options)

## Prerequisites

Make sure that [Homebrew](https://brew.sh/) is installed with `brew` in your `PATH` environmental variable

## Installation

Tap this repository in order to be able to install its formulae

```sh
$ brew tap nsis-dev/makensis
```

## Usage

You can now install any version of `makensis` between 2.34 and the latest using the command `brew install makensis@<version>`

**Example:**

```sh
$ brew install makensis@3.03
$ brew install makensis@2.51
```

To switch between installed versions, use the  command `brew link makensis@<version>`

**Example:**

```sh
$ brew link makensis@2.51
```

**Note:** Some older formulas might no longer build on newer versions of Homebrew. If you're aware of fixes or workarounds, please submit a PR.

### Options

The support for NSIS build options was removed from the Homebrew core repository in [#31891](https://github.com/Homebrew/homebrew-core/pull/31891) as part of the effort to [remove options](https://github.com/Homebrew/homebrew-core/issues/31510) from all core formulae. You can continue to use them using this tap.

#### `--with-advanced-logging`

Enable [advanced logging](https://nsis.sourceforge.io/Special_Builds#Advanced_logging) of all installer actions

#### `--with-large-strings`

Build makensis so installers can handle [large strings](https://nsis.sourceforge.io/Special_Builds#Large_strings) (>1024 characters)

#### `--with-debug`

Build executables with debugging information.

**Note:** This is not meant for use in production!

## License

This work is licensed under the [BSD 2-Clause License](LICENSE)
