import fs from 'fs';
import path from 'path';
import React from 'react';
import { fileURLToPath } from 'url';
import { AppProvider, useApp, useAuth, useDirectory, useNotification } from '../src/context';
import type { AuthContextType } from '../src/context/AuthContext';
import { resetPasswordWithSupabase, updatePasswordWithSupabase } from '../src/services/supabaseService';
import { storageAdapter } from '../src/lib/storageAdapter';
import {
  getFilteredUserNotifications,
  isNotificationRecipient,
} from '../src/utils/notificationUtils';
import { NotificationItem, User } from '../src/types';
import { mountWithProvider } from './testContextHarness';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

let passed = 0;
let total = 0;

function assert(condition: boolean, label: string, detail?: string) {
  total++;
  if (condition) {
    passed++;
    console.log(`[PASS] ${label}`);
  } else {
    console.error(`[FAIL] ${label}${detail ? `: ${detail}` : ''}`);
    process.exitCode = 1;
  }
}

function useCombined() {
  return {
    app: useApp(),
    auth: useAuth(),
    dir: useDirectory(),
    notif: useNotification(),
  };
}

const StrictAppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) =>
  React.createElement(React.StrictMode, null, React.createElement(AppProvider, null, children));

async function run() {
  console.log('--- eHANAP WP-09: Auth Recovery, Employer Profile Fallback & Admin Alerts ---');

  // 1. Static checks for pure state updaters and Supabase password recovery wiring
  const dirSrc = fs.readFileSync(path.join(rootDir, 'src/context/DirectoryContext.tsx'), 'utf-8');
  const empProfileSrc = fs.readFileSync(path.join(rootDir, 'src/views/employer/EmployerProfilePage.tsx'), 'utf-8');
  const notifContextSrc = fs.readFileSync(path.join(rootDir, 'src/context/NotificationContext.tsx'), 'utf-8');
  const authContextSrc = fs.readFileSync(path.join(rootDir, 'src/context/AuthContext.tsx'), 'utf-8');
  const supabaseServiceSrc = fs.readFileSync(path.join(rootDir, 'src/services/supabaseService.ts'), 'utf-8');
  const authModalSrc = fs.readFileSync(path.join(rootDir, 'src/views/AuthModal.tsx'), 'utf-8');

  const setEmpUpdater = dirSrc.match(/setEmployers\(prev =>[\s\S]*?\);/)?.[0] || '';
  const setUsersUpdater = dirSrc.match(/setUsers\(prev =>[\s\S]*?\);/)?.[0] || '';
  assert(
    Boolean(setEmpUpdater) && !setEmpUpdater.includes('saveDocument'),
    'DirectoryContext.setEmployers updater performs zero saveDocument side effects'
  );
  assert(
    Boolean(setUsersUpdater) && !setUsersUpdater.includes('saveDocument'),
    'DirectoryContext.setUsers updater performs zero saveDocument side effects'
  );

  const setDocsMatches = empProfileSrc.match(/setUploadedDocs\([\s\S]*?\);/g) || [];
  assert(
    setDocsMatches.length > 0 && setDocsMatches.every((block) => !block.includes('updateEmployerProfile')),
    'EmployerProfilePage.setUploadedDocs updates contain zero updateEmployerProfile side effects'
  );

  const setNotifUpdaters = notifContextSrc.match(/setNotifications\(\(prev\) =>[\s\S]*?\);/g) || [];
  assert(
    setNotifUpdaters.length > 0 &&
      setNotifUpdaters.every((block) => !block.includes('updateRecord') && !block.includes('deleteRecord')),
    'NotificationContext.setNotifications updaters contain zero Supabase write side effects'
  );
  assert(
    notifContextSrc.includes('isNotificationRecipient('),
    'NotificationContext reuses shared isNotificationRecipient helper'
  );

  assert(
    supabaseServiceSrc.includes('resetPasswordForEmail') &&
      supabaseServiceSrc.includes('updateUser({ password: newPassword })') &&
      supabaseServiceSrc.includes("type: 'recovery'"),
    'supabaseService implements real Supabase Auth resetPasswordForEmail, verifyOtp recovery, and updateUser'
  );
  assert(
    authContextSrc.includes("event === 'PASSWORD_RECOVERY'") &&
      authContextSrc.includes('resetPasswordWithSupabase') &&
      authContextSrc.includes('updatePasswordWithSupabase'),
    'AuthContext wires PASSWORD_RECOVERY session handling and Supabase password reset/update'
  );
  const recoverBlock = authContextSrc.match(/const recoverPassword = useCallback\([\s\S]*?\[users, verifyOtp/)?.[0] || '';
  assert(
    !recoverBlock.includes('saveRecord(SUPABASE_TABLES.USERS'),
    'AuthContext.recoverPassword no longer writes stripped password fields to public.users'
  );
  assert(
    authModalSrc.includes('!isSupabaseConfigured() && generatedOtpCode') &&
      authModalSrc.includes('isPasswordRecovery'),
    'AuthModal hides local OTP preview when Supabase is configured and handles PASSWORD_RECOVERY'
  );

  // 2. Notification recipient matching & admin alert routing unit checks
  const adminUser: User = {
    id: 'user-peso-admin-clean-1',
    email: 'peso.admin@roxas.gov.ph',
    role: 'admin',
    name: 'PESO Officer',
    isAccountVerified: true,
    isProfileCompleted: true,
    createdAt: '2026-11-26T00:00:00.000Z',
  };
  const empUser: User = {
    id: 'user-emp-clean-1',
    email: 'hr@roxastrading.ph',
    role: 'employer',
    name: 'ROXAS TRADING',
    isAccountVerified: true,
    isProfileCompleted: false,
    createdAt: '2026-11-26T00:00:00.000Z',
  };
  const seekerUser: User = {
    id: 'user-seeker-clean-1',
    email: 'juan@roxas.ph',
    role: 'job_seeker',
    name: 'JUAN DELA CRUZ',
    isAccountVerified: true,
    isProfileCompleted: true,
    createdAt: '2026-11-26T00:00:00.000Z',
  };

  const adminAlert: NotificationItem = {
    id: 'notif-admin-verify-1',
    recipientId: 'admin',
    recipientRole: 'admin',
    title: 'New Employer Verification Pending: ROXAS TRADING',
    message: 'Uploaded 2 verification documents.',
    type: 'action',
    read: false,
    createdAt: '2026-11-26T00:00:00.000Z',
    link: 'admin-verifications',
  };
  const wrongEmpNotif: NotificationItem = {
    id: 'notif-emp-wrong',
    recipientId: 'emp-other-id',
    recipientRole: 'employer',
    title: 'Employer Notice',
    message: 'Another employer notice.',
    type: 'info',
    read: false,
    createdAt: '2026-11-26T00:00:00.000Z',
  };
  const empDirectNotif: NotificationItem = {
    id: 'notif-emp-direct',
    recipientId: empUser.id,
    recipientRole: 'employer',
    title: 'Submitted for Verification',
    message: 'Pending PESO review.',
    type: 'info',
    read: false,
    createdAt: '2026-11-26T00:00:00.000Z',
  };

  assert(
    isNotificationRecipient(adminAlert, adminUser),
    'isNotificationRecipient matches recipientId="admin" + recipientRole="admin" for clean-slate admin'
  );
  assert(
    !isNotificationRecipient(adminAlert, empUser) && !isNotificationRecipient(adminAlert, seekerUser),
    'isNotificationRecipient blocks admin alerts from employers and job seekers'
  );
  assert(
    getFilteredUserNotifications([adminAlert, empDirectNotif], adminUser).some((n) => n.id === adminAlert.id),
    'getFilteredUserNotifications delivers admin verification alerts to clean-slate admin user'
  );
  assert(
    !getFilteredUserNotifications([wrongEmpNotif, empDirectNotif], empUser).some((n) => n.id === wrongEmpNotif.id) &&
      getFilteredUserNotifications([wrongEmpNotif, empDirectNotif], empUser).some((n) => n.id === empDirectNotif.id),
    'getFilteredUserNotifications preserves strict recipient isolation for non-admin users'
  );

  // 3. Runtime React StrictMode checks for fallback EmployerProfile, pure updates, auth recovery, and admin notification actions
  const mounted = await mountWithProvider(StrictAppProvider, useCombined);
  try {
    await mounted.act(async () => {
      mounted.getApi().auth.setUsers([adminUser, empUser, seekerUser]);
      mounted.getApi().dir.setEmployers([]);
      mounted.getApi().auth.setCurrentUser(empUser);
    });

    const fallbackProfile = mounted.getApi().dir.currentEmployerProfile;
    assert(
      fallbackProfile !== null &&
        fallbackProfile.userId === empUser.id &&
        fallbackProfile.status === 'incomplete' &&
        fallbackProfile.isProfileCompleted === false,
      'DirectoryContext synthesizes non-null fallback EmployerProfile when employers store is empty'
    );

    await mounted.act(async () => {
      storageAdapter.setEmployerCompletedInStorage(empUser.id, true);
      mounted.getApi().auth.setCurrentUser({ ...empUser });
    });
    assert(
      mounted.getApi().dir.currentEmployerProfile?.isProfileCompleted === true,
      'Fallback EmployerProfile reflects completed storage state'
    );

    await mounted.act(async () => {
      storageAdapter.removeEmployerCompletedFromStorage(empUser.id);
      mounted.getApi().dir.updateEmployerProfile({
        companyName: 'Roxas Trading Co.',
        representativeName: 'Maria Santos',
        contactNumber: '09171234567',
        municipality: 'Roxas',
        address: 'Poblacion, Roxas',
        industry: 'Retail',
        companyDescription: 'Local enterprise',
        isProfileCompleted: true,
      });
    });
    assert(
      mounted.getApi().dir.employers.length === 1 &&
        mounted.getApi().dir.employers[0].companyName === 'ROXAS TRADING CO.' &&
        mounted.getApi().dir.currentEmployerProfile?.isProfileCompleted === true,
      'updateEmployerProfile persists normalized fallback record cleanly under React StrictMode'
    );

    await mounted.act(async () => {
      mounted.getApi().auth.setCurrentUser(seekerUser);
    });
    assert(
      mounted.getApi().dir.currentEmployerProfile === null,
      'currentEmployerProfile remains null for non-employer users'
    );

    // Runtime notification actions for clean-slate admin
    await mounted.act(async () => {
      mounted.getApi().auth.setCurrentUser(adminUser);
      mounted.getApi().notif.addNotification({
        recipientId: 'admin',
        recipientRole: 'admin',
        title: 'Employer Verification Submitted: ROXAS TRADING CO.',
        message: 'Uploaded 1 verification document.',
        type: 'action',
        actionUrl: 'admin-verifications',
      });
      mounted.getApi().notif.addNotification({
        recipientId: empUser.id,
        recipientRole: 'employer',
        title: 'Employer Update',
        message: 'Own employer notice.',
        type: 'info',
      });
    });

    const visibleForAdminBeforeRead = getFilteredUserNotifications(
      mounted.getApi().notif.notifications,
      adminUser
    );
    assert(
      visibleForAdminBeforeRead.some((n) => n.recipientId === 'admin' && !n.read),
      'Clean-slate admin sees unread admin alert added via addNotification'
    );

    await mounted.act(async () => {
      mounted.getApi().notif.markAllNotificationsRead(adminUser.id, {
        userEmail: adminUser.email,
        currentUserRole: adminUser.role,
      });
    });
    const adminAlertAfterRead = mounted
      .getApi()
      .notif.notifications.find((n) => n.recipientId === 'admin');
    const empNotifAfterAdminRead = mounted
      .getApi()
      .notif.notifications.find((n) => n.recipientId === empUser.id);
    assert(
      adminAlertAfterRead?.read === true && empNotifAfterAdminRead?.read === false,
      'markAllNotificationsRead marks recipientId="admin" alerts read without touching other users'
    );

    await mounted.act(async () => {
      mounted.getApi().notif.clearAllNotifications(adminUser.id, {
        userEmail: adminUser.email,
        currentUserRole: adminUser.role,
      });
    });
    assert(
      !mounted.getApi().notif.notifications.some((n) => n.recipientId === 'admin') &&
        mounted.getApi().notif.notifications.some((n) => n.recipientId === empUser.id),
      'clearAllNotifications clears admin alerts without deleting other users notifications'
    );

    // Offline recovery parity & Supabase recovery service offline safety check
    const offlineResetRes = await resetPasswordWithSupabase('wp09.recovery@roxas.ph');
    const offlineUpdateRes = await updatePasswordWithSupabase('NewPassword2!');
    assert(
      offlineResetRes.success === true && offlineUpdateRes.success === true,
      'resetPasswordWithSupabase and updatePasswordWithSupabase degrade safely in offline mode'
    );

    let regRes!: ReturnType<AuthContextType['registerUser']>;
    const recoveryEmail = 'wp09.recovery@roxas.ph';
    await mounted.act(async () => {
      regRes = mounted.getApi().auth.registerUser(
        {
          email: recoveryEmail,
          name: 'Recovery Tester',
          role: 'job_seeker',
          isAccountVerified: true,
        },
        { password: 'OldPassword1!', firstName: 'Recovery', lastName: 'Tester' }
      );
    });
    assert(regRes.success === true, 'Registered seeker for offline password recovery test');

    let resetReq!: Awaited<ReturnType<AuthContextType['requestPasswordReset']>>;
    await mounted.act(async () => {
      resetReq = await mounted.getApi().auth.requestPasswordReset(recoveryEmail);
    });
    assert(resetReq.success === true && Boolean(resetReq.code), 'requestPasswordReset generates OTP in offline mode');

    let badRec!: Awaited<ReturnType<AuthContextType['recoverPassword']>>;
    let goodRec!: Awaited<ReturnType<AuthContextType['recoverPassword']>>;
    await mounted.act(async () => {
      badRec = await mounted.getApi().auth.recoverPassword(recoveryEmail, '000000', 'NewPassword2!');
      goodRec = await mounted.getApi().auth.recoverPassword(recoveryEmail, resetReq.code!, 'NewPassword2!');
    });
    assert(badRec.success === false && goodRec.success === true, 'recoverPassword rejects invalid OTP and accepts valid OTP');

    let oldLogin!: Awaited<ReturnType<AuthContextType['loginAs']>>;
    let newLogin!: Awaited<ReturnType<AuthContextType['loginAs']>>;
    await mounted.act(async () => {
      oldLogin = await mounted.getApi().auth.loginAs(recoveryEmail, 'OldPassword1!');
      newLogin = await mounted.getApi().auth.loginAs(recoveryEmail, 'NewPassword2!');
    });
    assert(!oldLogin.success && newLogin.success, 'loginAs rejects old password and accepts updated password');
  } finally {
    await mounted.unmount();
  }

  console.log(`\n--- WP-09 Verification Summary: ${passed}/${total} tests passed ---`);
}

run();
