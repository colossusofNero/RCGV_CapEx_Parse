# 340B Location List Comparator

A web application for comparing 340B location lists, featuring AI-powered PDF parsing with Claude.

## Setup Instructions

### Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/colossusofNero/340B_CrossWalk.git
   cd 340B_CrossWalk
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   VITE_CLAUDE_API_KEY=your_claude_api_key_here
   CLAUDE_API_KEY=your_claude_api_key_here
   ```

   Note: You need both variables - `VITE_CLAUDE_API_KEY` for client-side (not used currently) and `CLAUDE_API_KEY` for the server-side API.

4. Run the development server:
   ```bash
   npm run dev
   ```

### Vercel Deployment

1. Connect your GitHub repository to Vercel

2. In your Vercel project settings, add the following environment variable:
   - **Variable Name**: `CLAUDE_API_KEY`
   - **Value**: Your Claude API key (starts with `sk-ant-api03-...`)

3. Deploy the application - it will automatically build and deploy when you push to the main branch

### Environment Variables

| Variable | Purpose | Required |
|----------|---------|----------|
| `CLAUDE_API_KEY` | Used by the Vercel API endpoint to call Claude AI for PDF parsing | Yes |
| `VITE_CLAUDE_API_KEY` | Client-side API key (currently not used) | No |

## Features

- AI-powered PDF parsing using Claude
- Excel to CSV conversion
- Location list comparison
- Pharmacy and Covered Entity separation
- Data validation and error checking
- Export results as JSON or printable report

## Project Structure

```
340B_Location_List_Comparator/
├── api/                    # Vercel serverless functions
│   └── parse-pdf.js       # PDF parsing endpoint
├── src/                   # Frontend source code
│   ├── App.tsx           # Main application component
│   ├── claudeParser.ts   # Claude API integration
│   └── pdfParser.ts      # Local PDF parser
├── vercel.json           # Vercel configuration
└── .env                  # Environment variables (not committed)
```
