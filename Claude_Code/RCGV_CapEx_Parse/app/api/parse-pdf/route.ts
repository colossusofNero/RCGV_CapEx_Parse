import { NextRequest, NextResponse } from 'next/server';
import { parsePDFWithLLM } from '@/lib/llm-pdf-parser';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60; // Increase timeout for LLM calls

interface ParsedData {
  npId: string;
  name: string;
  paidAmount: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  vendor?: string;
  description?: string;
}

export async function POST(request: NextRequest) {
  console.log('\n===== PDF Parsing Request Received =====');

  try {
    const formData = await request.formData();
    const npId = formData.get('npId') as string;
    const files = formData.getAll('files') as File[];

    if (!npId) {
      return NextResponse.json(
        { error: 'NP_ID is required' },
        { status: 400 }
      );
    }

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    console.log(`Processing ${files.length} file(s) for NP_ID: ${npId}`);

    const results: ParsedData[] = [];

    // Process each PDF file
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      console.log(`\n--- Processing file ${i + 1}/${files.length}: ${file.name} ---`);

      try {
        // Convert file to buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Use LLM to extract data
        const extractedData = await parsePDFWithLLM(buffer, file.name);

        console.log('Extracted data:', extractedData);

        // Format the result
        const parsedData: ParsedData = {
          npId: npId,
          name: extractedData.description || file.name.replace('.pdf', ''),
          paidAmount: extractedData.paidAmount || '0.00',
          invoiceNumber: extractedData.invoiceNumber,
          invoiceDate: extractedData.invoiceDate,
          vendor: extractedData.vendor,
          description: extractedData.description
        };

        results.push(parsedData);
        console.log(`✓ Successfully processed ${file.name}`);

      } catch (fileError) {
        console.error(`✗ Error processing ${file.name}:`, fileError);

        // Add a fallback entry with error info
        results.push({
          npId: npId,
          name: file.name.replace('.pdf', ''),
          paidAmount: '0.00',
          description: `Error: ${fileError instanceof Error ? fileError.message : 'Unknown error'}`
        });
      }
    }

    // Generate CSV
    const csv = generateCSV(results);

    console.log(`\n===== Processing Complete =====`);
    console.log(`Total files processed: ${results.length}`);

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="parsed_capex_${npId}_${Date.now()}.csv"`
      }
    });

  } catch (error) {
    console.error('Critical error:', error);
    return NextResponse.json(
      {
        error: 'Failed to process PDFs',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Generate CSV from parsed data
 */
function generateCSV(data: ParsedData[]): string {
  const headers = [
    'NP_ID',
    'Name',
    'Paid_Amount',
    'Invoice_Number',
    'Invoice_Date',
    'Vendor',
    'Description'
  ];

  const rows = data.map(item => [
    item.npId || '',
    item.name || '',
    item.paidAmount || '0.00',
    item.invoiceNumber || '',
    item.invoiceDate || '',
    item.vendor || '',
    item.description || ''
  ]);

  // Escape CSV values
  const escapeCSV = (value: string): string => {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };

  const csvLines = [
    headers.join(','),
    ...rows.map(row => row.map(escapeCSV).join(','))
  ];

  return csvLines.join('\n');
}
