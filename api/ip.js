// Vercel Edge Function — /api/ip
// Reads Cloudflare headers to get visitor's real IP and geo data

export const config = { runtime: 'edge' };

export default function handler(req) {
  const h = req.headers;

  // Cloudflare always sets cf-connecting-ip to the real client IP
  // x-forwarded-for may contain a chain; first entry is the real client
  const raw = h.get('cf-connecting-ip')
           || h.get('x-forwarded-for')?.split(',')[0].trim()
           || h.get('x-real-ip')
           || h.get('x-vercel-forwarded-for')?.split(',')[0].trim()
           || 'unknown';

  // If Cloudflare sends IPv6 but the visitor has IPv4, it's often a
  // 6to4 or Teredo address embedding an IPv4. Also handle ::ffff:x.x.x.x
  // (IPv4-mapped IPv6). Extract the IPv4 portion when present.
  var ip = raw;

  // ::ffff:192.168.1.1  →  192.168.1.1
  var mapped = ip.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
  if (mapped) ip = mapped[1];

  // 2002:c0a8:0101::  →  192.168.1.1  (6to4)
  var sixToFour = ip.match(/^2002:([0-9a-f]{2})([0-9a-f]{2}):([0-9a-f]{2})([0-9a-f]{2}):/i);
  if (sixToFour) {
    ip = [
      parseInt(sixToFour[1], 16),
      parseInt(sixToFour[2], 16),
      parseInt(sixToFour[3], 16),
      parseInt(sixToFour[4], 16)
    ].join('.');
  }

  // Cloudflare geo headers — filled by CF on every proxied request
  const city     = h.get('cf-ipcity')      || h.get('x-vercel-ip-city')                    || '';
  const country  = h.get('cf-ipcountry')   || h.get('x-vercel-ip-country')                 || '';
  const region   = h.get('cf-region')      || h.get('x-vercel-ip-country-region')           || '';
  const timezone = h.get('cf-timezone')    || h.get('x-vercel-ip-timezone')                 || '';
  const lat      = h.get('cf-iplatitude')  || h.get('x-vercel-ip-latitude')                 || '';
  const lon      = h.get('cf-iplongitude') || h.get('x-vercel-ip-longitude')                || '';
  const asn      = h.get('asn')            || '';
  const postal   = h.get('cf-postal-code') || '';
  const isIPv6   = ip.includes(':');

  return new Response(JSON.stringify({
    ip, raw, isIPv6,
    city, country, region, timezone, lat, lon, asn, postal,
  }), {
    status: 200,
    headers: {
      'Content-Type':                'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control':               'no-store',
    },
  });
}
