import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

console.log('🔧 ELITE CONSOLE REPLACER\n');

// Recursively find all .ts files
function findTsFiles(dir, fileList = []) {
    const files = readdirSync(dir);
    for (const file of files) {
        const filePath = join(dir, file);
        if (statSync(filePath).isDirectory()) {
            if (!file.startsWith('.') && file !== 'node_modules') {
                findTsFiles(filePath, fileList);
            }
        } else if (file.endsWith('.ts') && !file.includes('safe-logger')) {
            fileList.push(filePath);
        }
    }
    return fileList;
}

const files = findTsFiles('apps/main/src');

console.log(`Found ${files.length} files to process\n`);

let totalReplacements = 0;
const fileStats = [];

for (const file of files) {
    try {
        let content = readFileSync(file, 'utf-8');
        let replacements = 0;
        let needsImport = false;

        // Check if we have any console calls
        if (/console\.(log|warn|error)/.test(content)) {
            needsImport = true;

            // Replace console.log -> safeLog.log
            const logMatches = content.match(/console\.log/g);
            if (logMatches) {
                content = content.replace(/console\.log/g, 'safeLog.log');
                replacements += logMatches.length;
            }

            // Replace console.warn -> safeLog.warn
            const warnMatches = content.match(/console\.warn/g);
            if (warnMatches) {
                content = content.replace(/console\.warn/g, 'safeLog.warn');
                replacements += warnMatches.length;
            }

            // Replace console.error -> safeLog.error
            const errorMatches = content.match(/console\.error/g);
            if (errorMatches) {
                content = content.replace(/console\.error/g, 'safeLog.error');
                replacements += errorMatches.length;
            }
        }

        // Add import if needed and not already present
        if (needsImport && !content.includes('safe-logger')) {
            // Determine correct relative path
            const fileParts = file.split('\\');
            const srcIndex = fileParts.indexOf('src');
            const depth = fileParts.length - srcIndex - 2; //  -1 for file, -1 for src itself
            const relativePath = (depth > 0 ? '../'.repeat(depth) : './') + 'utils/safe-logger';

            // Find first import line
            const lines = content.split('\n');
            let insertIndex = 0;
            for (let i = 0; i < lines.length; i++) {
                if (lines[i].startsWith('import ')) {
                    insertIndex = i + 1;
                } else if (insertIndex > 0 && !lines[i].trim().startsWith('import')) {
                    break;
                }
            }

            // Insert import
            if (insertIndex > 0) {
                lines.splice(insertIndex, 0, `import { safeLog } from "${relativePath}";`);
                content = lines.join('\n');
            } else {
                // No imports yet, add at top
                content = `import { safeLog } from "${relativePath}";\n\n` + content;
            }
        }

        if (replacements > 0) {
            writeFileSync(file, content, 'utf-8');
            totalReplacements += replacements;
            const shortPath = file.replace(/^.*apps[\\\/]main[\\\/]src[\\\/]/, '');
            fileStats.push({ file: shortPath, replacements });
            console.log(`✓ ${shortPath}: ${replacements} replacements`);
        }
    } catch (error) {
        console.error(`✗ ${file}: ${error.message}`);
    }
}

console.log('\n' + '='.repeat(50));
console.log(`✅ COMPLETE: ${totalReplacements} console calls replaced across ${fileStats.length} files`);
console.log('='.repeat(50));

if (fileStats.length > 0) {
    console.log('\nTop 5 files:');
    fileStats
        .sort((a, b) => b.replacements - a.replacements)
        .slice(0, 5)
        .forEach(({ file, replacements }) => {
            console.log(`  ${file}: ${replacements}`);
        });
}
