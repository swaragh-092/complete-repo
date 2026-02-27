const fs = require('fs');
const path = require('path');

const DIRECTORIES_TO_SCAN = [
    path.join(__dirname, 'src', 'pages'),
    path.join(__dirname, 'src', 'components')
];

let filesModified = 0;

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    let modified = false;

    // Track if file uses notistack
    if (!content.includes('useSnackbar')) return;

    // 1. Replace imports
    // First, check if import from 'notistack' exists
    if (content.includes("from 'notistack'") || content.includes('from "notistack"')) {
        // Calculate relative path to src/hooks/useToast
        const parts = filePath.split(path.sep);
        const srcIndex = parts.indexOf('src');
        const depth = parts.length - srcIndex - 2; // -1 for filename, -1 because we are in src
        const relativePrefix = depth === 0 ? './' : '../'.repeat(depth);

        // Replace the import
        content = content.replace(
            /import\s+\{([^}]*)(useSnackbar)([^}]*)\}\s+from\s+['"]notistack['"];?/g,
            (match, before, hook, after) => {
                // if there are other imports from notistack, keep them (unlikely but safe)
                const others = [before, after].join('').trim().replace(/,\s*$/, '').replace(/^,\s*/, '');
                let newImport = `import { useToast } from '${relativePrefix}hooks/useToast';`;
                if (others.length > 0) {
                    newImport += `\nimport { ${others} } from 'notistack';`;
                }
                return newImport;
            }
        );
        modified = true;
    }

    // 2. Replace hook initialization
    if (content.match(/const\s+\{\s*enqueueSnackbar\s*\}\s*=\s*useSnackbar\(\);?/)) {
        content = content.replace(
            /const\s+\{\s*enqueueSnackbar\s*\}\s*=\s*useSnackbar\(\);?/g,
            "const { showSuccess, showError, showWarning, showInfo, enqueueSnackbar } = useToast();"
        );
        modified = true;
    }

    // 3. Simple successes: enqueueSnackbar('Literal string', { variant: 'success' })
    content = content.replace(
        /enqueueSnackbar\((['"`].*?['"`]),\s*\{\s*variant:\s*['"]success['"]\s*\}\)/g,
        "showSuccess($1)"
    );

    // 4. Simple warnings: enqueueSnackbar('Literal string', { variant: 'warning' })
    content = content.replace(
        /enqueueSnackbar\((['"`].*?['"`]),\s*\{\s*variant:\s*['"]warning['"]\s*\}\)/g,
        "showWarning($1)"
    );

    // 5. Simple info: enqueueSnackbar('Literal string', { variant: 'info' })
    content = content.replace(
        /enqueueSnackbar\((['"`].*?['"`]),\s*\{\s*variant:\s*['"]info['"]\s*\}\)/g,
        "showInfo($1)"
    );

    // 6. Generic errors where the message is just a string (not a template literal with error extraction)
    // This avoids tricky template literals like `Failed: ${error.message}`
    content = content.replace(
        /enqueueSnackbar\((['"][^$]*?['"]),\s*\{\s*variant:\s*['"]error['"]\s*\}\)/g,
        "showError($1)"
    );

    // 7. Extract the common complex error pattern safely
    // Match: enqueueSnackbar(`Prefix text: ${error.response?.data?.message || error.message}`, { variant: 'error' })
    // We will convert it to: showError(error, 'Prefix text')
    content = content.replace(
        /enqueueSnackbar\(\s*`([^$]+?):\s*\$\{([^}]+)\}`\s*,\s*\{\s*variant:\s*['"]error['"]\s*\}\s*\)/g,
        (match, prefixText, errorVar) => {
            // Clean prefix text
            const cleanPrefix = prefixText.trim();

            // Determine base error variable (error or err)
            let baseVar = 'error';
            if (errorVar.startsWith('err.')) baseVar = 'err';
            else if (errorVar.startsWith('e.')) baseVar = 'e';
            else if (/^[a-zA-Z0-9_]+$/.test(errorVar)) baseVar = errorVar; // If it's just `err`

            return `showError(${baseVar}, '${cleanPrefix}')`;
        }
    );

    // Also catch edge case where format is enqueueSnackbar(`Failed to update settings: ${msg}`, { variant: 'error' })
    // Covered above.

    if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        filesModified++;
        console.log(`✓ Updated: ${filePath}`);
    }
}

function scanDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            scanDir(fullPath);
        } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
            processFile(fullPath);
        }
    }
}

console.log('Starting refactor...');
DIRECTORIES_TO_SCAN.forEach(dir => {
    if (fs.existsSync(dir)) scanDir(dir);
});
console.log(`Refactor complete. Modified ${filesModified} files.`);
