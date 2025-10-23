# Deployment Guide - 340B Invoice Parser Web App

## Overview

This guide will help you deploy the 340B Invoice Parser as a web application using GitHub and Vercel.

## Prerequisites

1. **GitHub Account** - [Sign up here](https://github.com/signup)
2. **Vercel Account** - [Sign up here](https://vercel.com/signup) (can use GitHub login)
3. **Git** installed on your computer
4. **Node.js** 18+ installed

## Step 1: Test Locally

Before deploying, test the application locally:

```bash
# Install Node.js dependencies
npm install

# Install Python dependencies
pip install -r requirements.txt

# Start the development server
npm start
```

Visit `http://localhost:3000` to test the application.

## Step 2: Create GitHub Repository

### Option A: Using GitHub Desktop (Easier)

1. Download and install [GitHub Desktop](https://desktop.github.com/)
2. Open GitHub Desktop
3. Click "File" → "Add Local Repository"
4. Browse to: `C:\Users\scott\Claude_Code\340B_Ponaman_Files`
5. Click "Create a new repository"
6. Fill in:
   - **Name**: `340b-invoice-parser`
   - **Description**: `Web-based 340B invoice parsing system`
   - **Keep this code private** (check if you want it private)
7. Click "Create Repository"
8. Click "Publish repository" to push to GitHub

### Option B: Using Command Line

```bash
# Initialize git repository (if not already done)
git init

# Add all files
git add .

# Commit the files
git commit -m "Initial commit: 340B Invoice Parser web app"

# Create repository on GitHub
# Go to https://github.com/new
# Create a new repository named: 340b-invoice-parser

# Add GitHub remote (replace YOUR-USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR-USERNAME/340b-invoice-parser.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## Step 3: Deploy to Vercel

### Using Vercel Dashboard (Recommended)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New..." → "Project"
3. Click "Import" next to your GitHub repository
4. Configure the project:
   - **Framework Preset**: Other
   - **Root Directory**: `./` (leave as default)
   - **Build Command**: Leave empty
   - **Output Directory**: Leave empty
   - **Install Command**: `npm install`
5. Click "Deploy"
6. Wait 2-3 minutes for deployment to complete
7. Your app will be live at `https://your-project.vercel.app`

### Using Vercel CLI (Alternative)

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Follow the prompts:
# - Link to existing project? No
# - Project name: 340b-invoice-parser
# - Directory: ./
# - Deploy? Yes

# For production deployment
vercel --prod
```

## Step 4: Configure Environment (Optional)

If you need environment variables (like Google Drive credentials):

1. Go to your Vercel project dashboard
2. Click "Settings" → "Environment Variables"
3. Add variables:
   - `NODE_ENV`: `production`
   - `PORT`: `3000` (optional, Vercel handles this)

## Project Structure

```
340B_Ponaman_Files/
├── public/                 # Frontend files
│   ├── index.html         # Main HTML page
│   ├── styles.css         # Styling
│   └── app.js             # Client-side JavaScript
├── api/                   # API endpoints
│   └── parse.py           # Python parser wrapper
├── agents/                # Python processing agents
│   ├── L1_parser/
│   ├── L2_integrator/
│   └── L3_uploader/
├── server.js              # Express server
├── package.json           # Node.js dependencies
├── vercel.json           # Vercel configuration
├── requirements.txt       # Python dependencies
└── .gitignore            # Git ignore rules
```

## Features

### Web Interface
- Drag-and-drop file upload
- Multiple PDF support (up to 10 files)
- Real-time processing status
- Results preview with statistics
- CSV download

### API Endpoints
- `POST /api/upload` - Upload and process PDFs
- `GET /api/results/:jobId` - Get processing results
- `GET /api/download/:jobId` - Download CSV results
- `GET /api/health` - Health check

## Updating the Deployment

After making changes to your code:

### Using GitHub Desktop
1. Open GitHub Desktop
2. Review your changes
3. Write a commit message
4. Click "Commit to main"
5. Click "Push origin"
6. Vercel will automatically redeploy

### Using Command Line
```bash
git add .
git commit -m "Description of changes"
git push origin main
```

Vercel automatically deploys when you push to GitHub!

## Custom Domain (Optional)

To use your own domain:

1. Go to Vercel project dashboard
2. Click "Settings" → "Domains"
3. Add your domain
4. Follow DNS configuration instructions
5. Wait for DNS propagation (can take 24-48 hours)

## Monitoring

### View Logs
1. Go to Vercel dashboard
2. Select your project
3. Click "Deployments"
4. Click on a deployment
5. Click "Runtime Logs"

### Check Status
Visit: `https://your-project.vercel.app/api/health`

## Troubleshooting

### Build Fails
- Check that all files are committed to Git
- Verify `package.json` is correct
- Check Vercel build logs for errors

### Upload Not Working
- Verify file size limits (50MB max)
- Check that Python is available in Vercel environment
- Review runtime logs in Vercel dashboard

### Python Dependencies
Note: Vercel has limited Python support. For production use with Python:
- Consider using Vercel Serverless Functions with Python
- Or deploy Python backend separately (Railway, Render, etc.)
- Or convert Python parser to Node.js

## Alternative: Node.js Only Deployment

For a simpler deployment without Python:

1. Replace Python PDF parsing with Node.js libraries:
   - `pdf-parse` - PDF text extraction
   - `pdfjs-dist` - More advanced PDF parsing

2. Update `server.js` to use Node.js PDF parser instead of spawning Python

## Production Considerations

1. **Rate Limiting**: Add rate limiting to prevent abuse
2. **Authentication**: Add user authentication for production
3. **File Cleanup**: Implement automatic cleanup of old files
4. **Error Handling**: Enhanced error reporting
5. **Monitoring**: Set up uptime monitoring
6. **Backups**: Regular backups of processed data

## Support

For issues:
1. Check Vercel deployment logs
2. Review browser console for frontend errors
3. Test API endpoints individually
4. Verify all dependencies are installed

## Next Steps

After deployment:
1. Test with sample PDFs
2. Share the URL with users
3. Monitor usage and performance
4. Collect feedback for improvements
5. Set up custom domain (optional)

## Resources

- [Vercel Documentation](https://vercel.com/docs)
- [GitHub Documentation](https://docs.github.com)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

## Security Notes

1. Never commit `service_account.json` to GitHub
2. Use environment variables for sensitive data
3. Keep dependencies updated
4. Enable GitHub security alerts
5. Use HTTPS only (Vercel provides this automatically)

---

**Your app URL after deployment:**
`https://340b-invoice-parser-YOUR-USERNAME.vercel.app`

Replace `YOUR-USERNAME` with your actual Vercel username or custom URL.
