import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface ParsedData {
  npId: string;
  name: string;
  paidAmount: string;
}

interface OrderMatch {
  page: number;
  label: string;
  amount: number;
  line: string;
  confidence: number;
  description?: string;
}

interface ExtractionResult {
  orders: OrderMatch[];
  line_count: number;
  sum_amounts: number;
  verification_ok: boolean;
  notes: string;
  extraction_method: string;
}

// ============================================================================
// PHASE 1: Enhanced Extraction Function
// ============================================================================

/**
 * Extracts all order totals from a PDF with intelligent deduplication
 * and multi-strategy parsing
 */
async function extractOrdersFromPDF(
  buffer: Buffer,
  fileName: string
): Promise<ExtractionResult> {
  console.log(`\n===== Starting Enhanced Extraction for ${fileName} =====`);

  try {
    // Try text layer extraction first
    const pdfParse = await import('pdf-parse');
    const pdf = pdfParse.default || pdfParse;
    const data = await pdf(buffer);

    console.log(`Text layer extracted: ${data.text.length} characters`);

    // Attempt to extract orders from text layer
    let result = extractOrdersFromText(data.text, fileName);

    // If text layer yields poor results, try OCR
    const cleanedText = data.text.replace(/\s+/g, '');
    const shouldTryOCR = cleanedText.length < 50 || result.orders.length === 0;

    if (shouldTryOCR) {
      console.log(`Text layer insufficient (${cleanedText.length} chars, ${result.orders.length} orders). Attempting OCR...`);

      try {
        const ocrText = await extractTextFromScannedPdfWithRotation(buffer, fileName);
        const ocrResult = extractOrdersFromText(ocrText, fileName);

        // Use OCR result if it's better
        if (ocrResult.orders.length > result.orders.length) {
          console.log(`OCR yielded better results: ${ocrResult.orders.length} orders vs ${result.orders.length}`);
          result = ocrResult;
          result.extraction_method = 'OCR';
        }
      } catch (ocrError) {
        console.error('OCR extraction failed:', ocrError);
        result.notes += ' OCR fallback failed.';
      }
    } else {
      result.extraction_method = 'Text Layer';
    }

    // Apply deduplication
    const deduplicatedResult = applyDeduplication(result);

    console.log(`\n===== Extraction Complete =====`);
    console.log(`Orders found: ${deduplicatedResult.orders.length}`);
    console.log(`Sum: $${deduplicatedResult.sum_amounts.toFixed(2)}`);
    console.log(`Verification: ${deduplicatedResult.verification_ok ? 'PASS' : 'FAIL'}`);

    return deduplicatedResult;

  } catch (error) {
    console.error('Critical error in extraction:', error);
    return {
      orders: [],
      line_count: 0,
      sum_amounts: 0,
      verification_ok: false,
      notes: `Extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      extraction_method: 'Failed'
    };
  }
}

/**
 * Extracts description from nearby lines
 */
function extractDescription(lines: string[], currentIndex: number): string | undefined {
  // Look for description in previous lines (up to 10 lines back)
  const descriptionPatterns = [
    /^Description[:\s]+(.+)$/i,
    /^Purpose[:\s]+(.+)$/i,
    /^For[:\s]+(.+)$/i,
    /^Item[:\s]+(.+)$/i,
    /^Expense[:\s]+(.+)$/i,
    /^Service[:\s]+(.+)$/i,
    /^Details[:\s]+(.+)$/i,
    /^Memo[:\s]+(.+)$/i,
  ];

  // Search backwards from current line
  for (let i = Math.max(0, currentIndex - 10); i < currentIndex; i++) {
    const line = lines[i].trim();

    for (const pattern of descriptionPatterns) {
      const match = line.match(pattern);
      if (match && match[1]) {
        const desc = match[1].trim();
        // Only return if it's reasonably long and not just a keyword
        if (desc.length > 10 && !desc.toLowerCase().includes('invoice') && !desc.toLowerCase().includes('date')) {
          return desc;
        }
      }
    }
  }

  return undefined;
}


// ============================================================================
// PHASE 2: Pattern Matching Engine
// ============================================================================

/**
 * Extracts orders from text using resilient pattern matching
 */
function extractOrdersFromText(text: string, fileName: string): ExtractionResult {
  console.log(`\n--- Pattern Matching Phase ---`);

  const lines = text.split('\n');
  console.log(`Processing ${lines.length} lines`);

  // Keywords that indicate a total (in priority order)
  const totalKeywords = [
    'order total',
    'grand total',
    'amount due',
    'balance paid',
    'total paid',
    'payment total',
    'total amount',
    'total',
  ];

  // Keywords that should reduce confidence (false positives)
  const excludeKeywords = [
    'subtotal',
    'sub total',
    'sub-total',
    'estimated',
    'tax',
    'shipping',
    'discount',
  ];

  // Resilient money regex - matches currency amounts
  // Handles: $1,234.56 or 1234.56 or 1,234.56
  const moneyRegex = /(?<!\w)(?:\$)?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2}))(?!\w)/g;

  const orders: OrderMatch[] = [];
  let currentPage = 1;

  // Track page numbers by detecting "page X of Y" patterns
  const pagePatterns = [
    /page\s+(\d+)\s+of\s+(\d+)/i,
    /page\s+(\d+)\s*\/\s*(\d+)/i,
    /(\d+)\s+of\s+(\d+)\s+pages/i,
  ];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineLower = line.toLowerCase();

    // Update page tracking
    for (const pagePattern of pagePatterns) {
      const pageMatch = line.match(pagePattern);
      if (pageMatch) {
        currentPage = parseInt(pageMatch[1]);
        console.log(`Detected page ${currentPage} at line ${i + 1}`);
        break;
      }
    }

    // Check if line contains a total keyword
    let bestKeywordMatch = '';
    let keywordConfidence = 0;

    for (let ki = 0; ki < totalKeywords.length; ki++) {
      const keyword = totalKeywords[ki];
      if (lineLower.includes(keyword)) {
        // Higher confidence for more specific keywords
        const conf = 100 - (ki * 10);
        if (conf > keywordConfidence) {
          bestKeywordMatch = keyword;
          keywordConfidence = conf;
        }
      }
    }

    // Skip if no total keyword found
    if (!bestKeywordMatch) continue;

    // Reduce confidence if exclude keywords present
    for (const excludeKeyword of excludeKeywords) {
      if (lineLower.includes(excludeKeyword)) {
        keywordConfidence -= 50;
        console.log(`Line ${i + 1}: Reducing confidence due to "${excludeKeyword}"`);
      }
    }

    // Skip if confidence is too low
    if (keywordConfidence < 20) continue;

    // Find all money amounts in the line and nearby lines
    const contextLines = [
      i > 0 ? lines[i - 1] : '',
      line,
      i < lines.length - 1 ? lines[i + 1] : '',
    ].join(' ');

    const moneyMatches = Array.from(contextLines.matchAll(moneyRegex));

    if (moneyMatches.length === 0) {
      console.log(`Line ${i + 1}: Keyword "${bestKeywordMatch}" found but no amount`);
      continue;
    }

    // If multiple amounts, prefer the one closest to the keyword
    let bestAmount = '';
    let bestDistance = Infinity;

    for (const match of moneyMatches) {
      const amount = match[1];
      const amountValue = parseFloat(amount.replace(/,/g, ''));

      // Skip unreasonably small or large amounts
      if (amountValue < 1 || amountValue > 1000000) continue;

      // Calculate distance from keyword in the line
      const keywordPos = lineLower.indexOf(bestKeywordMatch);
      const amountPos = line.indexOf(match[0]);
      const distance = Math.abs(keywordPos - amountPos);

      if (distance < bestDistance) {
        bestDistance = distance;
        bestAmount = amount;
      }
    }

    if (bestAmount) {
      const amountValue = parseFloat(bestAmount.replace(/,/g, ''));

      // Try to find description in nearby lines
      const description = extractDescription(lines, i);

      orders.push({
        page: currentPage,
        label: bestKeywordMatch,
        amount: amountValue,
        line: line.trim().substring(0, 100),
        confidence: keywordConfidence,
        description,
      });

      console.log(`Line ${i + 1}: Found ${bestKeywordMatch} = $${amountValue.toFixed(2)} (confidence: ${keywordConfidence})`);
      if (description) {
        console.log(`  Description: ${description}`);
      }
    }
  }

  // Sort by page then confidence
  orders.sort((a, b) => {
    if (a.page !== b.page) return a.page - b.page;
    return b.confidence - a.confidence;
  });

  // Calculate sum
  const sum = orders.reduce((acc, o) => acc + o.amount, 0);

  return {
    orders,
    line_count: lines.length,
    sum_amounts: sum,
    verification_ok: true, // Will be updated after deduplication
    notes: `Found ${orders.length} potential order totals`,
    extraction_method: 'Text Layer (pending)'
  };
}

// ============================================================================
// PHASE 3: Deduplication Logic
// ============================================================================

/**
 * Applies intelligent deduplication to handle multi-page orders
 */
function applyDeduplication(result: ExtractionResult): ExtractionResult {
  console.log(`\n--- Deduplication Phase ---`);
  console.log(`Input: ${result.orders.length} orders`);

  if (result.orders.length <= 1) {
    console.log('Single order detected, no deduplication needed');
    return result;
  }

  const deduplicated: OrderMatch[] = [];
  const seen = new Map<string, OrderMatch>();

  for (let i = 0; i < result.orders.length; i++) {
    const order = result.orders[i];
    const key = `${order.amount.toFixed(2)}`;

    // Check if we've seen this exact amount
    if (seen.has(key)) {
      const existing = seen.get(key)!;

      // If on consecutive pages, it's likely the same order
      if (Math.abs(order.page - existing.page) <= 1) {
        console.log(`Duplicate: $${order.amount.toFixed(2)} on pages ${existing.page} and ${order.page} (skipping)`);

        // Keep the one with higher confidence
        if (order.confidence > existing.confidence) {
          // Replace the existing one
          const idx = deduplicated.findIndex(o => o === existing);
          if (idx !== -1) {
            deduplicated[idx] = order;
            seen.set(key, order);
            console.log(`  Replaced with higher confidence match`);
          }
        }
        continue;
      }
    }

    // Not a duplicate, add it
    deduplicated.push(order);
    seen.set(key, order);
  }

  console.log(`Output: ${deduplicated.length} unique orders after deduplication`);

  // Recalculate sum
  const newSum = deduplicated.reduce((acc, o) => acc + o.amount, 0);

  // Verification: Check if we have reasonable data
  const verification = verifyExtractionQuality(deduplicated, newSum);

  return {
    orders: deduplicated,
    line_count: result.line_count,
    sum_amounts: newSum,
    verification_ok: verification.ok,
    notes: verification.notes,
    extraction_method: result.extraction_method
  };
}

/**
 * Verifies extraction quality
 */
function verifyExtractionQuality(
  orders: OrderMatch[],
  sum: number
): { ok: boolean; notes: string } {
  const issues: string[] = [];

  // Check 1: Do we have any orders?
  if (orders.length === 0) {
    issues.push('No orders found');
    return { ok: false, notes: issues.join('; ') };
  }

  // Check 2: Is the sum reasonable?
  if (sum <= 0) {
    issues.push('Total sum is zero or negative');
  }

  // Check 3: Are there duplicate amounts on same page?
  const pageAmounts = new Map<number, Set<number>>();
  for (const order of orders) {
    if (!pageAmounts.has(order.page)) {
      pageAmounts.set(order.page, new Set());
    }
    const amounts = pageAmounts.get(order.page)!;
    if (amounts.has(order.amount)) {
      issues.push(`Duplicate amount $${order.amount.toFixed(2)} on page ${order.page}`);
    }
    amounts.add(order.amount);
  }

  // Check 4: Are all amounts within reasonable range?
  for (const order of orders) {
    if (order.amount < 1) {
      issues.push(`Suspiciously low amount: $${order.amount.toFixed(2)}`);
    }
    if (order.amount > 100000) {
      issues.push(`Suspiciously high amount: $${order.amount.toFixed(2)}`);
    }
  }

  const ok = issues.length === 0;
  const notes = ok
    ? `Successfully extracted ${orders.length} orders totaling $${sum.toFixed(2)}`
    : issues.join('; ');

  return { ok, notes };
}

// ============================================================================
// PHASE 4: OCR Enhancement with Auto-Rotation
// ============================================================================

/**
 * Performs OCR with automatic rotation detection
 */
async function extractTextFromScannedPdfWithRotation(
  buffer: Buffer,
  fileName: string
): Promise<string> {
  console.log(`\n--- OCR with Auto-Rotation ---`);

  let tempDir: string | null = null;

  try {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf-ocr-'));

    const pdfjsLib = await import('pdfjs-dist');
    const { createCanvas } = await import('@napi-rs/canvas');
    const { createWorker } = await import('tesseract.js');

    // Load PDF
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(buffer),
      useSystemFonts: true,
    });
    const pdfDocument = await loadingTask.promise;

    const totalPages = Math.min(pdfDocument.numPages, 10); // Process up to 10 pages
    console.log(`Processing ${totalPages} pages with OCR`);

    let allText = '';

    // Process each page
    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      console.log(`\nOCR Page ${pageNum}/${totalPages}...`);

      const page = await pdfDocument.getPage(pageNum);

      // Try multiple rotations and pick the best
      const rotations = [0, 90, 180, 270];
      let bestText = '';
      let bestScore = 0;

      for (const rotation of rotations) {
        try {
          const text = await performOcrWithRotation(
            page,
            rotation,
            tempDir,
            pageNum,
            createCanvas,
            createWorker
          );

          // Score based on number of valid money amounts and total keywords
          const score = scoreOcrResult(text);

          console.log(`  Rotation ${rotation}°: score=${score}, chars=${text.length}`);

          if (score > bestScore) {
            bestScore = score;
            bestText = text;
          }
        } catch (rotError) {
          console.error(`  Rotation ${rotation}° failed:`, rotError);
        }
      }

      if (bestText) {
        allText += `\n--- Page ${pageNum} ---\n${bestText}\n`;
      }
    }

    console.log(`Total OCR text extracted: ${allText.length} characters`);
    return allText;

  } finally {
    // Cleanup
    if (tempDir && fs.existsSync(tempDir)) {
      try {
        const files = fs.readdirSync(tempDir);
        for (const file of files) {
          fs.unlinkSync(path.join(tempDir, file));
        }
        fs.rmdirSync(tempDir);
      } catch (cleanupError) {
        console.error('Cleanup error:', cleanupError);
      }
    }
  }
}

/**
 * Performs OCR on a page with specific rotation
 */
async function performOcrWithRotation(
  page: any,
  rotation: number,
  tempDir: string,
  pageNum: number,
  createCanvas: any,
  createWorker: any
): Promise<string> {
  // 2x scale for better OCR accuracy
  const scale = 2.0;
  const viewport = page.getViewport({ scale, rotation });

  const canvas = createCanvas(viewport.width, viewport.height);
  const context = canvas.getContext('2d');

  await page.render({
    canvasContext: context as any,
    viewport: viewport,
  }).promise;

  // Save to temp file
  const imagePath = path.join(tempDir, `page-${pageNum}-rot${rotation}.png`);
  const out = fs.createWriteStream(imagePath);
  const stream = (canvas as any).createPNGStream();
  stream.pipe(out);

  await new Promise<void>((resolve, reject) => {
    out.on('finish', () => resolve());
    out.on('error', reject);
  });

  // Run OCR
  const worker = await createWorker('eng');
  const { data: { text } } = await worker.recognize(imagePath);
  await worker.terminate();

  return text;
}

/**
 * Scores OCR result based on presence of money amounts and keywords
 */
function scoreOcrResult(text: string): number {
  let score = 0;

  const textLower = text.toLowerCase();

  // Count money amounts
  const moneyRegex = /(?:\$)?\s*\d{1,3}(?:,\d{3})*(?:\.\d{2})/g;
  const moneyMatches = text.match(moneyRegex);
  score += (moneyMatches?.length || 0) * 10;

  // Count total keywords
  const keywords = ['order total', 'total', 'amount due', 'grand total'];
  for (const keyword of keywords) {
    if (textLower.includes(keyword)) {
      score += 20;
    }
  }

  // Bonus for reasonable text length
  if (text.length > 100) score += 10;
  if (text.length > 500) score += 10;

  return score;
}

/**
 * Simple OCR fallback (no rotation) - for backward compatibility
 */
async function extractTextFromScannedPdf(buffer: Buffer, fileName: string): Promise<string> {
  let tempDir: string | null = null;

  try {
    console.log(`Starting OCR extraction for ${fileName}...`);
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf-ocr-'));

    const pdfjsLib = await import('pdfjs-dist');
    const { createCanvas } = await import('@napi-rs/canvas');

    console.log('Converting PDF pages to images...');

    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(buffer),
      useSystemFonts: true,
    });
    const pdfDocument = await loadingTask.promise;

    const totalPages = Math.min(pdfDocument.numPages, 2);
    console.log(`Found ${totalPages} page(s) to process with OCR`);

    if (totalPages === 0) {
      throw new Error('No pages found in PDF');
    }

    const { createWorker } = await import('tesseract.js');
    let combinedText = '';

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      console.log(`Running OCR on page-${pageNum}...`);

      const page = await pdfDocument.getPage(pageNum);
      const scale = 2.0;
      const viewport = page.getViewport({ scale });

      const canvas = createCanvas(viewport.width, viewport.height);
      const context = canvas.getContext('2d');

      const renderContext = {
        canvasContext: context as any,
        viewport: viewport,
      };

      await page.render(renderContext).promise;

      const imagePath = path.join(tempDir, `page-${pageNum}.png`);
      const out = fs.createWriteStream(imagePath);
      const stream = (canvas as any).createPNGStream();
      stream.pipe(out);

      await new Promise<void>((resolve, reject) => {
        out.on('finish', () => resolve());
        out.on('error', reject);
      });

      const worker = await createWorker('eng');
      const { data: { text } } = await worker.recognize(imagePath);
      await worker.terminate();

      combinedText += text + '\n';
      console.log(`OCR completed for page-${pageNum}, extracted ${text.length} characters`);
    }

    console.log(`Total OCR text length: ${combinedText.length} characters`);
    return combinedText;

  } catch (error) {
    console.error('Error during OCR extraction:', error);
    throw error;
  } finally {
    if (tempDir && fs.existsSync(tempDir)) {
      try {
        const files = fs.readdirSync(tempDir);
        for (const file of files) {
          fs.unlinkSync(path.join(tempDir, file));
        }
        fs.rmdirSync(tempDir);
        console.log('Cleaned up temporary files');
      } catch (cleanupError) {
        console.error('Error cleaning up temporary files:', cleanupError);
      }
    }
  }
}

// ============================================================================
// Legacy Helper Functions (for backward compatibility)
// ============================================================================

function extractDataFromPdfText(text: string): { name: string; paidAmount: string } | null {
  const normalizedText = text.replace(/\s+/g, ' ').trim();

  let name = '';
  let paidAmount = '';

  const namePatterns = [
    /(?:Name|Vendor|Company|Payee|Pay\s*to|Recipient)[\s:]+([A-Za-z0-9\s.,&'-]+?)(?=\s*(?:Amount|Total|Paid|Payment|Date|Invoice|$))/i,
    /(?:to|for)[\s:]+([A-Za-z][A-Za-z0-9\s.,&'-]{2,50}?)(?=\s*(?:Amount|Total|Paid|Payment|\$|Date|Invoice))/i,
  ];

  for (const pattern of namePatterns) {
    const match = normalizedText.match(pattern);
    if (match && match[1]) {
      name = match[1].trim();
      break;
    }
  }

  if (!name) {
    const capitalizedMatch = normalizedText.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,4})\b/);
    if (capitalizedMatch) {
      name = capitalizedMatch[1];
    }
  }

  const amountPatterns = [
    /\$\s*([\d,]+\.?\d{0,2})/,
    /(?:Amount|Total|Paid|Payment|Sum)[\s:]+\$?\s*([\d,]+\.?\d{0,2})/i,
    /([\d,]+\.\d{2})/,
  ];

  for (const pattern of amountPatterns) {
    const match = normalizedText.match(pattern);
    if (match && match[1]) {
      const cleanAmount = match[1].replace(/,/g, '');
      if (parseFloat(cleanAmount) > 0) {
        paidAmount = cleanAmount;
        break;
      }
    }
  }

  if (!name && !paidAmount) {
    return null;
  }

  return {
    name: name || 'Unknown',
    paidAmount: paidAmount || '0.00',
  };
}

// ============================================================================
// PHASE 5: Enhanced POST Handler with Debug Output
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    console.log('\n========================================');
    console.log('Starting PDF Parse Request');
    console.log('========================================');

    const formData = await request.formData();
    const npId = formData.get('npId') as string;
    const files = formData.getAll('pdfs') as File[];

    console.log('NP_ID:', npId);
    console.log('Files count:', files.length);

    if (!npId) {
      return NextResponse.json({ error: 'NP_ID is required' }, { status: 400 });
    }

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No PDF files provided' }, { status: 400 });
    }

    const parsedData: ParsedData[] = [];
    const debugInfo: any[] = [];

    // Process each PDF file
    for (const file of files) {
      if (file.type !== 'application/pdf') {
        console.log(`Skipping non-PDF file: ${file.name}`);
        continue;
      }

      try {
        console.log(`\n========================================`);
        console.log(`Processing: ${file.name}`);
        console.log(`Size: ${file.size} bytes`);
        console.log(`========================================`);

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Use enhanced extraction
        const extractionResult = await extractOrdersFromPDF(buffer, file.name);

        // Store debug info
        debugInfo.push({
          fileName: file.name,
          ...extractionResult,
        });

        // Generate CSV rows from orders
        if (extractionResult.orders.length > 0) {
          for (const order of extractionResult.orders) {
            parsedData.push({
              npId,
              name: order.description || `${file.name} - Page ${order.page} (${order.label})`,
              paidAmount: order.amount.toFixed(2),
            });
          }
        } else {
          // Fallback to legacy extraction for simple cases
          console.log('\n--- Attempting Legacy Extraction ---');
          const pdfParse = await import('pdf-parse');
          const pdf = pdfParse.default || pdfParse;
          const data = await pdf(buffer);

          const extracted = extractDataFromPdfText(data.text);

          if (extracted) {
            console.log(`Legacy extraction: ${extracted.name} = $${extracted.paidAmount}`);
            parsedData.push({
              npId,
              name: extracted.name,
              paidAmount: extracted.paidAmount,
            });
          } else {
            console.log('No data extracted, using filename');
            parsedData.push({
              npId,
              name: file.name.replace('.pdf', ''),
              paidAmount: '0.00',
            });
          }
        }

      } catch (pdfError) {
        console.error(`Error parsing PDF ${file.name}:`, pdfError);
        parsedData.push({
          npId,
          name: `Error: ${file.name}`,
          paidAmount: '0.00',
        });
      }
    }

    // Generate CSV
    const csvHeader = 'NP_ID,Name,Paid_Amount\n';
    const csvRows = parsedData
      .map((row) => {
        const escapeCsvValue = (value: string) => {
          if (value.includes(',') || value.includes('"') || value.includes('\n')) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        };

        return `${escapeCsvValue(row.npId)},${escapeCsvValue(row.name)},${escapeCsvValue(row.paidAmount)}`;
      })
      .join('\n');

    const csv = csvHeader + csvRows;

    console.log('\n========================================');
    console.log('Processing Complete');
    console.log(`Total CSV rows: ${parsedData.length}`);
    console.log('========================================\n');

    // Return CSV with debug info in headers
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="capex_export_${npId}_${Date.now()}.csv"`,
        'X-Debug-Info': JSON.stringify(debugInfo),
      },
    });
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json(
      { error: 'Failed to process PDF files', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
