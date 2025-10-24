/**
 * 340B PDF Parser
 * Extracts Pharmacy and Covered Entity locations from PDFs
 * Separates into two lists with Name, Street Address, City, State, and Zip
 */

interface Location {
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
}

interface ParseResult {
  success: boolean;
  pharmacies: Location[];
  coveredEntities: Location[];
  csv: string;
  error?: string;
  stats: {
    totalPharmacies: number;
    totalCoveredEntities: number;
  };
}

const US_STATES = ['AZ', 'AL', 'AK', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC'];

export async function parsePDF(file: File, onProgress?: (message: string) => void): Promise<ParseResult> {
  try {
    const pdfjsLib = (window as any)['pdfjs-dist/build/pdf'];
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;

    const totalPages = pdf.numPages;
    console.log(`Processing PDF with ${totalPages} pages`);
    onProgress?.(`Found ${totalPages} pages in PDF. Starting extraction...`);

    let fullText = '';

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      onProgress?.(`Reading page ${pageNum} of ${totalPages}...`);
      console.log(`Reading page ${pageNum} of ${totalPages}...`);
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();

      const sortedItems = textContent.items.sort((a: any, b: any) => {
        const yDiff = Math.abs(a.transform[5] - b.transform[5]);
        if (yDiff < 5) {
          return a.transform[4] - b.transform[4];
        }
        return b.transform[5] - a.transform[5];
      });

      const pageText = sortedItems.map((item: any) => item.str).join(' ');
      fullText += pageText + '\n';
      console.log(`Page ${pageNum} text length: ${pageText.length} characters`);
    }

    console.log(`Total extracted text length: ${fullText.length} characters`);
    console.log('=== FULL TEXT SAMPLE ===');
    console.log(fullText.substring(0, 2000));
    console.log('=== END SAMPLE ===');
    onProgress?.(`All ${totalPages} pages read. Extracting locations...`);
    console.log('Extracting locations...');

    const pharmacies = extractPharmacies(fullText);
    const coveredEntities = extractCoveredEntities(fullText);

    console.log(`Raw pharmacy matches before dedup: ${pharmacies.length}`);
    console.log(`Raw entity matches before dedup: ${coveredEntities.length}`);

    onProgress?.('Running accuracy check and removing duplicates...');
    console.log('Running accuracy check...');
    const verifiedPharmacies = removeDuplicates(pharmacies);
    const verifiedCoveredEntities = removeDuplicates(coveredEntities);

    console.log(`Found ${verifiedPharmacies.length} unique pharmacies`);
    console.log(`Found ${verifiedCoveredEntities.length} unique covered entities`);

    const csv = generateCSV(verifiedPharmacies, verifiedCoveredEntities);

    return {
      success: true,
      pharmacies: verifiedPharmacies,
      coveredEntities: verifiedCoveredEntities,
      csv: csv,
      stats: {
        totalPharmacies: verifiedPharmacies.length,
        totalCoveredEntities: verifiedCoveredEntities.length
      }
    };

  } catch (error) {
    console.error('PDF parsing error:', error);
    return {
      success: false,
      pharmacies: [],
      coveredEntities: [],
      csv: '',
      error: (error as Error).message,
      stats: {
        totalPharmacies: 0,
        totalCoveredEntities: 0
      }
    };
  }
}

