import express from 'express';
import multer from 'multer';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import { spawn } from 'child_process';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Create necessary directories
const uploadsDir = join(__dirname, 'uploads');
const outputsDir = join(__dirname, 'outputs');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(outputsDir)) {
  fs.mkdirSync(outputsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

// Routes
app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'public', 'index.html'));
});

app.post('/api/upload', upload.array('pdfs', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const jobId = uuidv4();
    const jobOutputDir = join(outputsDir, jobId);
    fs.mkdirSync(jobOutputDir, { recursive: true });

    // Process files with Python parser
    const results = await processInvoices(req.files, jobOutputDir);

    // Clean up uploaded files
    req.files.forEach(file => {
      try {
        fs.unlinkSync(file.path);
      } catch (err) {
        console.error(`Error deleting file ${file.path}:`, err);
      }
    });

    res.json({
      jobId,
      success: true,
      results,
      downloadUrl: `/api/download/${jobId}`
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      error: 'Failed to process invoices',
      message: error.message
    });
  }
});

app.get('/api/download/:jobId', (req, res) => {
  const { jobId } = req.params;
  const jobOutputDir = join(outputsDir, jobId);

  if (!fs.existsSync(jobOutputDir)) {
    return res.status(404).json({ error: 'Job not found' });
  }

  const files = fs.readdirSync(jobOutputDir);
  const csvFiles = files.filter(f => f.endsWith('.csv'));

  if (csvFiles.length === 0) {
    return res.status(404).json({ error: 'No results found' });
  }

  // Return the merged CSV file
  const mergedCsv = csvFiles.find(f => f.includes('merged')) || csvFiles[0];
  const filePath = join(jobOutputDir, mergedCsv);

  res.download(filePath, 'invoice_results.csv');
});

app.get('/api/results/:jobId', (req, res) => {
  const { jobId } = req.params;
  const jobOutputDir = join(outputsDir, jobId);

  if (!fs.existsSync(jobOutputDir)) {
    return res.status(404).json({ error: 'Job not found' });
  }

  const files = fs.readdirSync(jobOutputDir);
  const csvFiles = files.filter(f => f.endsWith('.csv'));

  if (csvFiles.length === 0) {
    return res.status(404).json({ error: 'No results found' });
  }

  // Read the merged CSV
  const mergedCsv = csvFiles.find(f => f.includes('merged')) || csvFiles[0];
  const filePath = join(jobOutputDir, mergedCsv);
  const csvContent = fs.readFileSync(filePath, 'utf-8');

  // Parse CSV to JSON
  const lines = csvContent.split('\n').filter(line => line.trim());
  const headers = lines[0].split(',').map(h => h.trim());
  const data = lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim());
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = values[index] || '';
    });
    return obj;
  });

  res.json({ data, files: files });
});

async function processInvoices(files, outputDir) {
  return new Promise((resolve, reject) => {
    // Use the API parser
    const scriptPath = join(__dirname, 'api', 'parse.py');

    if (!fs.existsSync(scriptPath)) {
      return reject(new Error('Parser script not found. Please ensure Python parser is available.'));
    }

    const filePaths = files.map(f => f.path).join(',');

    // Run Python parser with JSON output
    const pythonProcess = spawn('python', [
      scriptPath,
      '--files', filePaths,
      '--output', outputDir,
      '--json'
    ]);

    let output = '';
    let error = '';

    pythonProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      error += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        console.error('Python process error:', error);
        return reject(new Error(`Parser failed: ${error || 'Unknown error'}`));
      }

      try {
        const result = JSON.parse(output);
        resolve({
          message: 'Invoices processed successfully',
          fileCount: files.length,
          ...result
        });
      } catch (e) {
        console.error('Failed to parse output:', output);
        resolve({
          message: 'Invoices processed successfully',
          fileCount: files.length,
          output: output
        });
      }
    });

    // Timeout after 5 minutes
    setTimeout(() => {
      pythonProcess.kill();
      reject(new Error('Processing timeout'));
    }, 5 * 60 * 1000);
  });
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT} to use the application`);
});
