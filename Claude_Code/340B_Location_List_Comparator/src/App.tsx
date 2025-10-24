import { useState } from 'react';
import { Upload, AlertCircle, CheckCircle, XCircle, ArrowRight, Download, Printer, FileText } from 'lucide-react';
import * as XLSX from 'xlsx';
import { parsePDF, downloadCSV as downloadParsedCSV } from './pdfParser';
import { parseWithClaude } from './claudeParser';

export default function ListComparator() {
  const [pdfList, setPdfList] = useState([]);
  const [rulingList, setRulingList] = useState([]);
  const [pdfHeaders, setPdfHeaders] = useState([]);
  const [rulingHeaders, setRulingHeaders] = useState([]);
  const [columnMapping, setColumnMapping] = useState({
    id: { pdf: '', ruling: '' },
    hrsaId: { pdf: '', ruling: '' },
    address: { pdf: '', ruling: '' },
    city: { pdf: '', ruling: '' },
    state: { pdf: '', ruling: '' },
    zip: { pdf: '', ruling: '' }
  });
  const [comparison, setComparison] = useState(null);
  const [showMapping, setShowMapping] = useState(false);
  const [excelData, setExcelData] = useState('');
  const [excelStatus, setExcelStatus] = useState('');
  const [pdfParserStatus, setPdfParserStatus] = useState('');
  const [parsedData, setParsedData] = useState<any>(null);
  const [clientListErrors, setClientListErrors] = useState<string[]>([]);
  const [clientListSeparated, setClientListSeparated] = useState<{pharmacies: any[], coveredEntities: any[]} | null>(null);
  const [useClaudeParser, setUseClaudeParser] = useState<boolean>(true);

  const handlePDFUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

    setPdfParserStatus('Loading PDF...');
    setParsedData(null);

    try {
      if (useClaudeParser) {
        const arrayBuffer = await file.arrayBuffer();
        const base64 = btoa(
          new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
        );

        const result = await parseWithClaude(base64, supabaseUrl, (progress) => {
          setPdfParserStatus(progress);
        });

        const pharmacyLines = ['Name,Address,City,State,Zip'];
        result.pharmacies.forEach(p => {
          pharmacyLines.push(`"${p.name}","${p.address}","${p.city}","${p.state}","${p.zip}"`);
        });

        const entityLines = ['Name,Address,City,State,Zip'];
        result.coveredEntities.forEach(e => {
          entityLines.push(`"${e.name}","${e.address}","${e.city}","${e.state}","${e.zip}"`);
        });

        const pharmacyCsv = pharmacyLines.join('\n');
        const entityCsv = entityLines.join('\n');

        setParsedData({
          success: true,
          stats: {
            totalPharmacies: result.pharmacies.length,
            totalCoveredEntities: result.coveredEntities.length
          },
          pharmacyCsv: pharmacyCsv,
          entityCsv: entityCsv
        });

        setPdfParserStatus(`✓ AI Parsing complete! Found ${result.pharmacies.length} pharmacies and ${result.coveredEntities.length} covered entities.`);
      } else {
        const result = await parsePDF(file, (progress) => {
          setPdfParserStatus(progress);
        });

        if (result.success) {
          setParsedData(result);
          setPdfParserStatus(`✓ Parsing complete! Processed all pages and found ${result.stats.totalPharmacies} pharmacies and ${result.stats.totalCoveredEntities} covered entities.`);
        } else {
          setPdfParserStatus(`Error: ${result.error}`);
        }
      }
    } catch (error: any) {
      console.error('PDF upload error:', error);
      setPdfParserStatus(`Error: ${error.message || 'Failed to parse PDF'}`);
    }
  };

  const handleDownloadPharmacyCSV = () => {
    if (parsedData?.pharmacyCsv) {
      downloadParsedCSV(parsedData.pharmacyCsv, 'pharmacies.csv');
    }
  };

  const handleDownloadEntityCSV = () => {
    if (parsedData?.entityCsv) {
      downloadParsedCSV(parsedData.entityCsv, 'covered_entities.csv');
    }
  };

  const parseCSV = (text) => {
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const data = lines.slice(1).map(line => {
      const values = [];
      let current = '';
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim());

      const obj = {};
      headers.forEach((header, idx) => {
        obj[header] = values[idx] || '';
      });
      return obj;
    });

    return { headers, data };
  };


  const handleExcelUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setExcelStatus('Reading Excel file...');

    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const csvString = XLSX.utils.sheet_to_csv(firstSheet);

      setExcelData(csvString);
      setExcelStatus('✓ Excel file converted successfully!');
    } catch (error) {
      console.error('Excel parsing error:', error);
      setExcelStatus('Error reading Excel file. Please ensure it\'s a valid Excel file.');
    }
  };

  const downloadExcelAsCSV = () => {
    const blob = new Blob([excelData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'converted_excel.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadJSON = () => {
    if (!comparison) return;

    const jsonData = {
      generatedAt: new Date().toISOString(),
      summary: {
        totalMatches: comparison.matches.length,
        totalMismatches: comparison.mismatches.length,
        totalOnlyInFirstList: comparison.onlyInPDF.length,
        totalOnlyInSecondList: comparison.onlyInRuling.length
      },
      columnMapping: columnMapping,
      matches: comparison.matches,
      mismatches: comparison.mismatches,
      onlyInFirstList: comparison.onlyInPDF,
      onlyInSecondList: comparison.onlyInRuling
    };

    const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `comparison-results-${new Date().toISOString().split('T')[0]}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const printReport = () => {
    if (!comparison) return;

    const printWindow = window.open('', '_blank');
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>340B Location Comparison Report</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; max-width: 1200px; margin: 0 auto; }
          h1 { color: #1f2937; border-bottom: 3px solid #3b82f6; padding-bottom: 10px; }
          h2 { color: #374151; margin-top: 30px; }
          .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin: 20px 0; }
          .summary-card { border: 2px solid #e5e7eb; padding: 15px; border-radius: 8px; text-align: center; }
          .summary-card h3 { margin: 0 0 10px 0; font-size: 14px; }
          .summary-card .number { font-size: 36px; font-weight: bold; margin: 10px 0; }
          .matches { color: #059669; border-color: #d1fae5; background-color: #f0fdf4; }
          .mismatches { color: #d97706; border-color: #fef3c7; background-color: #fffbeb; }
          .extras { color: #dc2626; border-color: #fecaca; background-color: #fef2f2; }
          .detail-section { margin: 30px 0; }
          .item { border: 1px solid #e5e7eb; padding: 15px; margin: 10px 0; border-radius: 4px; background-color: #f9fafb; }
          .item-header { font-weight: bold; font-size: 16px; margin-bottom: 8px; }
          .issue { margin: 8px 0; padding-left: 15px; border-left: 4px solid #fbbf24; }
          .issue-label { font-weight: bold; font-size: 12px; color: #6b7280; }
          @media print {
            body { padding: 10px; }
            .summary { page-break-inside: avoid; }
            .item { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <h1>340B Location List Comparison Report</h1>
        <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>

        <div class="summary">
          <div class="summary-card matches">
            <h3>Perfect Matches</h3>
            <div class="number">${comparison.matches.length}</div>
          </div>
          <div class="summary-card mismatches">
            <h3>Mismatches</h3>
            <div class="number">${comparison.mismatches.length}</div>
          </div>
          <div class="summary-card extras">
            <h3>Extra Locations</h3>
            <div class="number">${comparison.onlyInPDF.length + comparison.onlyInRuling.length}</div>
          </div>
        </div>

        ${comparison.mismatches.length > 0 ? `
        <div class="detail-section">
          <h2>Data Mismatches (${comparison.mismatches.length})</h2>
          ${comparison.mismatches.map(mismatch => `
            <div class="item">
              <div class="item-header">Location: ${mismatch.id}</div>
              ${mismatch.issues.map(issue => `
                <div class="issue">
                  <div class="issue-label">${issue.field} Mismatch:</div>
                  <div><strong>PDF:</strong> ${issue.pdf}</div>
                  <div><strong>Ruling:</strong> ${issue.ruling}</div>
                </div>
              `).join('')}
            </div>
          `).join('')}
        </div>
        ` : ''}

        ${comparison.onlyInPDF.length > 0 ? `
        <div class="detail-section">
          <h2>Only in PDF List (${comparison.onlyInPDF.length})</h2>
          ${comparison.onlyInPDF.map(item => `
            <div class="item">
              <div class="item-header">${item.id}</div>
              <div>${item.item[columnMapping.address.pdf]}, ${item.item[columnMapping.city?.pdf]} ${item.item[columnMapping.zip.pdf]}</div>
            </div>
          `).join('')}
        </div>
        ` : ''}

        ${comparison.onlyInRuling.length > 0 ? `
        <div class="detail-section">
          <h2>Only in Ruling List (${comparison.onlyInRuling.length})</h2>
          ${comparison.onlyInRuling.map(item => `
            <div class="item">
              <div class="item-header">${item.id}</div>
              <div>${item.item[columnMapping.address.ruling]}, ${item.item[columnMapping.city?.ruling]} ${item.item[columnMapping.zip.ruling]}</div>
            </div>
          `).join('')}
        </div>
        ` : ''}
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };


  const validateAndSeparateClientList = (data: any[], headers: string[]) => {
    const errors: string[] = [];
    const pharmacies: any[] = [];
    const coveredEntities: any[] = [];

    const hasNameColumn = headers.some(h => h.toLowerCase().includes('name'));
    const hasAddressColumn = headers.some(h => h.toLowerCase().includes('address'));
    const hasCityColumn = headers.some(h => h.toLowerCase().includes('city'));
    const hasStateColumn = headers.some(h => h.toLowerCase().includes('state') || h.toLowerCase() === 'st');
    const hasZipColumn = headers.some(h => h.toLowerCase().includes('zip'));

    if (!hasAddressColumn) errors.push('Missing address column');
    if (!hasCityColumn) errors.push('Missing city column');
    if (!hasStateColumn) errors.push('Missing state column');
    if (!hasZipColumn) errors.push('Missing zip column');

    data.forEach((row, index) => {
      let hasError = false;

      const addressValue = Object.entries(row).find(([key]) => key.toLowerCase().includes('address'))?.[1];
      const cityValue = Object.entries(row).find(([key]) => key.toLowerCase().includes('city'))?.[1];
      const stateValue = Object.entries(row).find(([key]) => key.toLowerCase().includes('state') || key.toLowerCase() === 'st')?.[1];
      const zipValue = Object.entries(row).find(([key]) => key.toLowerCase().includes('zip'))?.[1];

      if (!addressValue || String(addressValue).trim().length < 3) {
        errors.push(`Row ${index + 2}: Missing or invalid address`);
        hasError = true;
      }
      if (!cityValue || String(cityValue).trim().length < 2) {
        errors.push(`Row ${index + 2}: Missing or invalid city`);
        hasError = true;
      }
      if (!stateValue || String(stateValue).trim().length < 2) {
        errors.push(`Row ${index + 2}: Missing or invalid state`);
        hasError = true;
      }
      if (!zipValue || !/\d{5}/.test(String(zipValue))) {
        errors.push(`Row ${index + 2}: Missing or invalid zip code`);
        hasError = true;
      }

      if (!hasError) {
        const nameValue = Object.entries(row).find(([key]) => key.toLowerCase().includes('name'))?.[1];
        const rowStr = JSON.stringify(row).toLowerCase();

        if (rowStr.includes('pharmacy') || rowStr.includes('rx') || rowStr.includes('drug')) {
          pharmacies.push(row);
        } else if (rowStr.includes('covered entity') || rowStr.includes('std') || rowStr.includes('hospital') || rowStr.includes('clinic') || rowStr.includes('health center')) {
          coveredEntities.push(row);
        } else if (nameValue && /^\d{4,5}$/.test(String(nameValue).trim())) {
          pharmacies.push(row);
        } else {
          coveredEntities.push(row);
        }
      }
    });

    return { errors, pharmacies, coveredEntities };
  };

  const handleFileUpload = (e, listType) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const { headers, data } = parseCSV(event.target.result);

        if (listType === 'pdf') {
          const validation = validateAndSeparateClientList(data, headers);

          setClientListErrors(validation.errors);
          setClientListSeparated({
            pharmacies: validation.pharmacies,
            coveredEntities: validation.coveredEntities
          });

          setPdfHeaders(headers);
          setPdfList(data);
        } else {
          setRulingHeaders(headers);
          setRulingList(data);
        }
      };
      reader.readAsText(file);
    }
  };

  const updateMapping = (field, listType, value) => {
    setColumnMapping(prev => ({
      ...prev,
      [field]: {
        ...prev[field],
        [listType]: value
      }
    }));
  };

  const normalizeAddress = (addr) => {
    return addr.toUpperCase()
      .replace(/\./g, '')
      .replace(/\s+/g, ' ')
      .replace(/STREET/g, 'ST')
      .replace(/ROAD/g, 'RD')
      .replace(/AVENUE/g, 'AVE')
      .replace(/BOULEVARD/g, 'BLVD')
      .replace(/DRIVE/g, 'DR')
      .replace(/PARKWAY/g, 'PKWY')
      .replace(/SUITE/g, 'STE')
      .trim();
  };

  const compareList = () => {
    if (pdfList.length === 0 || rulingList.length === 0) return;

    const hasStoreId = columnMapping.id.pdf && columnMapping.id.ruling;
    const hasHrsaId = columnMapping.hrsaId.pdf && columnMapping.hrsaId.ruling;

    if (!hasStoreId && !hasHrsaId) {
      alert('Please map either Store/Location ID or 340B ID/HRSA ID for both lists');
      return;
    }

    if (!columnMapping.address.pdf || !columnMapping.address.ruling) {
      alert('Please map the address field for both lists');
      return;
    }

    if (!columnMapping.zip.pdf || !columnMapping.zip.ruling) {
      alert('Please map the zip code field for both lists');
      return;
    }

    const results = {
      matches: [],
      mismatches: [],
      onlyInPDF: [],
      onlyInRuling: []
    };

    const pdfKeys = pdfList.map(item => {
      const storeId = item[columnMapping.id.pdf]?.toString().trim() || '';
      const hrsaId = item[columnMapping.hrsaId.pdf]?.toString().trim() || '';
      return { storeId, hrsaId };
    });

    const rulingKeys = rulingList.map(item => {
      const storeId = item[columnMapping.id.ruling]?.toString().trim() || '';
      const hrsaId = item[columnMapping.hrsaId.ruling]?.toString().trim() || '';
      return { storeId, hrsaId };
    });

    pdfList.forEach(pdfItem => {
      const pdfStoreId = (pdfItem[columnMapping.id.pdf] || '').toString().trim();
      const pdfHrsaId = (pdfItem[columnMapping.hrsaId.pdf] || '').toString().trim();

      const rulingItem = rulingList.find(r => {
        const rStoreId = (r[columnMapping.id.ruling] || '').toString().trim();
        const rHrsaId = (r[columnMapping.hrsaId.ruling] || '').toString().trim();

        if (hasStoreId && pdfStoreId && rStoreId && pdfStoreId === rStoreId) {
          return true;
        }

        if (hasHrsaId && pdfHrsaId && rHrsaId && pdfHrsaId === rHrsaId) {
          return true;
        }

        return false;
      });

      const displayId = pdfHrsaId || pdfStoreId || 'N/A';

      if (rulingItem) {
        const issues = [];

        const pdfAddr = normalizeAddress(pdfItem[columnMapping.address.pdf] || '');
        const rulingAddr = normalizeAddress(rulingItem[columnMapping.address.ruling] || '');

        if (pdfAddr !== rulingAddr) {
          issues.push({
            field: 'Address',
            pdf: pdfItem[columnMapping.address.pdf] || '',
            ruling: rulingItem[columnMapping.address.ruling] || ''
          });
        }

        const pdfZip = (pdfItem[columnMapping.zip.pdf] || '').toString().trim();
        const rulingZip = (rulingItem[columnMapping.zip.ruling] || '').toString().trim();

        if (pdfZip !== rulingZip) {
          issues.push({
            field: 'Zip Code',
            pdf: pdfZip,
            ruling: rulingZip
          });
        }

        if (columnMapping.city.pdf && columnMapping.city.ruling) {
          const pdfCity = (pdfItem[columnMapping.city.pdf] || '').toUpperCase().trim();
          const rulingCity = (rulingItem[columnMapping.city.ruling] || '').toUpperCase().trim();

          if (pdfCity && rulingCity && pdfCity !== rulingCity) {
            issues.push({
              field: 'City',
              pdf: pdfItem[columnMapping.city.pdf] || '',
              ruling: rulingItem[columnMapping.city.ruling] || ''
            });
          }
        }

        if (issues.length > 0) {
          results.mismatches.push({
            id: displayId,
            issues,
            pdfItem,
            rulingItem
          });
        } else {
          results.matches.push({ id: displayId, pdfItem, rulingItem });
        }
      } else {
        results.onlyInPDF.push({ id: displayId, item: pdfItem });
      }
    });

    rulingList.forEach(rulingItem => {
      const rulingStoreId = (rulingItem[columnMapping.id.ruling] || '').toString().trim();
      const rulingHrsaId = (rulingItem[columnMapping.hrsaId.ruling] || '').toString().trim();
      const rulingDisplayId = rulingHrsaId || rulingStoreId || 'N/A';

      const foundInPdf = pdfKeys.some(pdfKey => {
        if (hasStoreId && rulingStoreId && pdfKey.storeId && pdfKey.storeId === rulingStoreId) {
          return true;
        }
        if (hasHrsaId && rulingHrsaId && pdfKey.hrsaId && pdfKey.hrsaId === rulingHrsaId) {
          return true;
        }
        return false;
      });

      if (!foundInPdf) {
        results.onlyInRuling.push({ id: rulingDisplayId, item: rulingItem });
      }
    });

    setComparison(results);
    setShowMapping(false);
  };

  const canProceedToMapping = pdfList.length > 0 && rulingList.length > 0;

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
      <h1 className="text-4xl font-bold mb-2 text-gray-800 text-center">Ponaman HC</h1>
      <h2 className="text-3xl font-bold mb-6 text-gray-800">340B Location List Comparator</h2>

      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <div className="flex items-center gap-3 mb-4">
          <FileText className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-800">PDF Parser (AI-Powered)</h2>
        </div>

        <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-blue-800">Claude AI Parser Enabled</h3>
          </div>
          <p className="text-sm text-blue-700">
            Using advanced AI to accurately extract all location data from complex PDF tables. This ensures all records are captured correctly, including data from multi-page tables.
          </p>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Upload a 340B PDF to extract Name, Street Address, City, State, and Zip Code.
          Pharmacies and Covered Entities will be separated into two lists with accuracy verification.
        </p>

        <label className="flex items-center justify-center w-full h-32 px-4 transition bg-white border-2 border-gray-300 border-dashed rounded-lg hover:border-blue-500 cursor-pointer mb-4">
          <div className="flex flex-col items-center space-y-2">
            <FileText className="w-8 h-8 text-gray-400" />
            <span className="text-sm text-gray-600">Click to upload PDF file</span>
          </div>
          <input type="file" className="hidden" accept=".pdf" onChange={handlePDFUpload} />
        </label>

        {pdfParserStatus && (
          <div className={`p-4 rounded mb-4 ${pdfParserStatus.includes('✓') ? 'bg-green-50 text-green-700 border border-green-200' : pdfParserStatus.includes('Error') ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
            {pdfParserStatus}
          </div>
        )}

        {parsedData && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">Pharmacies</h3>
                <p className="text-3xl font-bold text-blue-600">{parsedData.stats.totalPharmacies}</p>
              </div>
              <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                <h3 className="font-semibold text-green-800 mb-2">Covered Entities</h3>
                <p className="text-3xl font-bold text-green-600">{parsedData.stats.totalCoveredEntities}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={handleDownloadPharmacyCSV}
                className="bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2"
              >
                <Download size={20} />
                Download Pharmacies CSV
              </button>
              <button
                onClick={handleDownloadEntityCSV}
                className="bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition flex items-center justify-center gap-2"
              >
                <Download size={20} />
                Download Covered Entities CSV
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Client List</h2>

          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              The Client list needs to double check the parser for errors and separate Covered Entities from Pharmacy Locations
            </p>
          </div>

          <label className="flex items-center justify-center w-full h-32 px-4 transition bg-white border-2 border-gray-300 border-dashed rounded-lg hover:border-blue-400 cursor-pointer">
            <div className="flex flex-col items-center space-y-2">
              <Upload className="w-8 h-8 text-gray-400" />
              <span className="text-sm text-gray-600">Upload CSV File</span>
            </div>
            <input type="file" className="hidden" accept=".csv" onChange={(e) => handleFileUpload(e, 'pdf')} />
          </label>

          {clientListErrors.length > 0 && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="font-semibold text-red-800 mb-2 flex items-center gap-2">
                <AlertCircle size={18} />
                Validation Errors Found ({clientListErrors.length})
              </h3>
              <div className="max-h-32 overflow-y-auto">
                <ul className="text-xs text-red-700 space-y-1">
                  {clientListErrors.slice(0, 10).map((error, idx) => (
                    <li key={idx}>• {error}</li>
                  ))}
                  {clientListErrors.length > 10 && (
                    <li className="font-semibold">...and {clientListErrors.length - 10} more errors</li>
                  )}
                </ul>
              </div>
            </div>
          )}

          {pdfList.length > 0 && (
            <div className="mt-4">
              <p className="text-sm text-green-600 font-semibold">✓ {pdfList.length} total records loaded</p>
              <p className="text-xs text-gray-500 mt-1">Headers: {pdfHeaders.join(', ')}</p>

              {clientListSeparated && (
                <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="font-semibold text-blue-800 mb-2">Records Separated:</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-white p-2 rounded">
                      <span className="text-gray-600">Pharmacies:</span>
                      <span className="ml-2 font-bold text-blue-700">{clientListSeparated.pharmacies.length}</span>
                    </div>
                    <div className="bg-white p-2 rounded">
                      <span className="text-gray-600">Covered Entities:</span>
                      <span className="ml-2 font-bold text-green-700">{clientListSeparated.coveredEntities.length}</span>
                    </div>
                  </div>
                  {clientListErrors.length === 0 && (
                    <p className="text-xs text-green-700 mt-2 flex items-center gap-1">
                      <CheckCircle size={14} />
                      All records passed validation
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">OPAIS List</h2>

          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="font-semibold text-yellow-800 mb-2">Important Instructions:</h3>
            <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
              <li>The Store Number needs to be in its own column separate from Address 1</li>
              <li>Insert a column to the right of Address 1, header "Store Number"</li>
              <li>Add equation =RIGHT([Address1Cell], 5) for all rows with data</li>
              <li>Manually review for Address 3 and Second Zip differences</li>
            </ul>
          </div>

          <label className="flex items-center justify-center w-full h-32 px-4 transition bg-white border-2 border-gray-300 border-dashed rounded-lg hover:border-green-400 cursor-pointer mb-3">
            <div className="flex flex-col items-center space-y-2">
              <Upload className="w-8 h-8 text-gray-400" />
              <span className="text-sm text-gray-600">Upload Excel File</span>
            </div>
            <input type="file" className="hidden" accept=".xlsx,.xls" onChange={handleExcelUpload} />
          </label>

          {excelStatus && (
            <div className={`p-3 rounded mb-3 text-sm ${excelStatus.includes('✓') ? 'bg-green-50 text-green-700' : excelStatus.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'}`}>
              {excelStatus}
            </div>
          )}

          {excelData && (
            <div className="mb-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-700 mb-3 font-semibold">✓ Excel converted to CSV!</p>
              <button
                onClick={downloadExcelAsCSV}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-green-700 transition flex items-center justify-center gap-2"
              >
                <Download size={16} />
                Download CSV
              </button>
              <p className="text-xs text-gray-600 mt-2">Download the CSV and upload it below for comparison</p>
            </div>
          )}

          <label className="flex items-center justify-center w-full h-32 px-4 transition bg-white border-2 border-gray-300 border-dashed rounded-lg hover:border-blue-400 cursor-pointer">
            <div className="flex flex-col items-center space-y-2">
              <Upload className="w-8 h-8 text-gray-400" />
              <span className="text-sm text-gray-600">Upload CSV</span>
            </div>
            <input type="file" className="hidden" accept=".csv" onChange={(e) => handleFileUpload(e, 'ruling')} />
          </label>
          {rulingList.length > 0 && (
            <div className="mt-2">
              <p className="text-sm text-green-600 font-semibold">✓ {rulingList.length} records loaded</p>
              <p className="text-xs text-gray-500 mt-1">Headers: {rulingHeaders.join(', ')}</p>
            </div>
          )}
        </div>
      </div>

      {canProceedToMapping && !showMapping && (
        <button
          onClick={() => setShowMapping(true)}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition"
        >
          Next: Map Columns
        </button>
      )}

      {showMapping && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Map Columns Between Lists</h2>
          <p className="text-sm text-gray-600 mb-6">Select which columns from each list should be compared</p>

          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> For Covered Entities, you can match using the 340B ID/HRSA ID field instead of Store/Location ID.
              Both ID fields are optional if you're matching pharmacies only.
            </p>
          </div>

          <div className="space-y-4">
            {[
              { key: 'id', label: 'Store/Location ID (Pharmacies)', required: false, note: 'Use for pharmacy locations' },
              { key: 'hrsaId', label: '340B ID / HRSA ID (Covered Entities)', required: false, note: 'Use for covered entities' },
              { key: 'address', label: 'Street Address', required: true },
              { key: 'city', label: 'City', required: false },
              { key: 'state', label: 'State', required: false },
              { key: 'zip', label: 'Zip Code', required: true }
            ].map(field => (
              <div key={field.key} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center p-4 bg-gray-50 rounded">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    {field.label} {field.required && <span className="text-red-500">*</span>}
                  </label>
                  {field.note && (
                    <p className="text-xs text-gray-500 italic">{field.note}</p>
                  )}
                </div>

                <div>
                  <select
                    value={columnMapping[field.key].pdf}
                    onChange={(e) => updateMapping(field.key, 'pdf', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Client List Column...</option>
                    {pdfHeaders.map(header => (
                      <option key={header} value={header}>{header}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <ArrowRight className="text-gray-400 hidden md:block" size={20} />
                  <select
                    value={columnMapping[field.key].ruling}
                    onChange={(e) => updateMapping(field.key, 'ruling', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select OPAIS Column...</option>
                    {rulingHeaders.map(header => (
                      <option key={header} value={header}>{header}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={compareList}
            className="w-full mt-6 bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition"
          >
            Compare Lists
          </button>
        </div>
      )}

      {comparison && (
        <div className="mt-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="text-green-600" />
                <h3 className="font-semibold text-green-800">Perfect Matches</h3>
              </div>
              <p className="text-3xl font-bold text-green-600">{comparison.matches.length}</p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="text-yellow-600" />
                <h3 className="font-semibold text-yellow-800">Mismatches</h3>
              </div>
              <p className="text-3xl font-bold text-yellow-600">{comparison.mismatches.length}</p>
            </div>

            <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="text-red-600" />
                <h3 className="font-semibold text-red-800">Extra Locations</h3>
              </div>
              <p className="text-3xl font-bold text-red-600">
                {comparison.onlyInPDF.length + comparison.onlyInRuling.length}
              </p>
            </div>
          </div>

          {comparison.mismatches.length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-xl font-semibold mb-4 text-yellow-700">Data Mismatches</h3>
              <div className="space-y-4">
                {comparison.mismatches.map((mismatch, idx) => (
                  <div key={idx} className="border border-yellow-200 p-4 rounded bg-yellow-50">
                    <h4 className="font-bold text-lg mb-2">Location: {mismatch.id}</h4>
                    {mismatch.issues.map((issue, i) => (
                      <div key={i} className="mb-2 pl-4 border-l-4 border-yellow-400">
                        <p className="font-semibold text-sm text-gray-700">{issue.field} Mismatch:</p>
                        <p className="text-sm"><span className="font-medium">PDF:</span> {issue.pdf}</p>
                        <p className="text-sm"><span className="font-medium">Ruling:</span> {issue.ruling}</p>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {comparison.onlyInPDF.length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-xl font-semibold mb-4 text-red-700">Only in PDF List ({comparison.onlyInPDF.length})</h3>
              <div className="space-y-2">
                {comparison.onlyInPDF.map((item, idx) => (
                  <div key={idx} className="border border-red-200 p-3 rounded bg-red-50">
                    <p className="font-semibold">{item.id}</p>
                    <p className="text-sm text-gray-600">
                      {item.item[columnMapping.address.pdf]}, {item.item[columnMapping.city?.pdf]} {item.item[columnMapping.zip.pdf]}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {comparison.onlyInRuling.length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-xl font-semibold mb-4 text-red-700">Only in Ruling List ({comparison.onlyInRuling.length})</h3>
              <div className="space-y-2">
                {comparison.onlyInRuling.map((item, idx) => (
                  <div key={idx} className="border border-red-200 p-3 rounded bg-red-50">
                    <p className="font-semibold">{item.id}</p>
                    <p className="text-sm text-gray-600">
                      {item.item[columnMapping.address.ruling]}, {item.item[columnMapping.city?.ruling]} {item.item[columnMapping.zip.ruling]}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-4">
            <button
              onClick={downloadJSON}
              className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition flex items-center justify-center gap-2"
            >
              <Download size={20} />
              Download JSON
            </button>
            <button
              onClick={printReport}
              className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2"
            >
              <Printer size={20} />
              Print Report
            </button>
            <button
              onClick={() => setShowMapping(true)}
              className="flex-1 bg-gray-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-gray-700 transition"
            >
              Adjust Column Mapping
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