function extractTableData(text: string, type: 'pharmacy' | 'entity'): Location[] {
  const locations: Location[] = [];
  console.log(`\n=== Extracting ${type} table data ===`);

  const stateList = US_STATES.join('|');

  const simplePattern = new RegExp(
    `(\\d{4,5})\\s+([\\w\\s#.,-]+?)\\s+([A-Z][A-Z\\s]+?)\\s+(${stateList})\\s+(\\d{5})`,
    'g'
  );

  let match;
  let count = 0;
  while ((match = simplePattern.exec(text)) !== null) {
    count++;
    const locationId = match[1].trim();
    const address = match[2].trim();
    const city = match[3].trim();
    const state = match[4].trim();
    const zip = match[5].trim();

    console.log(`Match ${count}: ID=${locationId}, Address=${address}, City=${city}, State=${state}, Zip=${zip}`);

    if (type === 'pharmacy') {
      locations.push({
        name: locationId,
        address: address,
        city: city,
        state: state,
        zip: zip
      });
    }
  }

  if (type === 'entity') {
    const entityPattern = new RegExp(
      `(STD\\d+)[^\\n]*?\\s+([\\w\\s#.,-]+?)\\s+([A-Z][A-Z\\s]+?)\\s+(${stateList})\\s+(\\d{5})`,
      'gi'
    );

    while ((match = entityPattern.exec(text)) !== null) {
      count++;
      const hrsaId = match[1].trim();
      const address = match[2].trim();
      const city = match[3].trim();
      const state = match[4].trim();
      const zip = match[5].trim();

      console.log(`Entity Match ${count}: HRSA=${hrsaId}, Address=${address}, City=${city}, State=${state}, Zip=${zip}`);

      locations.push({
        name: hrsaId,
        address: address,
        city: city,
        state: state,
        zip: zip
      });
    }
  }

  console.log(`Total ${type} table matches: ${locations.length}\n`);
  return locations;
}

function extractPharmacies(text: string): Location[] {
  const pharmacies: Location[] = [];

  const tableMatches = extractTableData(text, 'pharmacy');
  pharmacies.push(...tableMatches);

  const lines = text.split('\n');
  let inPharmacySection = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.match(/retail\s+pharmacy|contract\s+pharmacy|pharmacy\s+location/i)) {
      inPharmacySection = true;
      continue;
    }

    if (line.match(/covered\s+entity\s+location/i) && inPharmacySection) {
      break;
    }

    if (inPharmacySection) {
      const location = extractLocation(line, 'pharmacy');
      if (location) {
        pharmacies.push(location);
      }
    }
  }

  const fullTextMatch = text.match(/retail\s+pharmacy[\s\S]*?(?=covered\s+entity\s+location|$)/i);
  if (fullTextMatch) {
    const pharmacySection = fullTextMatch[0];
    const additionalMatches = extractLocationsWithRegex(pharmacySection, 'pharmacy');
    pharmacies.push(...additionalMatches);
  }

  return pharmacies;
}

function extractCoveredEntities(text: string): Location[] {
  const entities: Location[] = [];

  const tableMatches = extractTableData(text, 'entity');
  entities.push(...tableMatches);

  const lines = text.split('\n');
  let inEntitySection = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.match(/covered\s+entity\s+location/i)) {
      inEntitySection = true;
      continue;
    }

    if (line.match(/retail\s+pharmacy|contract\s+pharmacy/i) && inEntitySection) {
      break;
    }

    if (inEntitySection) {
      const location = extractLocation(line, 'entity');
      if (location) {
        entities.push(location);
      }
    }
  }

  const fullTextMatch = text.match(/covered\s+entity\s+location[\s\S]*?(?=retail\s+pharmacy|contract\s+pharmacy|$)/i);
  if (fullTextMatch) {
    const entitySection = fullTextMatch[0];
    const additionalMatches = extractLocationsWithRegex(entitySection, 'entity');
    entities.push(...additionalMatches);
  }

  return entities;
}

