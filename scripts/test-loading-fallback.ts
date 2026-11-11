import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

async function run() {
  console.log('Testing Task 2: RouteLoadingFallback component...');

  const fallbackPath = path.resolve('src/components/RouteLoadingFallback.tsx');
  assert.ok(fs.existsSync(fallbackPath), 'src/components/RouteLoadingFallback.tsx must exist');

  const content = fs.readFileSync(fallbackPath, 'utf8');

  // Verify export
  assert.match(content, /export\s+(const|function)\s+RouteLoadingFallback/, 'Must export RouteLoadingFallback component');

  // Verify accessibility semantics
  assert.match(content, /role=["']status["']/, 'Must include role="status" for screen readers');
  assert.match(content, /aria-live=["']polite["']/, 'Must include aria-live="polite"');

  // Verify design system token integration
  assert.match(content, /--color-paper|--color-rule|--color-muted/, 'Must use design tokens from Hallmark system');

  console.log('Task 2 test passed!');
}

run().catch((err) => {
  console.error('Task 2 test failed as expected (RED):', err.message);
  process.exit(1);
});
