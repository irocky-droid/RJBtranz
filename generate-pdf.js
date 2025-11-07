import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generatePDF() {
  try {
    console.log('Launching browser...');
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // Read the HTML file
    const htmlPath = path.join(__dirname, 'libraries-guide.html');
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');

    // Set the content
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    // Generate PDF
    const pdfPath = path.join(__dirname, 'rjbtranz-libraries-guide.pdf');
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      }
    });

    await browser.close();

    console.log(`PDF generated successfully at: ${pdfPath}`);

    // Create zip file
    const { default: JSZip } = await import('jszip');
    const zip = new JSZip();

    // Add PDF to zip
    const pdfBuffer = fs.readFileSync(pdfPath);
    zip.file('rjbtranz-libraries-guide.pdf', pdfBuffer);

    // Generate zip file
    const zipContent = await zip.generateAsync({ type: 'nodebuffer' });
    const zipPath = path.join(__dirname, 'rjbtranz-libraries-guide.zip');
    fs.writeFileSync(zipPath, zipContent);

    console.log(`ZIP file created at: ${zipPath}`);

  } catch (error) {
    console.error('Error generating PDF:', error);
    process.exit(1);
  }
}

generatePDF();