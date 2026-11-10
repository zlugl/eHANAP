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

  // -------------------------------------------------------------
  // Suite 2: Notification Context (NotificationContext)
  // -------------------------------------------------------------
  console.log('\n>>> [Suite 2] Notification Context (NotificationContext)');

  const notifContextPath = path.join(rootDir, 'src/context/NotificationContext.tsx');
  assert(fs.existsSync(notifContextPath), 'src/context/NotificationContext.tsx exists on disk');

  if (fs.existsSync(notifContextPath)) {
    const notifContent = fs.readFileSync(notifContextPath, 'utf-8');
    assert(notifContent.includes('export const NotificationContext'), 'NotificationContext is exported');
    assert(notifContent.includes('export const NotificationProvider'), 'NotificationProvider is exported');
    assert(notifContent.includes('export const useNotification'), 'useNotification hook is exported');
    assert(notifContent.includes('notifications'), 'NotificationContext provides notifications list');
    assert(notifContent.includes('addNotification'), 'NotificationContext provides addNotification action');
    assert(notifContent.includes('markNotificationRead'), 'NotificationContext provides markNotificationRead action');
    assert(notifContent.includes('markAllNotificationsRead'), 'NotificationContext provides markAllNotificationsRead action');
    assert(notifContent.includes('deleteNotification'), 'NotificationContext provides deleteNotification action');
    assert(notifContent.includes('clearAllNotifications'), 'NotificationContext provides clearAllNotifications action');

    // Dynamically test NotificationContext exports
    const notifModule = await import('../src/context/NotificationContext.js').catch(() =>
      import('../src/context/NotificationContext.tsx')
    );
    assert(typeof notifModule.NotificationProvider === 'function', 'NotificationProvider is a React component');
    assert(typeof notifModule.useNotification === 'function', 'useNotification is a valid hook');
  }

  // Consumer verification: NotificationDrawer
  const notifDrawerPath = path.join(rootDir, 'src/components/NotificationDrawer.tsx');
  assert(fs.existsSync(notifDrawerPath), 'NotificationDrawer.tsx exists');
  const notifDrawerContent = fs.readFileSync(notifDrawerPath, 'utf-8');
  assert(
    notifDrawerContent.includes("from '../context/NotificationContext'") ||
    notifDrawerContent.includes('from "../context/NotificationContext"'),
    'NotificationDrawer imports from NotificationContext'
  );
  assert(
    notifDrawerContent.includes('useNotification()'),
    'NotificationDrawer consumes useNotification() directly'
  );

  // -------------------------------------------------------------
  // Suite 3: Auth & Session Context (AuthContext)
  // -------------------------------------------------------------
  console.log('\n>>> [Suite 3] Auth & Session Context (AuthContext)');

  const authContextPath = path.join(rootDir, 'src/context/AuthContext.tsx');
  assert(fs.existsSync(authContextPath), 'src/context/AuthContext.tsx exists on disk');

  if (fs.existsSync(authContextPath)) {
    const authContent = fs.readFileSync(authContextPath, 'utf-8');
    assert(authContent.includes('export const AuthContext'), 'AuthContext is exported');
    assert(authContent.includes('export const AuthProvider'), 'AuthProvider is exported');
    assert(authContent.includes('export const useAuth'), 'useAuth hook is exported');
    assert(authContent.includes('currentUser'), 'AuthContext provides currentUser state');
    assert(authContent.includes('currentRole'), 'AuthContext provides currentRole state');
    assert(authContent.includes('switchDemoRole'), 'AuthContext provides switchDemoRole action');
    assert(authContent.includes('loginAs'), 'AuthContext provides loginAs action');
    assert(authContent.includes('continueWithGoogle'), 'AuthContext provides continueWithGoogle action');
    assert(authContent.includes('logout'), 'AuthContext provides logout action');
    assert(authContent.includes('registerUser'), 'AuthContext provides registerUser action');
    assert(authContent.includes('sendOtp'), 'AuthContext provides sendOtp action');
    assert(authContent.includes('verifyOtp'), 'AuthContext provides verifyOtp action');
    assert(authContent.includes('recoverPassword'), 'AuthContext provides recoverPassword action');

    // Dynamically test AuthContext exports
    const authModule = await import('../src/context/AuthContext.js').catch(() =>
      import('../src/context/AuthContext.tsx')
    );
    assert(typeof authModule.AuthProvider === 'function', 'AuthProvider is a React component');
    assert(typeof authModule.useAuth === 'function', 'useAuth is a valid hook');
  }

  // Consumer verification: AuthModal
  const authModalPath = path.join(rootDir, 'src/views/AuthModal.tsx');
  assert(fs.existsSync(authModalPath), 'AuthModal.tsx exists');
  const authModalContent = fs.readFileSync(authModalPath, 'utf-8');
  assert(
    authModalContent.includes("from '../context/AuthContext'") ||
    authModalContent.includes('from "../context/AuthContext"'),
    'AuthModal imports from AuthContext'
  );
  assert(
    authModalContent.includes('useAuth()'),
    'AuthModal consumes useAuth() directly'
  );
  assert(
    !authModalContent.includes('useApp()'),
    'AuthModal does not import or call useApp()'
  );

  console.log(`\n--- Verification Summary: ${passedTests}/${totalTests} tests passed ---`);
}

runVerification().catch(err => {
  console.error('Unexpected error running ARCH-01a verification:', err);
  process.exit(1);
});
