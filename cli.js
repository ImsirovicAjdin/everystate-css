#!/usr/bin/env node

/**
 * @everystate/css CLI (opt-in)
 *
 * Usage:
 *   npx everystate-css-self-test
 *   everystate-css-self-test
 *   everystate-css-self-test --self-test
 */

const args = process.argv.slice(2);
const wantsHelp = args.includes('-h') || args.includes('--help');
const wantsSelfTest =
  args.length === 0 ||
  args.includes('self-test') ||
  args.includes('--self-test') ||
  args.includes('test') ||
  args.includes('--test');

if (wantsHelp) {
  console.log(`@everystate/css self-test (opt-in)\n\nUsage:\n  everystate-css-self-test [--self-test]\n\nNotes:\n  - This command is opt-in and never runs automatically.\n  - It runs a zero-dependency self-test bundled with the package.\n\nFlags:\n  --self-test   Run the bundled self-test (default)\n  -h, --help    Show this help message\n`);
  process.exit(0);
}

if (!wantsSelfTest) {
  console.error('Unknown arguments. Run with --help for usage.');
  process.exit(1);
}

(async () => {
  try {
    console.log('@everystate/css: running opt-in self-test...');
    await import('./self-test.js');
  } catch (error) {
    console.error('Self-test failed to run.');
    console.error(error);
    process.exit(1);
  }
})();
