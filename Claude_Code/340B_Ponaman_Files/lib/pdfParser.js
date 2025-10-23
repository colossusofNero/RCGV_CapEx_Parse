import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';

/**
 * Parse invoice data from PDF files using Node.js
 * No Python dependency required
 */

export async function parseInvoices(files, outputDir) {
  const results = {
    success: true,
    invoices: [],
    errors: [],
    data: []
  };

  // Parse each PDF
  for (const file of files) {
    try {
      const invoiceData = await parseSingleInvoice(file.path, file.originalname);

      if (invoiceData) {
        results.invoices.push({
          file: file.originalname,
          status: 'success'
        });
        results.data.push(invoiceData);
      } else {
        results.errors.push({
          file: file.originalname,
          error: 'Failed to extract data'
        });
      }
    } catch (error) {
      results.errors.push({
        file: file.originalname,
        error: error.message
      });
    }
  }

  // Generate CSV output
  if (results.data.length > 0) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const outputFile = path.join(outputDir, `merged_invoices_${timestamp}.csv`);

    const csvContent = generateCSV(results.data);
    fs.writeFileSync(outputFile, csvContent, 'utf-8');

    results.output_file = outputFile;
    results.total_processed = results.data.length;
  }

  return results;
}

async function parseSingleInvoice(filePath, originalName) {
  try {
    // Read PDF file
    const dataBuffer = fs.readFileSync(filePath);

    // Parse PDF
    const pdfData = await pdfParse(dataBuffer);
    const text = pdfData.text;

    if (!text || text.trim().length === 0) {
      throw new Error('No text content found in PDF');
    }

    // Extract invoice data
    const invoiceData = {
      source_file: originalName,
      parsed_date: new Date().toISOString().replace('T', ' ').split('.')[0],
      vendor_name: extractVendorName(text),
      invoice_number: extractInvoiceNumber(text),
      invoice_date: extractInvoiceDate(text),
      total: extractTotal(text),
      currency: 'USD'
    };

    return invoiceData;

  } catch (error) {
    console.error(`Error parsing ${originalName}:`, error.message);
    throw error;
  }
}

function extractVendorName(text) {
  // Try to extract vendor name from common patterns
  const lines = text.split('\n').filter(line => line.trim());

  // Look for "From:" or "Vendor:" patterns
  const vendorPatterns = [
    /(?:From|Vendor|Company|Bill From):\s*(.+?)(?:\n|$)/i,
    /^([A-Z][A-Za-z\s&,.']+(?:Inc|LLC|Corp|Ltd|Co\.?))/m
  ];

  for (const pattern of vendorPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim().substring(0, 100);
    }
  }

  // Fallback: use first substantial line (longer than 5 chars)
  const firstLine = lines.find(line => line.length > 5);
  return firstLine ? firstLine.substring(0, 100) : 'Unknown Vendor';
}

function extractInvoiceNumber(text) {
  // Common invoice number patterns
  const patterns = [
    /Invoice\s*(?:#|Number|No\.?)?\s*:?\s*([A-Z0-9][-A-Z0-9]+)/i,
    /INV[-#]?\s*([A-Z0-9][-A-Z0-9]+)/i,
    /(?:Invoice|Bill|Receipt)\s+([A-Z0-9]{3,})/i,
    /#\s*([0-9]{4,})/
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return 'N/A';
}

function extractInvoiceDate(text) {
  // Date patterns
  const patterns = [
    // MM/DD/YYYY or DD/MM/YYYY
    /(?:Invoice\s+Date|Date|Dated?):\s*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/i,
    /\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b/,
    // YYYY-MM-DD
    /\b(\d{4}[/-]\d{1,2}[/-]\d{1,2})\b/,
    // Month DD, YYYY
    /((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4})/i
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return 'N/A';
}

function extractTotal(text) {
  // Total amount patterns
  const patterns = [
    /(?:Total|Amount\s+Due|Balance\s+Due|Grand\s+Total):\s*\$?\s*([\d,]+\.?\d{0,2})/i,
    /(?:Total|Amount\s+Due|Balance\s+Due)[\s\S]{0,20}\$\s*([\d,]+\.\d{2})/i,
    /\$\s*([\d,]+\.\d{2})\s*(?:USD|Total)?$/im
  ];

  const amounts = [];

  for (const pattern of patterns) {
    const matches = text.matchAll(new RegExp(pattern.source, pattern.flags + 'g'));
    for (const match of matches) {
      if (match && match[1]) {
        const amount = parseFloat(match[1].replace(/,/g, ''));
        if (!isNaN(amount) && amount > 0) {
          amounts.push(amount);
        }
      }
    }
  }

  if (amounts.length > 0) {
    // Return the largest amount found (likely the total)
    const maxAmount = Math.max(...amounts);
    return `$${maxAmount.toFixed(2)}`;
  }

  return '$0.00';
}

function generateCSV(data) {
  if (data.length === 0) return '';

  // Get headers from first object
  const headers = Object.keys(data[0]);

  // Create CSV content
  const rows = [
    headers.join(','),
    ...data.map(row =>
      headers.map(header => {
        const value = row[header] || '';
        // Escape commas and quotes
        if (value.toString().includes(',') || value.toString().includes('"')) {
          return `"${value.toString().replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    )
  ];

  return rows.join('\n');
}

export default { parseInvoices };