function extractLocation(text: string, type: 'pharmacy' | 'entity'): Location | null {
  if (text.length < 15) return null;
  if (text.match(/^(page|exhibit|location|address|city|state|zip)/i)) return null;

  const zipMatch = text.match(/\b(\d{5})(?:-\d{4})?\b/);
  if (!zipMatch) return null;

  const zip = zipMatch[1];

  const stateRegex = new RegExp(`\\b(${US_STATES.join('|')})\\s+\\d{5}`, 'g');
  const stateMatch = text.match(stateRegex);
  if (!stateMatch) return null;

  const state = stateMatch[0].split(' ')[0];

  const cityRegex = new RegExp(`([A-Z][A-Z\\s]+?)\\s+${state}\\s+\\d{5}`);
  const cityMatch = text.match(cityRegex);
  if (!cityMatch) return null;

  const city = cityMatch[1].trim();

  const beforeCity = text.substring(0, text.indexOf(city));

  let name = '';
  let address = '';

  if (type === 'entity') {
    const hrsaMatch = beforeCity.match(/STD\d+/);
    if (hrsaMatch) {
      name = hrsaMatch[0];
      const afterHrsa = beforeCity.substring(beforeCity.indexOf(name) + name.length).trim();
      address = afterHrsa;
    } else {
      const parts = beforeCity.trim().split(/\s{2,}/);
      if (parts.length >= 2) {
        name = parts[0];
        address = parts.slice(1).join(' ');
      } else {
        address = beforeCity.trim();
      }
    }
  } else {
    const locationMatch = beforeCity.match(/\b(\d{4,5})\b/);
    if (locationMatch) {
      name = locationMatch[1];
      const beforeLocation = beforeCity.substring(0, beforeCity.indexOf(locationMatch[1]));
      const afterLocation = beforeCity.substring(beforeCity.indexOf(locationMatch[1]) + locationMatch[1].length);
      address = (beforeLocation + afterLocation).trim();
    } else {
      address = beforeCity.trim();
    }
  }

  if (!address || address.length < 3) return null;

  return {
    name: name || 'N/A',
    address: address,
    city: city,
    state: state,
    zip: zip
  };
}

function extractLocationsWithRegex(text: string, type: 'pharmacy' | 'entity'): Location[] {
  const locations: Location[] = [];

  const stateList = US_STATES.join('|');
  const regex = new RegExp(
    `([\\w\\s#.,-]+?)\\s+([A-Z][A-Z\\s]+?)\\s+(${stateList})\\s+(\\d{5})`,
    'g'
  );

  let match;
  while ((match = regex.exec(text)) !== null) {
    const fullMatch = match[0];
    const city = match[2].trim();
    const state = match[3];
    const zip = match[4];

    const beforeCity = fullMatch.substring(0, fullMatch.indexOf(city));

    let name = '';
    let address = '';

    if (type === 'entity') {
      const hrsaMatch = beforeCity.match(/STD\d+/);
      if (hrsaMatch) {
        name = hrsaMatch[0];
        address = beforeCity.substring(beforeCity.indexOf(name) + name.length).trim();
      } else {
        address = beforeCity.trim();
      }
    } else {
      const locationMatch = beforeCity.match(/\b(\d{4,5})\b/);
      if (locationMatch) {
        name = locationMatch[1];
        address = beforeCity.replace(locationMatch[1], '').trim();
      } else {
        address = beforeCity.trim();
      }
    }

    if (address && address.length >= 3) {
      locations.push({
        name: name || 'N/A',
        address: address,
        city: city,
        state: state,
        zip: zip
      });
    }
  }

  return locations;
}

function removeDuplicates(locations: Location[]): Location[] {
  const seen = new Set<string>();
  const unique: Location[] = [];

  for (const location of locations) {
    const key = `${location.address.toUpperCase()}-${location.city.toUpperCase()}-${location.state}-${location.zip}`;

    if (!seen.has(key)) {
      seen.add(key);
      unique.push(location);
    }
  }

  return unique;
}

function generateCSV(pharmacies: Location[], coveredEntities: Location[]): string {
  let csv = '';

  csv += 'PHARMACY LOCATIONS\n';
  csv += 'Name,Street Address,City,State,Zip Code\n';

  pharmacies.forEach(pharmacy => {
    csv += `"${pharmacy.name}","${pharmacy.address}","${pharmacy.city}","${pharmacy.state}","${pharmacy.zip}"\n`;
  });

  csv += '\n';

  csv += 'COVERED ENTITY LOCATIONS\n';
  csv += 'Name,Street Address,City,State,Zip Code\n';

  coveredEntities.forEach(entity => {
    csv += `"${entity.name}","${entity.address}","${entity.city}","${entity.state}","${entity.zip}"\n`;
  });

  return csv;
}

export function downloadCSV(csvContent: string, filename: string = 'locations.csv'): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}
