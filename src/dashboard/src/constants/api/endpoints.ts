export const RESOURCE_API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? (() => {
  if (typeof window === 'undefined') {
    console.warn('NEXT_PUBLIC_API_URL is not set');
  }
  return '';
})();