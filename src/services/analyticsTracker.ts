import { supabase } from './supabaseClient';

export function detectDeviceType(): 'Mobile' | 'Tablet' | 'Desktop' {
  if (typeof window === 'undefined') return 'Desktop';
  const ua = navigator.userAgent || '';

  // Tablet detection
  const isTablet =
    /(ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk)/i.test(ua) ||
    (navigator.maxTouchPoints > 1 && window.innerWidth >= 600 && window.innerWidth <= 1024);
  if (isTablet) return 'Tablet';

  // Mobile detection
  const isMobile =
    /(iphone|ipod|android.*mobile|blackberry|bb10|windows phone|opera mini|mobile)/i.test(ua) ||
    (window.innerWidth < 768 && navigator.maxTouchPoints > 0);
  if (isMobile) return 'Mobile';

  return 'Desktop';
}

export function detectBrowser(): string {
  if (typeof window === 'undefined') return 'Unknown';
  const ua = navigator.userAgent || '';
  if (ua.includes('Edg/')) return 'Edge';
  if (ua.includes('Chrome/') && !ua.includes('Edg/')) return 'Chrome';
  if (ua.includes('Safari/') && !ua.includes('Chrome/')) return 'Safari';
  if (ua.includes('Firefox/')) return 'Firefox';
  if (ua.includes('OPR/') || ua.includes('Opera')) return 'Opera';
  return 'Browser';
}

interface GeoInfo {
  country: string;
  country_code: string | null;
}

// Convert ISO Alpha-2 country code to full name
const COUNTRY_NAMES: Record<string, string> = {
  US: 'United States',
  GB: 'United Kingdom',
  NG: 'Nigeria',
  CA: 'Canada',
  DE: 'Germany',
  FR: 'France',
  AU: 'Australia',
  NL: 'Netherlands',
  IN: 'India',
  BR: 'Brazil',
  JP: 'Japan',
  SG: 'Singapore',
  AE: 'United Arab Emirates',
  ZA: 'South Africa',
  GH: 'Ghana',
  KE: 'Kenya',
  SE: 'Sweden',
  CH: 'Switzerland',
  ES: 'Spain',
  IT: 'Italy',
  IE: 'Ireland',
  PT: 'Portugal',
  PL: 'Poland',
  DK: 'Denmark',
  NO: 'Norway',
  FI: 'Finland',
};

async function fetchGeoLocation(): Promise<GeoInfo> {
  // 1. Try Vercel Serverless Header
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1200);

    const res = await fetch('/api/geo', { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data.country_code) {
        const code = String(data.country_code).toUpperCase();
        return {
          country: COUNTRY_NAMES[code] || code,
          country_code: code,
        };
      }
    }
  } catch {
    // Continue to fallback
  }

  // 2. Fallback to free client-side IP lookup (fast 1.5s timeout)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1500);

    const res = await fetch('https://ipapi.co/json/', { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data.country_name || data.country_code) {
        return {
          country: data.country_name || data.country_code || 'Unknown',
          country_code: data.country_code ? String(data.country_code).toUpperCase() : null,
        };
      }
    }
  } catch {
    // Silent failover
  }

  return { country: 'Global Visitor', country_code: null };
}

/**
 * Tracks a single page view event per session.
 * Safe, completely non-blocking, and silent on network failure.
 */
export async function trackPageView(pagePath?: string): Promise<void> {
  if (typeof window === 'undefined') return;

  // Skip tracking for admin dashboard viewing
  const path = window.location.pathname.toLowerCase();
  const hash = window.location.hash.toLowerCase();
  if (path.startsWith('/admin') || hash.startsWith('#admin') || window.location.search.includes('preview=true')) {
    return;
  }

  // Deduplicate per browser session (avoids counting page refreshes)
  const sessionKey = 'bliss_session_viewed';
  if (sessionStorage.getItem(sessionKey)) {
    return;
  }

  try {
    sessionStorage.setItem(sessionKey, '1');

    const device = detectDeviceType();
    const browser = detectBrowser();
    const geo = await fetchGeoLocation();

    await supabase.from('analytics').insert([
      {
        page_path: pagePath || window.location.pathname || '/',
        event_type: 'view',
        country: geo.country,
        country_code: geo.country_code,
        device_type: device,
        browser: browser,
      },
    ]);
  } catch (err) {
    // Non-blocking, never interrupt user experience
    console.debug('Analytics capture:', err);
  }
}

/**
 * Tracks a conversion / lead action (e.g. clicking 'Book a call', copying direct email).
 * Stored with event_type: 'lead' so it counts immediately towards Direct Leads.
 */
export async function trackLeadEvent(eventType: 'booking' | 'email_copy' | 'lead' = 'lead', details?: string): Promise<void> {
  if (typeof window === 'undefined') return;

  const path = window.location.pathname.toLowerCase();
  const hash = window.location.hash.toLowerCase();
  if (path.startsWith('/admin') || hash.startsWith('#admin')) return;

  try {
    const device = detectDeviceType();
    const browser = detectBrowser();
    const geo = await fetchGeoLocation();

    await supabase.from('analytics').insert([
      {
        page_path: details || window.location.pathname || '/',
        event_type: 'lead',
        country: geo.country,
        country_code: geo.country_code,
        device_type: device,
        browser: `${browser} (${eventType})`,
      },
    ]);
  } catch (err) {
    console.debug('Lead event tracking error:', err);
  }
}

