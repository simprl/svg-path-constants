# SVG Path Constants

`svg-path-constants` is a CLI tool designed to generate constants from SVG files. This tool helps you create reusable constants for SVG paths, making it easier to manage and use SVG assets in your projects.

[![](https://img.shields.io/npm/v/svg-path-constants?style=flat)](https://www.npmjs.com/package/svg-path-constants)

## Features

- **Generate Constants from SVG Files**: Easily create constants for SVG paths.
- **Flexible Naming Conventions**: Supports `camelCase`, `PascalCase`, `snake_case`, and `SCREAMING_SNAKE_CASE` naming formats.
- **Customizable Output**: Specify custom templates for naming conventions and file output paths.
- **Single or Multiple Outputs**: Generate a single output file or multiple files based on your input structure.
- **Attribute Conversion**: Convert SVG attributes like `opacity`, `fill-opacity`, `stroke`, and `fill` into path strings.

## Installation

You can run `svg-path-constants` directly using `npx` without installing it globally:

```bash
npx svg-path-constants@latest
```

Alternatively, you can install it globally:

```bash
npm install -g svg-path-constants
```

Or as a dev dependency in your project:

```bash
npm install --save-dev svg-path-constants
```

## Usage with `npx`

You can use `svg-path-constants` directly via `npx` for quick, one-off commands:

### Basic Usage

Generate constants from SVG files in the default input directory and save them to a specified output file:

```bash
npx svg-path-constants@latest -i src/assets/icons -o src/components/Icon/paths.js
```

### Custom Naming Format

Specify a custom naming format using the `-f` option:

```bash
npx svg-path-constants@latest -i src/assets/icons -o src/components/Icon/paths.js -f PascalCase
```

### Using a Template

Apply a custom template for naming the constants:

```bash
npx svg-path-constants@latest -i src/assets/icons -o src/components/Icon/{-2,-1}/{0}.js -t "{1,-3}"
```

### Single Quotes in Output

Use single quotes in the generated constants:

```bash
npx svg-path-constants@latest -i src/assets/icons -o src/components/Icon/paths.js -q
```

## Attribute Conversion

`svg-path-constants` can convert certain SVG attributes into components of the path string. The supported attributes are:

- **`opacity`**: Converted to `o<value>`.
- **`fill-opacity`**: Converted to `O<value>`.
- **`stroke`**: If the `stroke` attribute is a color (e.g., `#ff0000`), it is converted to `f<hex>` where `<hex>` is the hex color code without the `#`.
- **`fill`**: If the `fill` attribute is a color (e.g., `#00ff00`), it is converted to `F<hex>` where `<hex>` is the hex color code without the `#`.

### Example

Here is an example of how these attributes are converted:

### 1. Original SVG

```xml
<svg>
    <path d="M10 10 H 90 V 90 H 10 Z" opacity="0.5" fill-opacity="0.8" stroke="#ff0000" fill="#00ff00"/>
</svg>
```

### 2. Converted to Path Constant

After running `svg-path-constants`, the path with attributes would be converted as follows:

```javascript
export const myIcon = "o0.5 O0.8 fff000 F00ff00 M10 10 H 90 V 90 H 10 Z";
```

- **`opacity="0.5"`** is converted to `o0.5`.
- **`fill-opacity="0.8"`** is converted to `O0.8`.
- **`stroke="#ff0000"`** is converted to `fff000`.
- **`fill="#00ff00"`** is converted to `F00ff00`.

This allows for a compact representation of the SVG paths with relevant style information embedded directly in the path string.

## Options

- **`-i, --input <directory>`**: Input directory containing SVG files. Default: `src/assets/icons`.
- **`-o, --output <file>`**: Output file path or pattern for generating multiple files. Default: `src/components/Icon/paths.js`.
- **`-q, --quote`**: Use single quotes in the output. Default: `false` (uses double quotes).
- **`-t, --template <string>`**: Template string for naming convention. Default: `''` (no template).
- **`-f, --format <format>`**: Naming format: `camelCase`, `PascalCase`, `snake_case`, or `SCREAMING_SNAKE_CASE`. Default: `camelCase`.

## Example

Here are some example commands with expected results:

### 1. Basic Usage

**Command:**

```bash
npx svg-path-constants@latest -i src/assets/icons -o src/components/Icon/paths.js
```

**Result:**

```javascript
// src/components/Icon/paths.js
export const folderIcon1 = "M10 10 H 90 V 90 H 10 Z"; // Example SVG path
export const folderIcon2 = "M20 20 H 80 V 80 H 20 Z"; // Example SVG path
```

### 2. Custom Naming Format (PascalCase)

**Command:**

```bash
npx svg-path-constants@latest -i src/assets/icons -o src/components/Icon/paths.js -f PascalCase
```

**Result:**

```javascript
// src/components/Icon/paths.js
export const FolderIcon1 = "M10 10 H 90 V 90 H 10 Z"; // Example SVG path
export const FolderIcon2 = "M20 20 H 80 V 80 H 20 Z"; // Example SVG path
```

### 3. Using a Template for File Output and Naming

**Command:**

```bash
npx svg-path-constants@latest -i src/assets/icons -o src/components/Icon/{-2,-1}/{0}.js -t "{1,-3}"
```

**Result:**

```javascript
// src/components/Icon/folder/icon1.js
export const folderIcon1 = "M10 10 H 90 V 90 H 10 Z"; // Example SVG path

// src/components/Icon/folder/icon2.js
export const folderIcon2 = "M20 20 H 80 V 80 H 20 Z"; // Example SVG path
```

### 4. Single Quotes in Output

**Command:**

```bash
npx svg-path-constants@latest -i src/assets/icons -o src/components/Icon/paths.js -q
```

**Result:**

```javascript
// src/components/Icon/paths.js
export const folderIcon1 = 'M10 10 H 90 V 90 H 10 Z'; // Example SVG path
export const folderIcon2 = 'M20 20 H 80 V 80 H 20 Z'; // Example SVG path
```

### 5. Using Attributes in Path Constants

**Command:**

```bash
npx svg-path-constants@latest -i src/assets/icons -o src/components/Icon/paths.js
```

**Result:**

```javascript
// src/components/Icon/paths.js
export const myIcon = "o0.5 O0.8 fff000 F00ff00 M10 10 H 90 V 90 H 10 Z"; // Converted with attributes
```

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details.

## Author

Created by simprl.

## Contributing

Contributions are welcome! Please submit issues or pull requests to the repository.
