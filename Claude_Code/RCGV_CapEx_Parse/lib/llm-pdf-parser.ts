import Anthropic from '@anthropic-ai/sdk';

export interface ExtractedPDFData {
  vendor?: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  description?: string;
  paidAmount?: string;
  confidence: 'high' | 'medium' | 'low';
  rawResponse?: string;
}

/**
 * Extract text from PDF using pdf-parse
 */
async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  const pdfParse = await import('pdf-parse');
  const pdf = pdfParse.default || pdfParse;
  const data = await pdf(buffer);
  return data.text;
}

/**
 * Use Claude to extract structured data from PDF
 */
export async function parsePDFWithLLM(
  buffer: Buffer,
  fileName: string,
  apiKey?: string
): Promise<ExtractedPDFData> {

  const key = apiKey || process.env.ANTHROPIC_API_KEY;

  if (!key) {
    throw new Error('ANTHROPIC_API_KEY environment variable is required');
  }

  const anthropic = new Anthropic({ apiKey: key });

  console.log(`\n===== Starting LLM-based extraction for ${fileName} =====`);

  try {
    // Extract text from PDF
    const text = await extractTextFromPDF(buffer);
    console.log(`Extracted ${text.length} characters from PDF`);

    if (text.length < 50) {
      throw new Error('PDF appears to be empty or scanned (OCR not yet implemented)');
    }

    // Prepare prompt for Claude
    const prompt = `Please analyze this invoice/payment document and extract the following information in JSON format:

{
  "vendor": "Company/vendor name",
  "invoiceNumber": "Invoice or order number",
  "invoiceDate": "Date of invoice (format: MM/DD/YYYY)",
  "description": "Brief description of goods/services",
  "paidAmount": "Total amount paid (numeric value only, e.g., 1234.56)"
}

Rules:
- Return ONLY valid JSON, no additional text
- If a field cannot be found, use null
- For paidAmount, look for: "Order Total", "Grand Total", "Amount Due", "Total", "Amount Paid"
- Use the highest/final total amount, not subtotals
- Remove currency symbols and commas from paidAmount
- For description, provide a brief summary of what was purchased

Document text:
${text.slice(0, 15000)}`; // Limit to first 15k chars to avoid token limits

    // Call Claude API
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const responseText = message.content[0].type === 'text'
      ? message.content[0].text
      : '';

    console.log('Claude response:', responseText);

    // Parse JSON response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Determine confidence based on how many fields were found
    const fieldsFound = Object.values(parsed).filter(v => v !== null && v !== '').length;
    let confidence: 'high' | 'medium' | 'low';
    if (fieldsFound >= 4) confidence = 'high';
    else if (fieldsFound >= 2) confidence = 'medium';
    else confidence = 'low';

    console.log(`Extraction complete. Confidence: ${confidence}, Fields found: ${fieldsFound}/5`);

    return {
      vendor: parsed.vendor || undefined,
      invoiceNumber: parsed.invoiceNumber || undefined,
      invoiceDate: parsed.invoiceDate || undefined,
      description: parsed.description || undefined,
      paidAmount: parsed.paidAmount || undefined,
      confidence,
      rawResponse: responseText
    };

  } catch (error) {
    console.error('LLM extraction failed:', error);
    throw error;
  }
}
