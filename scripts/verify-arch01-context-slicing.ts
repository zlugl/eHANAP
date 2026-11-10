import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('================================================================');
console.log('   eHANAP ARCH-01a: Context Slicing (UI Feedback & Auth)        ');
console.log('================================================================\n');

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string, details?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`[PASS] ${testName}`);
  } else {
    console.error(`[FAIL] ${testName}: ${details || 'Assertion failed'}`);
    process.exitCode = 1;
  }
}

async function runVerification() {
  const rootDir = path.resolve(__dirname, '..');

  // -------------------------------------------------------------
  // Suite 1: UI Feedback Context (ToastContext)
  // -------------------------------------------------------------
  console.log('>>> [Suite 1] UI Feedback Context (ToastContext)');

  const toastContextPath = path.join(rootDir, 'src/context/ToastContext.tsx');
  assert(fs.existsSync(toastContextPath), 'src/context/ToastContext.tsx exists on disk');

  if (fs.existsSync(toastContextPath)) {
    const toastContent = fs.readFileSync(toastContextPath, 'utf-8');
    assert(toastContent.includes('export const ToastContext'), 'ToastContext is exported');
    assert(toastContent.includes('export const ToastProvider'), 'ToastProvider is exported');
    assert(toastContent.includes('export const useToast'), 'useToast hook is exported');
    assert(toastContent.includes('activeToast'), 'ToastContext manages activeToast state');
    assert(toastContent.includes('showToast'), 'ToastContext provides showToast action');
    assert(toastContent.includes('dismissToast'), 'ToastContext provides dismissToast action');

    // Dynamically test ToastContext exports
    const toastModule = await import('../src/context/ToastContext.js').catch(() =>
      import('../src/context/ToastContext.tsx')
    );
    assert(typeof toastModule.ToastProvider === 'function', 'ToastProvider is a React component');
    assert(typeof toastModule.useToast === 'function', 'useToast is a valid hook');
  }

  // Consumer verification: JobMatchToastContainer
  const toastContainerPath = path.join(rootDir, 'src/components/JobMatchToastContainer.tsx');
  assert(fs.existsSync(toastContainerPath), 'JobMatchToastContainer.tsx exists');
  const toastContainerContent = fs.readFileSync(toastContainerPath, 'utf-8');
  assert(
    toastContainerContent.includes("from '../context/ToastContext'") ||
    toastContainerContent.includes('from "../context/ToastContext"'),
    'JobMatchToastContainer imports from ToastContext instead of AppContext'
  );
  assert(
    toastContainerContent.includes('useToast()'),
    'JobMatchToastContainer consumes useToast() directly'
  );
  assert(
    !toastContainerContent.includes('useApp()'),
    'JobMatchToastContainer does not import or call useApp()'
  );

  console.log(`\n--- Verification Summary: ${passedTests}/${totalTests} tests passed ---`);
}

runVerification().catch(err => {
  console.error('Unexpected error running ARCH-01a verification:', err);
  process.exit(1);
});
