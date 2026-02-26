import {
  signIn,
  signUp,
  confirmSignUp,
  signOut,
  fetchAuthSession,
  getCurrentUser,
} from 'aws-amplify/auth';
import apiClient from './api-client';

/**
 * Cognito auth service for dev/prod stages.
 * Uses AWS Amplify v6 for sign-in/sign-up and syncs the user
 * with the backend via the /auth/sync endpoint.
 */

export interface CognitoAuthResult {
  token: string;
  user: {
    id: string;
    email: string;
    cognitoSub: string;
    firstName: string;
    lastName: string;
    seekingMode: string;
  };
}

/**
 * Sign in with Cognito and sync user to backend.
 */
export async function cognitoLogin(email: string, password: string): Promise<CognitoAuthResult> {
  // Step 1: Sign in via Cognito
  const signInResult = await signIn({
    username: email,
    password,
  });

  if (signInResult.nextStep?.signInStep === 'CONFIRM_SIGN_UP') {
    throw new Error('CONFIRM_SIGN_UP_REQUIRED');
  }

  if (!signInResult.isSignedIn) {
    throw new Error(`Inicio de sesion incompleto: ${signInResult.nextStep?.signInStep || 'unknown'}`);
  }

  // Step 2: Get the access token
  return await syncWithBackend();
}

/**
 * Sign up with Cognito. Returns the confirmation step.
 * After this, the user needs to verify their email with a code.
 */
export async function cognitoRegister(
  email: string,
  password: string,
  firstName: string,
  lastName: string,
): Promise<{ needsConfirmation: boolean }> {
  const result = await signUp({
    username: email,
    password,
    options: {
      userAttributes: {
        email,
        given_name: firstName,
        family_name: lastName,
      },
    },
  });

  return {
    needsConfirmation: !result.isSignUpComplete,
  };
}

/**
 * Confirm sign-up with verification code sent to email.
 */
export async function cognitoConfirmRegistration(
  email: string,
  code: string,
): Promise<void> {
  await confirmSignUp({
    username: email,
    confirmationCode: code,
  });
}

/**
 * Get the current access token from Cognito session.
 * Returns null if not authenticated.
 */
export async function getCognitoToken(): Promise<string | null> {
  try {
    const session = await fetchAuthSession();
    return session.tokens?.idToken?.toString() || null;
  } catch {
    return null;
  }
}

/**
 * Sign out from Cognito.
 */
export async function cognitoLogout(): Promise<void> {
  try {
    await signOut();
  } catch {
    // Ignore errors during sign out
  }
}

/**
 * Fetch the current session token and sync the user with the backend.
 * Called after successful sign-in or when restoring a session.
 */
async function syncWithBackend(): Promise<CognitoAuthResult> {
  const session = await fetchAuthSession();
  const token = session.tokens?.idToken?.toString();

  if (!token) {
    throw new Error('No se pudo obtener el token de acceso');
  }

  // Get the Cognito user info
  const cognitoUser = await getCurrentUser();

  // Sync with backend — creates or updates the user in our DB
  const response = await apiClient.post(
    '/auth/sync',
    {},
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );

  const syncedUser = response.data;

  return {
    token,
    user: {
      id: syncedUser.id,
      email: syncedUser.email,
      cognitoSub: cognitoUser.userId,
      firstName: syncedUser.firstName,
      lastName: syncedUser.lastName,
      seekingMode: syncedUser.seekingMode,
    },
  };
}

/**
 * Try to restore a Cognito session (for page reloads).
 * Returns null if no valid session exists.
 */
export async function restoreCognitoSession(): Promise<CognitoAuthResult | null> {
  try {
    const session = await fetchAuthSession();
    if (!session.tokens?.idToken) return null;

    return await syncWithBackend();
  } catch {
    return null;
  }
}
