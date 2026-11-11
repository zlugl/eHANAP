import assert from 'node:assert/strict';

async function run() {
  console.log('Testing Task 1: exportElementToPdf...');

  // Test 1: Module exists and exports exportElementToPdf
  const pdfExportMod = await import('../src/utils/pdfExport.js').catch(async () => {
    return await import('../src/utils/pdfExport.ts');
  });

  assert.equal(typeof pdfExportMod.exportElementToPdf, 'function', 'exportElementToPdf must be exported as a function');

  // Test 2: Handles null element gracefully without unhandled rejection
  const nullResult = await pdfExportMod.exportElementToPdf(null as any, 'test.pdf');
  assert.equal(nullResult, false, 'exportElementToPdf should return false and fall back when element is null');

  console.log('Task 1 unit test passed!');
}

run().catch((err) => {
  console.error('Task 1 test failed as expected (RED):', err.message);
  process.exit(1);
});
