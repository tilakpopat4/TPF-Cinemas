/**
 * Helper to generate correct URLs across TPF Cinemas portals
 * - In local development: Maps to corresponding Vite dev server ports (5175, 5173, 5174)
 * - In production: Maps to respective subdomains/paths
 */
export function getPortalUrl(portal: 'cinema' | 'studio' | 'staff'): string {
  const isDev =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname.endsWith('.local'));

  if (isDev) {
    const portMap: Record<'cinema' | 'studio' | 'staff', string> = {
      cinema: '5175',
      studio: '5173',
      staff: '5174',
    };
    const targetPort = portMap[portal];
    return `${window.location.protocol}//${window.location.hostname}:${targetPort}`;
  }

  // Production routing:
  if (typeof window === 'undefined') return '/';
  const host = window.location.hostname;
  const rootDomain = host.replace(/^(studio\.|staff\.|cinema\.)/, '');

  if (portal === 'studio') return `https://studio.${rootDomain}`;
  if (portal === 'staff') return `https://staff.${rootDomain}`;
  return `https://${rootDomain}`;
}
