// Vercel Edge Function — /api/ip
// Reads Cloudflare Pseudo IPv4 header to get visitor's real IPv4

export const config = { runtime: 'edge' };

export default function handler(req) {
  const h = req.headers;

  function isIPv4(s) { return /^\d{1,3}(\.\d{1,3}){3}$/.test((s||'').trim()); }
  function unmapIPv4(s) {
    var m = (s||'').match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
    return m ? m[1] : null;
  }

  // Priority order — find the best IPv4:
  // 1. CF-Pseudo-IPv4 (set when "Pseudo IPv4 → Add Header" is ON in Cloudflare)
  // 2. CF-Connecting-IP if already IPv4
  // 3. Unmapped ::ffff:x.x.x.x
  // 4. First IPv4 in X-Forwarded-For
  // 5. Fall back to whatever exists
  const pseudo   = h.get('cf-pseudo-ipv4')   || '';
  const cfIP     = h.get('cf-connecting-ip') || '';
  const xff      = h.get('x-forwarded-for')  || '';

  var ip = null;
  if (isIPv4(pseudo))  ip = pseudo.trim();
  if (!ip && isIPv4(cfIP)) ip = cfIP.trim();
  if (!ip) ip = unmapIPv4(cfIP);
  if (!ip) {
    xff.split(',').forEach(function(p) {
      if (!ip && isIPv4(p))        ip = p.trim();
      if (!ip && unmapIPv4(p.trim())) ip = unmapIPv4(p.trim());
    });
  }
  if (!ip) ip = cfIP || pseudo || 'unknown';

  const city     = h.get('cf-ipcity')      || h.get('x-vercel-ip-city')             || '';
  const country  = h.get('cf-ipcountry')   || h.get('x-vercel-ip-country')           || '';
  const region   = h.get('cf-region')      || h.get('x-vercel-ip-country-region')    || '';
  const timezone = h.get('cf-timezone')    || h.get('x-vercel-ip-timezone')           || '';
  const asn      = h.get('asn')            || '';

  return new Response(JSON.stringify({ ip, city, country, region, timezone, asn }), {
    status: 200,
    headers: {
      'Content-Type':                'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control':               'no-store',
    },
  });
}
