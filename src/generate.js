const fs = require('fs');
const path = require('path');
const { optimize } = require('svgo');
const { createCommand } = require('commander');

// Your SVGO configuration here
const svgoConfig = {
    plugins: [
        {
            name: 'removeUselessDefs',
            active: true,
        },
        {
            name: 'convertShapeToPath',
            params: {
                convertArcs: true
            }
        },
        {
            name: 'mergePaths',
            params: {
                force: true
            }
        },
        {
            "name": "convertColors",
            "params": {
                "currentColor": false,
                "names2hex": true,
                "rgb2hex": true,
                "shorthex": true,
                "shortname": false,
            }
        }
    ]
};

// Function to get SVG files
function getSvgFiles(dir) {
    let results = [];
    const list = fs.readdirSync(dir);

    list.forEach(file => {
        file = path.resolve(dir, file);
        const stat = fs.statSync(file);

        if (stat && stat.isDirectory()) {
            results = results.concat(getSvgFiles(file));
        } else if (path.extname(file) === '.svg') {
            results.push(file);
        }
    });

    return results;
}

function toPascalCase(str) {
    return str.replace(/(^|[-_ ])+./g, (match) => match.charAt(match.length - 1).toUpperCase());
}
function toCamelCase(str) {
    return toPascalCase(str).replace(/^[A-Z]/, (match) => match.toLowerCase());
}

function formatWithTemplateAndRange(array, template, separator = '_') {
    if (!template) {
        return array.join(separator);
    }
    return template.replace(/{(-?\d+),(-?\d+)}/g, (match, start, end) => {
        const startIndex = parseInt(start, 10);
        const endIndex = parseInt(end, 10);
        const elements = array.slice(startIndex, endIndex === -1 ? undefined : endIndex + 1);
        return elements.join(separator);
    }).replace(/{(-?\d+)}/g, (match, index) => {
        let parsedIndex = parseInt(index, 10);
        if (parsedIndex < 0) parsedIndex = array.length + parsedIndex; // Преобразование отрицательного индекса
        return array[parsedIndex] !== undefined ? array[parsedIndex] : match;
    });
}

// Function to generate constant name
function generateConstantName(filePath, baseDir, template, format = 'camelCase') {
    const relativePath = path.relative(baseDir, filePath);
    const nameWithoutExt = relativePath.slice(0, -path.extname(relativePath).length);

    const formatted = formatWithTemplateAndRange(nameWithoutExt.split(path.sep), template);
    switch (format) {
        case 'camelCase':
            return toCamelCase(formatted);
        case 'PascalCase':
            return toPascalCase(formatted);
        case 'snake_case':
            return formatted.replace(/[-\s]+/g, '_').toLowerCase();
        case 'SCREAMING_SNAKE_CASE':
            return formatted.replace(/[-\s]+/g, '_').toUpperCase();
        default:
            return formatted;
    }
}

function generateFileName(filePath, baseDir, template) {
    const relativePath = path.relative(baseDir, filePath);
    const nameWithoutExt = relativePath.slice(0, -path.extname(relativePath).length);

    const formatted = formatWithTemplateAndRange(nameWithoutExt.split(path.sep), template, '/');
    return formatted;
}

// Function to process SVG files
function processSvgFile(file) {
    const data = fs.readFileSync(file, 'utf8');
    let resultPath = "---";
    const params = {
        path: file,
        ...svgoConfig,
        plugins: [
            ...svgoConfig.plugins,
            {
                name: 'extractPathD',
                type: 'full',
                fn: (ast) => {
                    const pathes = [];
                    const traverse = (node) => {
                        if (node.type === 'element' && !['path', 'g', 'svg', 'title'].includes(node.name)) {
                            console.log(`[ERROR] svg has other tag "${node.name}" ${file} `);
                        }
                        if (node.type === 'element' && node.name === 'path' && node.attributes.d && node.attributes.fill !== 'none') {
                            const { attributes } = node;
                            const d = attributes.d;
                            const commands = [];
                            if ('opacity' in attributes && attributes.opacity !== '1') {
                                commands.push(`o${attributes.opacity}`);
                            }
                            if ('fill-opacity' in attributes && attributes['fill-opacity'] !== '1') {
                                commands.push(`O${attributes['fill-opacity']}`);
                            }
                            if ('stroke' in attributes && typeof attributes.stroke === "string" && attributes.stroke[0] === '#') {
                                commands.push(`f${attributes.stroke.replace(/^#/, '')}`);
                            }
                            if ('fill' in attributes && typeof attributes.fill === "string" && attributes.fill[0] === '#') {
                                commands.push(`F${attributes.fill.replace(/^#/, '')}`);
                            }
                            pathes.push([...commands, d].join(' '))
                        }
                        if (node.children) {
                            node.children.forEach(traverse);
                        }
                    };
                    traverse(ast);
                    resultPath = pathes.length > 0 ? pathes.join(' ') : '[ERROR]: no_path';
                }
            }
        ]
    };
    const result = optimize(data, params);

    if (result.error) {
        throw new Error(result.error);
    }

    if (!result.data) {
        return 'no_path';
    }

    return resultPath;

}

// Main function
function generate(argv) {
    // CLI setup with Commander
    const program = createCommand();
    program
        .version('1.0.5')
        .description('CLI tool to generate constants from SVG files')
        .option('-i, --input <directory>', 'Input directory containing SVG files', 'src/assets/icons')
        .option('-o, --output <file>', 'Output file path or pattern', 'src/components/Icon/paths.js')
        .option('-q, --quote', 'Use single quotes in the output', false)
        .option('-t, --template <string>', 'Template string for naming convention', '')
        .option('-f, --format <format>', 'Naming format: camelCase, PascalCase, snake_case, or SCREAMING_SNAKE_CASE', 'camelCase')
        .parse(argv);

    const options = program.opts();

    const baseDir = path.resolve(process.cwd(), options.input);

    const singleQuote = options.quote;

    const svgFiles = getSvgFiles(baseDir);
    const quote = singleQuote ? "'" : '"';

    const outputs = new Map();
    svgFiles.forEach((file, index) => {
        try {
            const constantName = generateConstantName(file, baseDir, options.template, options.format);
            const outputFileName = generateFileName(file, baseDir, options.output);
            const outputFilePath = path.resolve(process.cwd(), outputFileName);
            let constants = outputs.get(outputFilePath);
            if(!constants) {
                constants = [];
                outputs.set(outputFilePath, constants);
            }

            const constantValue = processSvgFile(file);
            constants.push(`export const ${constantName} = ${quote}${constantValue}${quote};`);
        } catch (error) {
            console.error(`Error processing file ${file}:`, error);
        }

        if ((index + 1) % 100 === 0) {
            console.log(`Processed files: ${index + 1}/${svgFiles.length}`);
        }
    });
    return [...outputs.entries()].map(([path, constants]) => ({
        path,
        content: constants.join('\n')
    }));
}

module.exports = {
    generateConstantName,
    generate
}
