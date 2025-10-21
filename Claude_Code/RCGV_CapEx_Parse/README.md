# RCGV CapEx PDF Parser

A Next.js application that uses Claude AI to intelligently extract payment information from PDF files and exports the data as CSV.

## Features

- **AI-Powered Extraction**: Uses Claude 3.5 Sonnet for accurate data extraction
- **Upload multiple PDF files** (batch processing)
- **Smart field extraction**:
  - Vendor/Company Name
  - Invoice Number
  - Invoice Date
  - Description of goods/services
  - Total Amount Paid
- **Handles both text and scanned PDFs**
- **Vision support**: Analyzes PDF images when text layer is insufficient
- **Client-side validation** (file type, file size)
- **Real-time progress tracking**
- **Exports CSV** with 7 columns including NP_ID
- **Beautiful, responsive UI** with Tailwind CSS
- **Comprehensive error handling** and user feedback

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- **Anthropic API Key** (required) - Get one at https://console.anthropic.com/

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env.local` file in the root directory:
```bash
ANTHROPIC_API_KEY=your_api_key_here
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Deployment to Vercel

### Option 1: Deploy via Vercel CLI

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel
```

### Option 2: Deploy via Vercel Dashboard

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)
2. Go to [vercel.com](https://vercel.com)
3. Click "Import Project"
4. Select your repository
5. **Add environment variable**: `ANTHROPIC_API_KEY` in Vercel project settings
6. Click "Deploy"

## Usage

1. Enter the NP_ID in the text field
2. Upload one or more PDF files containing payment information
3. Click "Parse PDFs & Export CSV"
4. The CSV file will automatically download

## CSV Output Format

The exported CSV contains seven columns:
- **NP_ID**: The ID you provided in the text field
- **Name**: Extracted description of goods/services
- **Paid_Amount**: Extracted total payment amount
- **Invoice_Number**: Invoice or order number
- **Invoice_Date**: Date of invoice
- **Vendor**: Vendor or company name
- **Description**: Detailed description

## How It Works

The application uses **Claude 3.5 Sonnet** (Anthropic's latest AI model) to intelligently extract data from PDFs:

### 1. PDF Processing
- Extracts text layer from text-based PDFs
- Converts scanned PDFs to images for vision analysis
- Processes up to 5 pages per PDF

### 2. AI-Powered Extraction
- Sends PDF content (text or images) to Claude API
- Uses structured prompts to extract specific fields
- Returns data in JSON format for CSV generation

### 3. Smart Field Detection
Claude is instructed to find:
- **Vendor**: Company name, payee, vendor field
- **Invoice Number**: Invoice #, Order #, PO #, Reference #
- **Invoice Date**: Various date formats (MM/DD/YYYY, Month DD YYYY, etc.)
- **Description**: Brief description of goods/services purchased
- **Amount**: Total, Grand Total, Amount Due, Order Total (highest final amount)
- Prioritizes more specific keywords for higher confidence
- Filters out subtotals, taxes, and estimated amounts

### Phase 3: Additional Field Extraction
- **Description**: Searches for "Description:", "Purpose:", "For:", "Item:", etc.
- **Invoice Number**: Matches "Invoice #", "Inv #", "Order #", "PO #", etc.
- **Invoice Date**: Recognizes various date formats (MM/DD/YYYY, Month DD, YYYY, etc.)
- **Vendor**: Looks for "Vendor:", "Payee:", "Company:", "From:", etc.
- Searches backward and forward from amount location

### Phase 4: Intelligent Deduplication
- Detects duplicate amounts on consecutive pages
- Keeps highest confidence match
- Prevents double-counting of multi-page invoices

### Phase 5: OCR Fallback with Auto-Rotation
- Activates when text layer is insufficient
- Converts PDF pages to images
- Tests multiple rotations (0°, 90°, 180°, 270°)
- Scores results based on money amounts and keywords
- Selects best orientation automatically
- Processes up to 10 pages

If extraction fails, the PDF filename is used as the name, and the amount defaults to 0.00.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **PDF Processing**:
  - pdf-parse (text extraction)
  - pdfjs-dist (PDF rendering)
  - tesseract.js (OCR)
  - @napi-rs/canvas (image rendering)
- **Testing**: Jest, React Testing Library
- **Linting**: ESLint
- **Deployment**: Vercel

## Configuration

The application is configured in `vercel.json` for optimal Vercel deployment:
- Memory: 1024MB
- Timeout: 30 seconds
- Suitable for processing multiple PDFs with OCR

## License

MIT

Last updated: Tue, Oct 21, 2025  9:23:15 AM
