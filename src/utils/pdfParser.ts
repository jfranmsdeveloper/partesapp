import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import Tesseract from 'tesseract.js';

// Use local worker
GlobalWorkerOptions.workerSrc = `/pdf.worker.min.mjs`;

interface ParsedParteData {
    id?: string;
    title?: string;
    description?: string;
    createdBy?: string;      // Full name: "APELLIDO1 APELLIDO2, NOMBRE"
    createdByCode?: string;  // Numeric code preceding the name: "75"
    date?: string;
    time?: string;
    pdfFile?: string; // Base64
}

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};

export const parsePartePDF = async (file: File, onProgress?: (status: string) => void): Promise<ParsedParteData> => {
    try {
        if (onProgress) onProgress('Leyendo archivo...');

        // V8: Input Validation - Size & Type
        const MAX_SIZE = 10 * 1024 * 1024; // 10MB
        if (file.size > MAX_SIZE) {
            throw new Error('El archivo excede el tamaño máximo permitido (10MB).');
        }

        // Simple MIME check (spoofable but basic filter)
        if (file.type !== 'application/pdf') {
            throw new Error('El formato debe ser PDF.');
        }

        // Magic Bytes Validation for true confirmation
        const headerBuffer = await file.slice(0, 4).arrayBuffer();
        const headerView = new Uint8Array(headerBuffer);
        const headerHex = Array.from(headerView).map(b => b.toString(16).padStart(2, '0')).join('');
        // PDF magic bytes: 25 50 44 46 (%PDF)
        if (headerHex !== '25504446') {
            throw new Error('El archivo no es un PDF válido (Firma incorrecta).');
        }

        // 1. Convert to Base64 for storage
        const base64File = await fileToBase64(file);

        // 2. Load PDF
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;

        let fullText = '';

        // Read first page logic with LAYOUT PRESERVATION
        if (pdf.numPages > 0) {
            const page = await pdf.getPage(1);
            const textContent = await page.getTextContent();

            // Sort items by Y (descending) then X (ascending) to reconstruct lines
            // Item structure: { str: string, transform: [scaleX, skewX, skewY, scaleY, x, y] }
            const items = textContent.items.map((item: any) => ({
                str: item.str,
                x: item.transform[4],
                y: item.transform[5],
                hasEOL: item.hasEOL
            }));

            // Sort: Top to bottom, then Left to Right
            items.sort((a, b) => {
                const yDiff = b.y - a.y;
                if (Math.abs(yDiff) > 5) return yDiff; // Semantic difference in line
                return a.x - b.x;
            });

            // Join with newlines
            let currentY = items[0]?.y || 0;
            fullText = items.reduce((text, item) => {
                if (Math.abs(item.y - currentY) > 5) {
                    text += '\n'; // Start new line
                    currentY = item.y;
                } else if (text !== '') {
                    text += ' '; // Space between words on same line
                }
                return text + item.str;
            }, '');

            // OCR FALLBACK
            if (fullText.trim().length < 50) {
                if (onProgress) onProgress('PDF Escaneado detectado. Aplicando OCR...');

                const viewport = page.getViewport({ scale: 2.0 });
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                if (context) {
                    await page.render({ canvasContext: context, viewport: viewport }).promise;
                    const image = canvas.toDataURL('image/png');

                    const { data: { text } } = await Tesseract.recognize(image, 'spa');
                    // console.debug('OCR Result length:', text.length);
                    fullText = text;
                }
            }
        }

        // console.debug('PDF Extracted Text length:', fullText.length);
        if (onProgress) onProgress('Analizando datos...');

        const data: ParsedParteData = {
            pdfFile: base64File
        };

        // --- SPECIFIC REGEX FOR "DINA4 PARTE" LAYOUT ---

        // 1. ID: "PARTE DE TRABAJO num. XXXXX"
        // Priority to text extraction over filename as per user "Rojo: Número de Parte"
        const idMatch = fullText.match(/PARTE\s+DE\s+TRABAJO\s+num\.?\s*(\d+)/i);
        if (idMatch) {
            data.id = idMatch[1];
        } else {
            // Fallback to filename
            const fileNameMatch = file.name.match(/^(\d+)/);
            if (fileNameMatch) data.id = fileNameMatch[1];
        }

        // 2. DATE & TIME (Blue): "recibido por ... el DD/MM/YYYY a las HH:MM"
        // Note: regex flags 'i' for case insensitive, 'm' not needed as we search full string but headers are specific
        const dateTimeMatch = fullText.match(/recibido\s+por.*?el\s+(\d{2}[/-]\d{2}[/-]\d{4})\s+a\s+las\s+(\d{1,2}[:.]\d{2})/i);
        if (dateTimeMatch) {
            data.date = dateTimeMatch[1]; // 08/01/2026
            data.time = dateTimeMatch[2].replace('.', ':'); // 11:06
        } else {
            // Fallback Date
            const fallbackDate = fullText.match(/(\d{2}[/-]\d{2}[/-]\d{4})/);
            if (fallbackDate) data.date = fallbackDate[1];
        }

        // 3. USER (Orange)
        // Format: "Emitido por el usuario  75  COBO ROMAN, FERNANDO  FUN"
        //           label                  ^code  ^name                ^suffix
        const userLineMatch = fullText.match(/Emitido\s+por\s+el\s+usuario\s*(\d+)?\s*([^\n]+)/i);
        if (userLineMatch) {
            // Capture numeric code (group 1)
            if (userLineMatch[1]) {
                data.createdByCode = userLineMatch[1].trim();
            }

            let text = userLineMatch[2] || '';

            // 1. Cut off at "FUN", "referente", "DIRECCION" to remove trailing noise
            text = text.split(/(?:FUN|referente|DIRECCION)/i)[0].trim();

            // 2. Validate format "SURNAME(s), NAME"
            const commaMatch = text.match(/([A-ZÑ\s]+\s*,\s*[A-ZÑ\s]+)/i);

            if (commaMatch) {
                data.createdBy = commaMatch[1].trim();
            } else {
                // Fallback for non-comma names
                if (text.length > 2) {
                    data.createdBy = text;
                }
            }
        }

        // 4. DESCRIPTION (Pink): "Descripción [TEXT] ... DETALLES"
        // Multiline extraction: Capture from "Descripción" until "DETALLES" or end of section
        const descMatch = fullText.match(/Descripción\s*(?:[:.]\s*)?([\s\S]+?)(?=\n\s*(?:DETALLES|Destinatario|Código del COMPONENTE))/i);
        if (descMatch) {
            let desc = descMatch[1].trim();
            // Clean up potentially captured artifacts if regex was too greedy or loose
            desc = desc.replace(/^[:.]\s*/, '');
            data.title = desc;
        } else {
            // Fallback: If "DETALLES" marker not found, take next few lines?
            // Or try simple line match if multiline failed
            const simpleDesc = fullText.match(/Descripción\s+(.+)/);
            if (simpleDesc) data.title = simpleDesc[1].trim();
        }

        return data;

    } catch (error) {
        console.error('Error parsing PDF:', error);
        throw new Error('No se pudo leer el archivo PDF.');
    }
};
