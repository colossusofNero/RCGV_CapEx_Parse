import Anthropic from '@anthropic-ai/sdk';
import * as pdfjs from 'pdfjs-dist';

// Configure pdfjs worker
const pdfjsLib = pdfjs as any;
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

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
 * Convert PDF buffer to images (one per page)
 */
async function pdfToImages(buffer: Buffer): Promise<string[]> {
  const uint8Array = new Uint8Array(buffer);
  const loadingTask = pdfjsLib.getDocument({ data: uint8Array });
  const pdf = await loadingTask.promise;

  const images: string[] = [];
  const numPages = Math.min(pdf.numPages, 5); // Limit to first 5 pages

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 2.0 });

    // Create canvas
    const canvas = require('@napi-rs/canvas').createCanvas(viewport.width, viewport.height);
    const context = canvas.getContext('2d');

    await page.render({
      canvasContext: context,
      viewport: viewport
    }).promise;

    // Convert to base64
    const imageData = canvas.toBuffer('image/png').toString('base64');
    images.push(imageData);
  }

  return images;
}

/**
 * Extract text directly from PDF for text-based PDFs
 */
async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  const uint8Array = new Uint8Array(buffer);
  const loadingTask = pdfjsLib.getDocument({ data: uint8Array });
  const pdf = await loadingTask.promise;

  let fullText = '';
  const numPages = Math.min(pdf.numPages, 5);

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item: any) => item.str).join(' ');
    fullText += `\n--- Page ${pageNum} ---\n${pageText}`;
  }

  return fullText;
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
    // First, try to extract text
    const text = await extractTextFromPDF(buffer);
    const hasText = text.replace(/\s+/g, '').length > 100;

    let content: Anthropic.MessageParam[];

    if (hasText) {
      // Text-based PDF
      console.log('Using text extraction method');
      content = [{
        role: 'user',
        content: `Please analyze this invoice/payment document and extract the following information in JSON format:

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

Document text:
${text}`
      }];
    } else {
      // Image-based/scanned PDF
      console.log('Using vision extraction method');
      const images = await pdfToImages(buffer);

      const imageBlocks = images.map(img => ({
        type: 'image' as const,
        source: {
          type: 'base64' as const,
          media_type: 'image/png' as const,
          data: img
        }
      }));

      content = [{
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Please analyze this invoice/payment document and extract the following information in JSON format:

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
- Remove currency symbols and commas from paidAmount`
          },
          ...imageBlocks
        ]
      }];
    }

    // Call Claude API
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: content
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
