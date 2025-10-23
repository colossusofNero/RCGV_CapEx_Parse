let selectedFiles = [];
let currentJobId = null;

// DOM Elements
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const fileList = document.getElementById('fileList');
const uploadBtn = document.getElementById('uploadBtn');
const uploadSection = document.getElementById('uploadSection');
const processingSection = document.getElementById('processingSection');
const resultsSection = document.getElementById('resultsSection');
const errorSection = document.getElementById('errorSection');
const newUploadBtn = document.getElementById('newUploadBtn');
const downloadCsvBtn = document.getElementById('downloadCsvBtn');
const viewDataBtn = document.getElementById('viewDataBtn');
const dataTable = document.getElementById('dataTable');
const resultsStats = document.getElementById('resultsStats');
const errorMessage = document.getElementById('errorMessage');
const retryBtn = document.getElementById('retryBtn');

// Event Listeners
uploadArea.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', handleFileSelect);
uploadBtn.addEventListener('click', uploadFiles);
newUploadBtn.addEventListener('click', resetUpload);
retryBtn.addEventListener('click', resetUpload);
downloadCsvBtn.addEventListener('click', downloadCsv);
viewDataBtn.addEventListener('click', toggleDataView);

// Drag and drop
uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('drag-over');
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('drag-over');
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');
    const files = Array.from(e.dataTransfer.files).filter(f => f.type === 'application/pdf');
    addFiles(files);
});

function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    addFiles(files);
}

function addFiles(files) {
    // Limit to 10 files total
    const remainingSlots = 10 - selectedFiles.length;
    const filesToAdd = files.slice(0, remainingSlots);

    selectedFiles = [...selectedFiles, ...filesToAdd];
    updateFileList();
    uploadBtn.style.display = selectedFiles.length > 0 ? 'block' : 'none';
}

function removeFile(index) {
    selectedFiles.splice(index, 1);
    updateFileList();
    uploadBtn.style.display = selectedFiles.length > 0 ? 'block' : 'none';
}

function updateFileList() {
    if (selectedFiles.length === 0) {
        fileList.innerHTML = '';
        return;
    }

    fileList.innerHTML = selectedFiles.map((file, index) => `
        <div class="file-item">
            <div class="file-info">
                <span class="file-icon">📄</span>
                <div>
                    <div class="file-name">${file.name}</div>
                    <span class="file-size">${formatFileSize(file.size)}</span>
                </div>
            </div>
            <button class="file-remove" onclick="removeFile(${index})">✕</button>
        </div>
    `).join('');
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

async function uploadFiles() {
    if (selectedFiles.length === 0) return;

    // Show processing section
    uploadSection.style.display = 'none';
    processingSection.style.display = 'block';
    errorSection.style.display = 'none';

    const formData = new FormData();
    selectedFiles.forEach(file => {
        formData.append('pdfs', file);
    });

    try {
        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Upload failed');
        }

        currentJobId = data.jobId;
        await loadResults(data.jobId);

    } catch (error) {
        console.error('Upload error:', error);
        showError(error.message);
    }
}

async function loadResults(jobId) {
    try {
        const response = await fetch(`/api/results/${jobId}`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to load results');
        }

        displayResults(data);

    } catch (error) {
        console.error('Results error:', error);
        showError(error.message);
    }
}

function displayResults(data) {
    processingSection.style.display = 'none';
    resultsSection.style.display = 'block';

    // Display stats
    const stats = calculateStats(data.data);
    resultsStats.innerHTML = `
        <div class="stat-card">
            <div class="stat-value">${stats.totalInvoices}</div>
            <div class="stat-label">Invoices Processed</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${stats.totalVendors}</div>
            <div class="stat-label">Unique Vendors</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${stats.totalAmount}</div>
            <div class="stat-label">Total Amount</div>
        </div>
    `;

    // Store data for later use
    window.resultsData = data.data;
}

function calculateStats(data) {
    const vendors = new Set();
    let total = 0;

    data.forEach(row => {
        if (row.vendor_name) vendors.add(row.vendor_name);
        if (row.total) {
            const amount = parseFloat(row.total.replace(/[^0-9.-]+/g, ''));
            if (!isNaN(amount)) total += amount;
        }
    });

    return {
        totalInvoices: data.length,
        totalVendors: vendors.size,
        totalAmount: new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(total)
    };
}

function toggleDataView() {
    if (dataTable.style.display === 'none') {
        displayDataTable(window.resultsData);
        dataTable.style.display = 'block';
        viewDataBtn.textContent = 'Hide Data';
    } else {
        dataTable.style.display = 'none';
        viewDataBtn.textContent = 'View Data';
    }
}

function displayDataTable(data) {
    if (!data || data.length === 0) {
        dataTable.innerHTML = '<p>No data available</p>';
        return;
    }

    const headers = Object.keys(data[0]);

    const tableHtml = `
        <table>
            <thead>
                <tr>
                    ${headers.map(h => `<th>${h}</th>`).join('')}
                </tr>
            </thead>
            <tbody>
                ${data.map(row => `
                    <tr>
                        ${headers.map(h => `<td>${row[h] || ''}</td>`).join('')}
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

    dataTable.innerHTML = tableHtml;
}

function downloadCsv() {
    if (!currentJobId) return;
    window.location.href = `/api/download/${currentJobId}`;
}

function showError(message) {
    uploadSection.style.display = 'none';
    processingSection.style.display = 'none';
    resultsSection.style.display = 'none';
    errorSection.style.display = 'block';
    errorMessage.textContent = message;
}

function resetUpload() {
    selectedFiles = [];
    currentJobId = null;
    window.resultsData = null;

    uploadSection.style.display = 'block';
    processingSection.style.display = 'none';
    resultsSection.style.display = 'none';
    errorSection.style.display = 'none';

    fileList.innerHTML = '';
    uploadBtn.style.display = 'none';
    fileInput.value = '';
    dataTable.style.display = 'none';
    viewDataBtn.textContent = 'View Data';
}
