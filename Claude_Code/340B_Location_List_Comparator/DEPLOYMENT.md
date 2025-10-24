# Deployment Guide for 340B Location List Comparator

## Vercel Deployment Configuration

This project is part of a monorepo structure. Follow these steps to deploy it correctly on Vercel:

### Step 1: Verify GitHub Connection

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Git**
3. Verify the repository is connected to: `colossusofNero/340B_CrossWalk` or `colossusofNero/RCGV_CapEx_Parse`

### Step 2: Configure Environment Variables

1. Go to **Settings** → **Environment Variables**
2. Add the following variable:
   - **Name**: `CLAUDE_API_KEY`
   - **Value**: Your Claude API key (starts with `sk-ant-api03-...`)
   - **Environment**: Select Production (and Preview/Development if needed)
3. Click **Save**

### Step 3: Verify Build Configuration

The root-level `vercel.json` file is already configured to:
- Build from the `340B_Location_List_Comparator` subdirectory
- Output to `340B_Location_List_Comparator/dist`
- Handle serverless API functions at `/api/parse-pdf`

**No additional configuration is needed** - the vercel.json handles everything.

### Step 4: Deploy

1. Vercel should automatically deploy when you push to the main branch
2. If auto-deploy doesn't trigger, go to the **Deployments** tab and click **Redeploy**
3. Wait for the build to complete (usually 1-2 minutes)

### Step 5: Verify Deployment

After deployment completes:

1. Visit your deployed URL
2. Try uploading a PDF file
3. The AI parser should now work without 404 errors

### Troubleshooting

**If you still get 404 errors:**

1. Check that `CLAUDE_API_KEY` environment variable is set correctly in Vercel
2. Look at the deployment logs to see if there are any build errors
3. Verify the API endpoint is working by visiting: `https://your-domain.vercel.app/api/parse-pdf` (you should get a 405 Method Not Allowed, not 404)

**If the build fails:**

1. Check the build logs in Vercel
2. Make sure the repository has the latest code with root-level `vercel.json`
3. Verify the `340B_Location_List_Comparator` directory has a valid `package.json`

**Common Issues:**

- **"Edge Function error: 404"** - This means the old code is still deployed. Force a new deployment.
- **"Claude API key not configured"** - The environment variable is missing or incorrect.
- **"Method not allowed"** - The API endpoint exists but you're not sending a POST request (this is expected behavior).

## Project Structure

```
Claude_Code/                           # Git repository root
├── vercel.json                       # Vercel configuration (monorepo)
├── api/                              # Root-level API endpoints
│   └── parse-pdf.js                  # PDF parsing serverless function
└── 340B_Location_List_Comparator/   # Main application
    ├── api/                          # (Backup copy of API endpoint)
    │   └── parse-pdf.js
    ├── src/                          # Frontend source code
    │   ├── App.tsx
    │   └── claudeParser.ts          # API client
    ├── package.json
    ├── vercel.json                   # (Subdirectory config - not used when root vercel.json exists)
    └── vite.config.ts
```

## Environment Variables Reference

| Variable | Purpose | Required | Where to Use |
|----------|---------|----------|--------------|
| `CLAUDE_API_KEY` | Server-side Claude API authentication | Yes | Vercel Environment Variables |
| `VITE_CLAUDE_API_KEY` | Client-side (currently unused) | No | Local .env only |

## Local Development

For local development:

```bash
cd 340B_Location_List_Comparator
npm install
npm run dev
```

The local dev server runs on `http://localhost:5173`

Note: The API endpoint won't work locally without additional setup (you'd need to run it with Vercel CLI or configure a local server).
