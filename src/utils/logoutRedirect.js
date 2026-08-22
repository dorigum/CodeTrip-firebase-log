export const LOGOUT_REDIRECT_KEY = 'codetrip:logout_redirecting';

export const isLogoutRedirecting = () => (
  typeof window !== 'undefined'
  && window.sessionStorage.getItem(LOGOUT_REDIRECT_KEY) === 'true'
);

export const markLogoutRedirecting = () => {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(LOGOUT_REDIRECT_KEY, 'true');
};

export const clearLogoutRedirecting = () => {
  if (typeof window === 'undefined') return;
  window.sessionStorage.removeItem(LOGOUT_REDIRECT_KEY);
};

export const clearLogoutRedirectingSoon = () => {
  if (typeof window === 'undefined') return;
  window.setTimeout(clearLogoutRedirecting, 0);
};
