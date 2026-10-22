export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const countryCode = req.headers['x-vercel-ip-country'] || null;
  const countryRegion = req.headers['x-vercel-ip-country-region'] || null;
  const city = req.headers['x-vercel-ip-city'] || null;

  return res.status(200).json({
    country_code: countryCode,
    region: countryRegion,
    city: city
  });
}
