const { generate, generateConstantName } = require('../src/generate');
const mockFs = require('mock-fs');
const fs = require('fs');
const path = require('path');

describe('generate', () => {
    afterEach(() => {
        mockFs.restore();
    });

    test('should generate constants from SVG files with default settings', () => {
        mockFs({
            'src/assets/icons': {
                'icon1.svg': '<svg><path d="M10 10 H 90 V 90 H 10 Z" fill="#000"/></svg>',
                'icon2.svg': '<svg><path d="M20 20 H 80 V 80 H 20 Z" fill="#111"/></svg>',
            },
        });

        const argv = ['node', 'script.js', '-i', 'src/assets/icons', '-o', 'output/path.js'];
        const result = generate(argv);

        expect(result).toHaveLength(1);
        expect(result[0].path).toBe(path.resolve('output/path.js'));
        expect(result[0].content).toContain('export const icon1 = "F000 M10 10 H 90 V 90 H 10 Z";');
        expect(result[0].content).toContain('export const icon2 = "F111 M20 20 H 80 V 80 H 20 Z";');
    });

    test('should apply template for constant names', () => {
        mockFs({
            'src/assets/icons/folder': {
                'icon1.svg': '<svg><path d="M10 10 H 90 V 90 H 10 Z" fill="#000"/></svg>',
            },
        });

        const argv = ['node', 'script.js', '-i', 'src/assets/icons', '-o', 'output/path.js', '-t', '{0}-{1}'];
        const result = generate(argv);

        expect(result).toHaveLength(1);
        expect(result[0].path).toBe(path.resolve('output/path.js'));
        expect(result[0].content).toContain('export const folderIcon1 = "F000 M10 10 H 90 V 90 H 10 Z";');
    });

    test('should handle custom output file paths based on template', () => {
        mockFs({
            'src/assets/icons/folder': {
                'icon1.svg': '<svg><path d="M10 10 H 90 V 90 H 10 Z" fill="#000"/></svg>',
            },
        });

        const argv = ['node', 'script.js', '-i', 'src/assets/icons', '-o', 'output/{0}/{1}.js'];
        const result = generate(argv);

        expect(result).toHaveLength(1);
        expect(result[0].path).toBe(path.resolve('output/folder/icon1.js'));
        expect(result[0].content).toContain('export const folderIcon1 = "F000 M10 10 H 90 V 90 H 10 Z";');
    });

    test('should handle mui structure', () => {
        mockFs({
            'src/assets/icons/device/battery_alert/materialicons': {
                '24px.svg': '<svg><path d="M10 10 H 90 V 90 H 10 Z" fill="#000"/></svg>',
            },
            'src/assets/icons/device/battery_alert/materialiconsoutlined': {
                '24px.svg': '<svg><path d="M10 10 H 90 V 90 H 10 Z" fill="#000"/></svg>',
            },
            'src/assets/icons/device/battery_alert/materialiconsround': {
                '24px.svg': '<svg><path d="M10 10 H 90 V 90 H 10 Z" fill="#000"/></svg>',
                '20px.svg': '<svg><path d="M10 10 H 90 V 90 H 10 Z" fill="#000"/></svg>',
            },
            'src/assets/icons/device/battery_charging_20/materialicons/': {
                '24px.svg': '<svg><path d="M10 10 H 90 V 90 H 10 Z" fill="#000"/></svg>',
            },
        });

        const argv = ['node', 'script.js', '-i', 'src/assets/icons', '-o', 'output/{-2,-1}/{0}.js', '-t', '{1,-3}'];
        const result = generate(argv);

        expect(result).toHaveLength(4);
        expect(result[0].path).toBe(path.resolve('output/materialicons/24px/device.js'));
        expect(result[1].path).toBe(path.resolve('output/materialiconsoutlined/24px/device.js'));
        expect(result[2].path).toBe(path.resolve('output/materialiconsround/20px/device.js'));
        expect(result[3].path).toBe(path.resolve('output/materialiconsround/24px/device.js'));
        expect(result[0].content).toContain('export const batteryAlert = "F000 M10 10 H 90 V 90 H 10 Z";');
        expect(result[0].content).toContain('export const batteryCharging20 = "F000 M10 10 H 90 V 90 H 10 Z";');
        expect(result[1].content).toContain('export const batteryAlert = "F000 M10 10 H 90 V 90 H 10 Z";');
        expect(result[2].content).toContain('export const batteryAlert = "F000 M10 10 H 90 V 90 H 10 Z";');
        expect(result[3].content).toContain('export const batteryAlert = "F000 M10 10 H 90 V 90 H 10 Z";');
    });

    test('should generate file names with custom format', () => {
        mockFs({
            'src/assets/icons/folder': {
                'icon1.svg': '<svg><path d="M10 10 H 90 V 90 H 10 Z" fill="#000"/></svg>',
            },
        });

        const argv = ['node', 'script.js', '-i', 'src/assets/icons', '-o', 'output/{0}/{1}.js', '-f', 'default'];
        const result = generate(argv);

        expect(result).toHaveLength(1);
        expect(result[0].path).toBe(path.resolve('output/folder/icon1.js'));
        expect(result[0].content).toContain('export const folder_icon1 = "F000 M10 10 H 90 V 90 H 10 Z";');
    });

    test('should generate constant with [ERROR]: no_path if SVG processing fails', () => {
        mockFs({
            'src/assets/icons': {
                'icon1.svg': '<svg><path fill="#000"/></svg>', // Отсутствует атрибут 'd'
            },
        });

        const argv = ['node', 'script.js', '-i', 'src/assets/icons', '-o', 'output/path.js'];
        const result = generate(argv);

        expect(result).toHaveLength(1);
        expect(result[0].path).toBe(path.resolve('output/path.js'));
        expect(result[0].content).toContain('export const icon1 = "[ERROR]: no_path";');
    });
});

describe('generateConstantName', () => {
    const filePath = 'src/assets/icons/folder/icon1.svg';
    const baseDir = 'src/assets/icons';
    const template = '{0}-{1}';

    test('should generate CamelCase constant name', () => {
        const result = generateConstantName(filePath, baseDir, template, 'camelCase');
        expect(result).toBe('folderIcon1');
    });

    test('should generate PascalCase constant name', () => {
        const result = generateConstantName(filePath, baseDir, template, 'PascalCase');
        expect(result).toBe('FolderIcon1');
    });

    test('should generate snake_case constant name', () => {
        const result = generateConstantName(filePath, baseDir, template, 'snake_case');
        expect(result).toBe('folder_icon1');
    });

    test('should generate SCREAMING_SNAKE_CASE constant name', () => {
        const result = generateConstantName(filePath, baseDir, template, 'SCREAMING_SNAKE_CASE');
        expect(result).toBe('FOLDER_ICON1');
    });

    test('should handle default format as camelCase', () => {
        const result = generateConstantName(filePath, baseDir, template);
        expect(result).toBe('folderIcon1');
    });

    test('should apply template correctly', () => {
        const customTemplate = '{1}-{0}';
        const result = generateConstantName(filePath, baseDir, customTemplate, 'camelCase');
        expect(result).toBe('icon1Folder');
    });
});
