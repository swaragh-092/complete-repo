const js = require('@eslint/js');
const nodePlugin = require('eslint-plugin-node');

module.exports = [
    js.configs.recommended,
    {
        files: ['**/*.js'],
        languageOptions: {
            ecmaVersion: 2021,
            sourceType: 'commonjs',
            globals: {
                // Node.js core globals
                require: 'readonly',
                module: 'readonly',
                exports: 'readonly',
                __dirname: 'readonly',
                __filename: 'readonly',
                process: 'readonly',
                console: 'readonly',
                Buffer: 'readonly',

                // Timers
                setTimeout: 'readonly',
                setInterval: 'readonly',
                clearTimeout: 'readonly',
                clearInterval: 'readonly',
                setImmediate: 'readonly',
                clearImmediate: 'readonly',

                // Node.js 18+ globals (fetch API)
                fetch: 'readonly',
                URL: 'readonly',
                URLSearchParams: 'readonly',

                // Other Node.js globals
                global: 'readonly',
                queueMicrotask: 'readonly',
            },
        },
        plugins: {
            node: nodePlugin,
        },
        rules: {
            'no-console': 'warn',
            'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
        },
    },
    {
        ignores: ['node_modules/**', 'logs/**'],
    },
];
