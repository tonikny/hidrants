const OVERPASS_API_URL =
  process.env.OVERPASS_URL || 'https://overpass.kumi.systems/api/interpreter';

/**
 * Execute a query against the Overpass API
 */
export async function queryOverpass(query: string) {
  const response = await fetch(OVERPASS_API_URL, {
    method: 'POST',
    headers: {
      Accept: '*/*',
      'User-Agent': 'HidrantsADF/1.0 (dalecanya@gmail.com)',
      'Accept-Encoding': 'gzip, deflate, br',
      'Accept-Language': 'en-US,en;q=0.9',
    },
    body: query,
  });

  if (!response.ok) {
    const text = await response.text();
    // Retornem l'status per a que el cridant pugui decidir si és un error fatal o temporal
    return {
      ok: false,
      status: response.status,
      error: text,
    };
  }

  const data = await response.json();
  return {
    ok: true,
    status: 200,
    data,
  };
}
