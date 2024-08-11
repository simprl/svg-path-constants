#!/usr/bin/env node

const fs = require('fs');
const { generate } = require('./generate');
const path = require("path");

function ensureDirectoryExistence(filePath) {
    const dirname = path.dirname(filePath);
    if (fs.existsSync(dirname)) {
        return true;
    }
    fs.mkdirSync(dirname, { recursive: true });
    return true;
}

const generatedFiles = generate(process.argv);

generatedFiles.forEach(({ path: outputFilePath, content }) => {
    ensureDirectoryExistence(outputFilePath);
    fs.writeFileSync(outputFilePath, content, 'utf8');
    console.log(`Constants file successfully created: ${outputFilePath}`);
});
