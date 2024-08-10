#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { optimize } = require('svgo');
const { program } = require('commander');

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

// Function to generate constant name
function generateConstantName(filePath, baseDir) {
    const relativePath = path.relative(baseDir, filePath);
    const nameWithoutExt = relativePath.slice(0, -path.extname(relativePath).length);
    return nameWithoutExt.split(path.sep).join('_');
}

// Function to process SVG files
function processSvgFile(file) {
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
                    resultPath = pathes.length > 0 ? pathes.join(' ') : 'no_path';
                    if (pathes.length === 0) {
                        console.log("!!! no_path file", pathes);
                    }
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

// CLI setup with Commander
program
    .version('1.0.0')
    .description('CLI tool to generate constants from SVG files')
    .option('-i, --input <directory>', 'Input directory containing SVG files', 'src/assets/icons')
    .option('-o, --output <file>', 'Output file path', 'src/components/Icon/paths.js')
    .option('-q, --quote', 'Use single quotes in the output', false)
    .parse(process.argv);

const options = program.opts();

// Main function
function genInOneChank() {
    const baseDir = path.resolve(process.cwd(), options.input);
    const outputFilePath = path.resolve(process.cwd(), options.output);
    const singleQuote = options.quote;

    const svgFiles = getSvgFiles(baseDir);
    const quote = singleQuote ? "'" : '"';
    const constants = [];

    svgFiles.forEach((file, index) => {
        try {
            const constantName = generateConstantName(file, baseDir);
            const constantValue = processSvgFile(file);
            constants.push(`export const ${constantName} = ${quote}${constantValue}${quote};`);
        } catch (error) {
            console.error(`Error processing file ${file}:`, error);
        }

        if ((index + 1) % 100 === 0) {
            console.log(`Processed files: ${index + 1}/${svgFiles.length}`);
        }
    });

    fs.writeFileSync(outputFilePath, constants.join('\n'), 'utf8');
    console.log(`Constants file successfully created: ${outputFilePath}`);
}

genInOneChank();
