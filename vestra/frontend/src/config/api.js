
export const API_BASE_URL = (
  process.env.REACT_APP_API_BASE_URL ||
  'https://vestra-cedesdonbosco.com/backend/api'
).replace(/\/+$/, '');

export const APP_BASE_URL = (
  process.env.REACT_APP_APP_BASE_URL ||
  'https://vestra-cedesdonbosco.com'
).replace(/\/+$/, '');

export function apiUrl(path = '') {
  const limpio = String(path).replace(/^\/+/, '');
  return limpio ? `${API_BASE_URL}/${limpio}` : API_BASE_URL;
}

export function appUrl(path = '') {
  const limpio = String(path).replace(/^\/+/, '');
  return limpio ? `${APP_BASE_URL}/${limpio}` : `${APP_BASE_URL}/`;
}
