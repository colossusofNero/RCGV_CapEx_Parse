# 340B Invoice Parser - Web Application

A modern, user-friendly web application for parsing and processing 340B invoice PDFs. Built with Node.js, Express, and vanilla JavaScript.

![Status](https://img.shields.io/badge/status-active-success.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)
![License](https://img.shields.io/badge/license-Private-blue.svg)

## Features

- **Drag & Drop Upload** - Easy file upload with drag-and-drop support
- **Batch Processing** - Process up to 10 PDFs simultaneously
- **Real-time Results** - View processing status and results instantly
- **Data Preview** - View parsed data in a clean table format
- **CSV Export** - Download results as CSV for further analysis
- **Responsive Design** - Works on desktop, tablet, and mobile devices
- **No Authentication Required** - Simple and straightforward to use

## Quick Start

### Local Development

```bash
# Install dependencies
npm install
pip install -r requirements.txt

# Start the server
npm start

# Open browser
# Visit: http://localhost:3000
```

### Deploy to Vercel

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

Quick deploy:
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel
```

## How It Works

1. **Upload PDFs** - Drag and drop or select PDF invoice files
2. **Processing** - Server extracts data using Python parsers
3. **Results** - View extracted data with statistics
4. **Download** - Export results as CSV

## Technology Stack

### Frontend
- HTML5
- CSS3 (Modern, responsive design)
- Vanilla JavaScript (No framework dependencies)

### Backend
- Node.js 18+
- Express.js
- Multer (File upload handling)

### Processing
- Python 3.8+
- PyPDF2 (PDF text extraction)
- Custom parsing logic

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Web interface |
| POST | `/api/upload` | Upload and process PDFs |
| GET | `/api/results/:jobId` | Retrieve processing results |
| GET | `/api/download/:jobId` | Download CSV file |
| GET | `/api/health` | Health check |

## File Structure

```
├── public/
│   ├── index.html      # Main web interface
│   ├── styles.css      # Styling
│   └── app.js          # Client-side logic
├── api/
│   └── parse.py        # Python parser wrapper
├── agents/             # Processing agents
├── server.js           # Express server
├── package.json        # Node.js config
├── vercel.json         # Vercel config
└── requirements.txt    # Python dependencies
```

## Configuration

### File Upload Limits

Edit `server.js`:
```javascript
const upload = multer({
  limits: {
    fileSize: 50 * 1024 * 1024,  // 50MB
    files: 10                     // Max 10 files
  }
});
```

### Port Configuration

```bash
# .env file
PORT=3000
NODE_ENV=development
```

## Usage

### 1. Upload Files
- Click "Choose Files" or drag PDFs onto the upload area
- Multiple files supported (up to 10)
- Only PDF files accepted

### 2. Process
- Click "Process Invoices" button
- Wait for processing to complete
- Processing time depends on file size and complexity

### 3. View Results
- See statistics: total invoices, vendors, amounts
- Click "View Data" to see detailed table
- Click "Download CSV" to export results

### 4. Process More
- Click "Process More Files" to start over
- Previous results are stored temporarily

## Development

### Run in Development Mode

```bash
npm run dev
```

### Test the API

```bash
# Health check
curl http://localhost:3000/api/health

# Upload file
curl -X POST http://localhost:3000/api/upload \
  -F "pdfs=@invoice.pdf"
```

### Debug Mode

Set environment variable:
```bash
DEBUG=express:* npm start
```

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Connect GitHub repo to Vercel
3. Deploy automatically on push

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

### Alternative Platforms

- **Railway**: `railway up`
- **Render**: Connect GitHub repo
- **Heroku**: `git push heroku main`
- **DigitalOcean App Platform**: Connect GitHub repo

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Performance

- **Upload Speed**: Depends on network
- **Processing**: ~2-5 seconds per PDF
- **Max File Size**: 50MB per file
- **Concurrent Users**: Scales with server capacity

## Security

- File uploads are temporary
- Files deleted after processing
- No permanent storage
- HTTPS enforced in production
- CORS enabled for cross-origin requests

## Troubleshooting

### Upload Fails
- Check file size (max 50MB)
- Verify PDF format
- Check browser console for errors

### Processing Timeout
- Large PDFs may take longer
- Check server logs
- Increase timeout in `server.js`

### No Data Extracted
- PDF may be image-based (needs OCR)
- PDF may be encrypted
- Check parser logs

### Server Won't Start
```bash
# Check if port is in use
netstat -ano | findstr :3000

# Kill process using port (Windows)
taskkill /PID <PID> /F

# Or use different port
PORT=3001 npm start
```

## Contributing

This is a private project. For internal use only.

## Roadmap

- [ ] User authentication
- [ ] File history
- [ ] Advanced filtering
- [ ] Export to Excel
- [ ] Email notifications
- [ ] OCR support for scanned PDFs
- [ ] Batch download
- [ ] Data validation rules
- [ ] Custom field extraction

## License

Private - Internal use only for 340B Ponaman Project

## Support

For issues or questions:
1. Check the [DEPLOYMENT.md](./DEPLOYMENT.md) guide
2. Review server logs
3. Test locally first
4. Contact system administrator

## Acknowledgments

- Built with Express.js and Node.js
- PDF parsing powered by PyPDF2
- UI inspired by modern design principles

---

**Made for 340B Ponaman Project**

Deployed at: [Your Vercel URL]
