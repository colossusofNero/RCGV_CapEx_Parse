interface Location {
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
}

interface ParseResult {
  pharmacies: Location[];
  coveredEntities: Location[];
}

export async function parseWithClaude(
  pdfBase64: string,
  supabaseUrl: string,
  onProgress?: (message: string) => void
): Promise<ParseResult> {
  onProgress?.('Sending PDF to Claude AI for parsing...');

  // Use Vercel API endpoint instead of Supabase Edge Function
  const apiUrl = '/api/parse-pdf';

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      pdfBase64: pdfBase64,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API error: ${response.status} - ${error}`);
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(data.error);
  }

  onProgress?.(`Successfully extracted ${data.pharmacies.length} pharmacies and ${data.coveredEntities.length} covered entities`);

  return {
    pharmacies: data.pharmacies || [],
    coveredEntities: data.coveredEntities || [],
  };
}
