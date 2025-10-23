# Quick Start - 340B Invoice Parser Web App

Get your web app running in 5 minutes!

## Local Testing (5 minutes)

### 1. Install Dependencies (2 minutes)

```bash
# Install Node.js packages
npm install

# Install Python packages
pip install -r requirements.txt
```

### 2. Start Server (30 seconds)

```bash
npm start
```

### 3. Open Browser (10 seconds)

Visit: **http://localhost:3000**

### 4. Test Upload

- Drag a PDF invoice onto the upload area
- Click "Process Invoices"
- Download the CSV results

## Deploy to Vercel (10 minutes)

### Option 1: GitHub + Vercel Dashboard (Easiest)

1. **Create GitHub Repository**
   - Go to https://github.com/new
   - Name: `340b-invoice-parser`
   - Make it private
   - Click "Create repository"

2. **Push Code to GitHub**
   ```bash
   git remote add origin https://github.com/YOUR-USERNAME/340b-invoice-parser.git
   git branch -M main
   git push -u origin main
   ```

3. **Deploy on Vercel**
   - Go to https://vercel.com/new
   - Click "Import" next to your repository
   - Click "Deploy"
   - Done! Your app is live!

### Option 2: Vercel CLI (Fastest for developers)

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel
```

That's it! Your app is now live at: `https://your-project.vercel.app`

## Quick Commands

```bash
# Start local server
npm start

# Test the API
curl http://localhost:3000/api/health

# Deploy to Vercel
vercel --prod
```

## File Checklist

Before deploying, make sure you have:

- ✅ `package.json` - Node.js config
- ✅ `server.js` - Backend server
- ✅ `vercel.json` - Vercel config
- ✅ `public/` folder - Frontend files
- ✅ `api/` folder - Python parser
- ✅ `.gitignore` - Git ignore rules

## What You Get

- **Modern Web Interface** - Drag & drop file upload
- **Batch Processing** - Handle multiple PDFs
- **Real-time Results** - Instant data preview
- **CSV Export** - Download parsed data
- **Automatic Deployment** - Updates on every push

## Need Help?

- **Full Guide**: See [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Features**: See [README_WEBAPP.md](./README_WEBAPP.md)
- **API Docs**: See `server.js` comments

## Next Steps

1. ✅ Test locally
2. ✅ Push to GitHub
3. ✅ Deploy to Vercel
4. 🎉 Share with users!

## Pro Tips

- **Custom Domain**: Add your domain in Vercel settings
- **Environment Variables**: Set in Vercel dashboard
- **Auto Deploy**: Every push to main branch deploys automatically
- **Monitor**: Check Vercel dashboard for logs and analytics

---

**Ready to deploy?** Follow the steps above and you'll be live in 10 minutes!
