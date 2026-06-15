// Vercel Edge Function — /api/ip
// Reads Cloudflare + Vercel headers server-side, returns visitor's real data as JSON
// Same data source as ip.c99.nl (they read Cf-Connecting-Ip from their PHP server)

export const config = { runtime: 'edge' };

export default function handler(req) {
  const h = req.headers;

  // Cloudflare injects these on every request — this is exactly what c99.nl reads
  const ip       = h.get('cf-connecting-ip')
               || h.get('x-forwarded-for')?.split(',')[0].trim()
               || h.get('x-real-ip')
               || 'unknown';

  const city     = h.get('cf-ipcity')      || '';
  const country  = h.get('cf-ipcountry')   || '';
  const region   = h.get('cf-region')      || '';
  const timezone = h.get('cf-timezone')    || '';
  const lat      = h.get('cf-iplatitude')  || '';
  const lon      = h.get('cf-iplongitude') || '';
  const asn      = h.get('asn')            || '';
  const postal   = h.get('cf-postal-code') || '';

  // Vercel also injects x-vercel-ip-* as a fallback if not behind Cloudflare
  const data = {
    ip,
    city:     city     || h.get('x-vercel-ip-city')                   || '',
    country:  country  || h.get('x-vercel-ip-country')                || '',
    region:   region   || h.get('x-vercel-ip-country-region')         || '',
    timezone: timezone || h.get('x-vercel-ip-timezone')               || '',
    lat:      lat      || h.get('x-vercel-ip-latitude')               || '',
    lon:      lon      || h.get('x-vercel-ip-longitude')              || '',
    asn,
    postal,
  };

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      'Content-Type':                'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control':               'no-store',
    },
  });
}
