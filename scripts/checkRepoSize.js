#!/usr/bin/env node
/**
 * Fail the build if git-tracked files exceed the repository size budget.
 * Only counts files git actually tracks, so node_modules / dist / coverage
 * (all gitignored) are correctly excluded.
 */
import { execSync } from 'node:child_process';
import { statSync } from 'node:fs';

const LIMIT_BYTES = 10 * 1024 * 1024; // 10 MB

function trackedFiles() {
  // Tracked files plus untracked-but-not-ignored files = exactly what a commit
  // would contain. This makes the budget check meaningful before the first commit.
  const output = execSync('git ls-files --cached --others --exclude-standard', {
    encoding: 'utf8',
  });
  return output.split('\n').filter((line) => line.trim().length > 0);
}

function main() {
  let total = 0;
  const largest = [];
  for (const file of trackedFiles()) {
    try {
      const { size } = statSync(file);
      total += size;
      largest.push({ file, size });
    } catch {
      // File may be deleted but still staged; ignore.
    }
  }

  largest.sort((a, b) => b.size - a.size);
  const mb = (total / (1024 * 1024)).toFixed(2);
  console.log(`Tracked files: ${largest.length}`);
  console.log(`Total tracked size: ${mb} MB (limit 10.00 MB)`);
  console.log('Largest tracked files:');
  for (const { file, size } of largest.slice(0, 5)) {
    console.log(`  ${(size / 1024).toFixed(1)} KB  ${file}`);
  }

  if (total > LIMIT_BYTES) {
    console.error(`\nERROR: repository exceeds 10 MB budget (${mb} MB).`);
    process.exit(1);
  }
  console.log('\nOK: repository is within the 10 MB budget.');
}

main();
