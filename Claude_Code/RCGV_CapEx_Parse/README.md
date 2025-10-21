# RCGV CapEx PDF Parser

A Next.js application deployed on Vercel that extracts payment information from PDF files and exports the data as CSV.

## Features

- Upload multiple PDF files
- Input NP_ID via text field
- Automatically extracts Name and Paid_Amount from PDFs
- Exports CSV with columns: NP_ID, Name, Paid_Amount
- Beautiful, responsive UI with Tailwind CSS

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

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
5. Click "Deploy"

## Usage

1. Enter the NP_ID in the text field
2. Upload one or more PDF files containing payment information
3. Click "Parse PDFs & Export CSV"
4. The CSV file will automatically download

## CSV Output Format

The exported CSV contains three columns:
- **NP_ID**: The ID you provided in the text field
- **Name**: Extracted vendor/payee name from the PDF
- **Paid_Amount**: Extracted payment amount from the PDF

## PDF Parsing Logic

The application uses intelligent text extraction to find:
- Names: Looks for patterns like "Name:", "Vendor:", "Pay to:", or capitalized text sequences
- Amounts: Searches for currency patterns like "$1,234.56" or labeled amounts like "Total: 1234.56"

If extraction fails, the PDF filename is used as the name, and the amount defaults to 0.00.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **PDF Processing**: pdf-parse
- **Deployment**: Vercel

## License

MIT

Last updated: Tue, Oct 21, 2025  9:23:15 AM
