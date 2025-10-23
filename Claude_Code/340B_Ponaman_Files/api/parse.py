#!/usr/bin/env python3
"""
Simple API wrapper for invoice parsing
Can be called from Node.js or used as a standalone script
"""

import sys
import json
import os
from pathlib import Path
import argparse
import csv
from datetime import datetime

# Add the agents directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'agents'))

try:
    from L1_parser import invoice_parser
except ImportError:
    print(json.dumps({"error": "Parser module not found"}), file=sys.stderr)
    sys.exit(1)


def parse_invoices(pdf_paths, output_dir):
    """
    Parse multiple PDF invoices and generate CSV output

    Args:
        pdf_paths: List of PDF file paths
        output_dir: Directory to save output files

    Returns:
        Dictionary with results
    """
    results = {
        "success": True,
        "invoices": [],
        "errors": [],
        "output_file": None
    }

    # Ensure output directory exists
    os.makedirs(output_dir, exist_ok=True)

    # Parse each PDF
    all_data = []
    for pdf_path in pdf_paths:
        try:
            # Check if file exists
            if not os.path.exists(pdf_path):
                results["errors"].append({
                    "file": pdf_path,
                    "error": "File not found"
                })
                continue

            # Parse the invoice (you'll need to adapt this based on your actual parser)
            invoice_data = parse_single_invoice(pdf_path)

            if invoice_data:
                all_data.append(invoice_data)
                results["invoices"].append({
                    "file": os.path.basename(pdf_path),
                    "status": "success"
                })
            else:
                results["errors"].append({
                    "file": os.path.basename(pdf_path),
                    "error": "Failed to extract data"
                })

        except Exception as e:
            results["errors"].append({
                "file": os.path.basename(pdf_path),
                "error": str(e)
            })

    # Generate CSV output
    if all_data:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_file = os.path.join(output_dir, f"merged_invoices_{timestamp}.csv")

        # Write CSV
        with open(output_file, 'w', newline='', encoding='utf-8') as f:
            if all_data:
                writer = csv.DictWriter(f, fieldnames=all_data[0].keys())
                writer.writeheader()
                writer.writerows(all_data)

        results["output_file"] = output_file
        results["total_processed"] = len(all_data)

    return results


def parse_single_invoice(pdf_path):
    """
    Parse a single PDF invoice

    This is a placeholder - adapt based on your actual parser implementation
    """
    try:
        import PyPDF2

        # Extract text from PDF
        text = ""
        with open(pdf_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            for page in pdf_reader.pages:
                text += page.extract_text()

        # Basic extraction logic (you should enhance this)
        invoice_data = {
            "source_file": os.path.basename(pdf_path),
            "parsed_date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "vendor_name": extract_vendor_name(text),
            "invoice_number": extract_invoice_number(text),
            "invoice_date": extract_invoice_date(text),
            "total": extract_total(text),
            "currency": "USD"
        }

        return invoice_data

    except Exception as e:
        print(f"Error parsing {pdf_path}: {e}", file=sys.stderr)
        return None


def extract_vendor_name(text):
    """Extract vendor name from text"""
    # Simple extraction - enhance based on your needs
    lines = text.split('\n')
    if lines:
        return lines[0].strip()[:100]  # First line, max 100 chars
    return "Unknown"


def extract_invoice_number(text):
    """Extract invoice number from text"""
    import re
    # Look for patterns like "Invoice #123" or "INV-123"
    patterns = [
        r'Invoice\s*#?\s*(\w+[-/]?\w+)',
        r'INV[-/]?\s*(\w+)',
        r'Invoice\s+Number\s*:?\s*(\w+[-/]?\w+)'
    ]

    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return match.group(1)

    return "N/A"


def extract_invoice_date(text):
    """Extract invoice date from text"""
    import re
    # Look for date patterns
    date_patterns = [
        r'\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b',
        r'\b(\d{4}[/-]\d{1,2}[/-]\d{1,2})\b'
    ]

    for pattern in date_patterns:
        match = re.search(pattern, text)
        if match:
            return match.group(1)

    return "N/A"


def extract_total(text):
    """Extract total amount from text"""
    import re
    # Look for patterns like "Total: $1,234.56" or "$1234.56"
    patterns = [
        r'Total\s*:?\s*\$?\s*([\d,]+\.?\d*)',
        r'Amount\s+Due\s*:?\s*\$?\s*([\d,]+\.?\d*)',
        r'\$\s*([\d,]+\.\d{2})\b'
    ]

    for pattern in patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        if matches:
            # Return the largest amount found
            amounts = [float(m.replace(',', '')) for m in matches]
            return f"${max(amounts):.2f}"

    return "0.00"


def main():
    parser = argparse.ArgumentParser(description='Parse invoice PDFs')
    parser.add_argument('--files', required=True, help='Comma-separated list of PDF files')
    parser.add_argument('--output', required=True, help='Output directory')
    parser.add_argument('--json', action='store_true', help='Output results as JSON')

    args = parser.parse_args()

    # Parse file list
    pdf_files = [f.strip() for f in args.files.split(',')]

    # Process invoices
    results = parse_invoices(pdf_files, args.output)

    # Output results
    if args.json:
        print(json.dumps(results, indent=2))
    else:
        print(f"Processed {len(results['invoices'])} invoices")
        if results['errors']:
            print(f"Errors: {len(results['errors'])}")
        if results['output_file']:
            print(f"Output saved to: {results['output_file']}")

    # Exit with error code if there were failures
    if results['errors'] and not results['invoices']:
        sys.exit(1)


if __name__ == '__main__':
    main()
