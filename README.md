# remark-bootstrap

This module provides a command to serve NearForm training decks written using Remark.

## Installation

`npm install @nearform/remark-bootstrap`

## Usage

### Basic

`nf-present deck.md > index.html`

### Options

- `--css=./path/to/custom.css`
- `--out=./path/to/index.html`
- `--watch` Watch for changes and regenerate the html file, `--out` is required for this.

**Complete Example**

`nf-present deck.md --css=deck.css --out=index.html --watch`

See https://github.com/nearform/remark-boilerplate for a full example.
