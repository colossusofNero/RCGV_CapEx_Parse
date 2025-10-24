export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Client-Info, Apikey');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { pdfBase64 } = req.body;

    if (!pdfBase64) {
      return res.status(400).json({ error: 'Missing pdfBase64 in request body' });
    }

    const claudeApiKey = process.env.CLAUDE_API_KEY;
    if (!claudeApiKey) {
      return res.status(500).json({ error: 'Claude API key not configured' });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': claudeApiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'document',
                source: {
                  type: 'base64',
                  media_type: 'application/pdf',
                  data: pdfBase64,
                },
              },
              {
                type: 'text',
                text: `Please extract ALL locations from this PDF document. There are two types of locations:

1. Covered Entity Locations (with HRSA IDs like STD85140, STD85224, etc.)
2. Retail Pharmacy Locations (with location numbers like 3727, 7723, etc.)

For each location, extract:
- name (HRSA ID for entities, location number for pharmacies)
- address (street address)
- city
- state (2-letter code)
- zip (5-digit code)

IMPORTANT: Store numbers that start with "0" need to be preserved as text with the leading zero. For example, if you see store number "0123", it must be kept as "0123", not "123".

Return the data as a JSON object with this exact structure:
{
  "pharmacies": [
    {"name": "3727", "address": "1919 N DOBSON RD", "city": "CHANDLER", "state": "AZ", "zip": "85224"}
  ],
  "coveredEntities": [
    {"name": "STD85140", "address": "1150 NORTH SAN FRANCISCO ST.", "city": "FLAGSTAFF", "state": "AZ", "zip": "86001"}
  ]
}

Make sure to extract ALL locations from ALL pages, including pages 3 and 4 which contain table data. Do not miss any rows.`,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return res.status(response.status).json({ error: `Claude API error: ${response.status} - ${error}` });
    }

    const data = await response.json();
    const content = data.content[0].text;

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.status(500).json({ error: 'Could not find JSON in Claude response' });
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return res.status(200).json({
      pharmacies: parsed.pharmacies || [],
      coveredEntities: parsed.coveredEntities || [],
    });
  } catch (error) {
    console.error('Parse PDF error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
