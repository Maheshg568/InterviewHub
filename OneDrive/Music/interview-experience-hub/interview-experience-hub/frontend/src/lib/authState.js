const AUTH_KEY = 'ieh_auth_state';

export const AUTH_STATES = {
  UNKNOWN: 'unknown',
  AUTHENTICATED: 'authenticated',
  UNAUTHENTICATED: 'unauthenticated'
};

export function getAuthState() {
  const value = window.sessionStorage.getItem(AUTH_KEY);
  if (!value) return AUTH_STATES.UNKNOWN;
  return value;
}

export function setAuthState(state) {
  window.sessionStorage.setItem(AUTH_KEY, state);
}

export function markAuthenticated() {
  setAuthState(AUTH_STATES.AUTHENTICATED);
  window.dispatchEvent(new CustomEvent('ieh:auth-changed', { detail: { state: AUTH_STATES.AUTHENTICATED } }));
}

export function markUnauthenticated() {
  setAuthState(AUTH_STATES.UNAUTHENTICATED);
  window.dispatchEvent(new CustomEvent('ieh:auth-changed', { detail: { state: AUTH_STATES.UNAUTHENTICATED } }));
}
