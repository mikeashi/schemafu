# SchemaFu

[![Build Status](https://github.com/mikeashi/schemafu/actions/workflows/ci.yml/badge.svg)](https://github.com/mikeashi/schemafu/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/mikeashi/schemafu/branch/main/graph/badge.svg)](https://codecov.io/gh/mikeashi/schemafu)
[![npm version](https://img.shields.io/npm/v/schemafu.svg)](https://www.npmjs.com/package/schemafu)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A powerful CLI tool to bundle, validate, and convert JSON Schema to TypeScript interfaces.

## Features

- 📦 **Bundle** JSON Schemas with all their references into a single file
- ✅ **Validate** schemas against JSON Schema meta-schema
- 🔄 **Convert** schemas to TypeScript interfaces
- 🔁 **Process** with a single command: bundle, validate, and generate TypeScript
- 🛠️ **Configurable** options for each operation

## Installation

### Global Installation

```bash
npm install -g schemafu
```

### Project Installation

```bash
npm install --save-dev schemafu
```

## Usage

### CLI Commands

SchemaFu provides several commands for working with JSON Schemas:

#### Bundle a Schema

```bash
schemafu bundle path/to/schema.json -o output.json -p
```

Options:
- `-o, --output <path>`: Output file path (default: `./bundled-schema.json`)
- `-p, --pretty`: Pretty print the output JSON

#### Validate a Schema

```bash
schemafu validate path/to/schema.json -s
```

Options:
- `-s, --strict`: Use strict validation mode

#### Generate TypeScript Interfaces

```bash
schemafu generate path/to/schema.json -o types.d.ts -s -i 4 -b "// Custom banner"
```

Options:
- `-o, --output <path>`: Output TypeScript file path (default: replaces `.json` with `.d.ts`)
- `-s, --strict`: Use strict types
- `-i, --indent <spaces>`: Indentation spaces (default: 2)
- `-b, --banner <text>`: Custom banner comment

#### Process (Bundle, Validate, and Generate TypeScript)

```bash
schemafu process path/to/schema.json -o bundled.json -p -s
```

Options:
- All options from bundle, validate, and generate commands
- `--skip-validation`: Skip the validation step
- `--skip-generate`: Skip the TypeScript generation step

### Examples

#### Basic Usage

```bash
# Bundle a schema
schemafu bundle schemas/main.json -o dist/bundled.json -p

# Validate the bundled schema
schemafu validate dist/bundled.json

# Generate TypeScript interfaces
schemafu generate dist/bundled.json -o dist/types.d.ts
```

#### All-in-One Processing

```bash
# Process a schema: bundle, validate, and generate TypeScript
schemafu process schemas/main.json -o dist/bundled.json -p -s
```

## Integration with Build Tools

### npm Scripts

Add to your `package.json`:

```json
{
  "scripts": {
    "schema:process": "schemafu process src/schemas/main.json -o dist/schema.json -p && tsc"
  }
}
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.