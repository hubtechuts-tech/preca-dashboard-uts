/**
 * PDF Coordinate Finder
 *
 * This tool creates a PDF with a grid overlay to help you find coordinates.
 * Run with: npx tsx tests/pdf-coordinate-finder.ts
 */

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

async function createCoordinateGrid() {
  console.log('🎯 PDF Coordinate Grid Generator\n');

  const templatePath = path.join(__dirname, '../public/documents/Formato_Autorizacion.pdf');
  const outputDir = path.join(__dirname, 'output');

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Load the template
  const templateBuffer = fs.readFileSync(templatePath);
  const pdfDoc = await PDFDocument.load(templateBuffer);

  const pages = pdfDoc.getPages();
  const firstPage = pages[0];
  const { width, height } = firstPage.getSize();

  console.log(`📄 PDF Page Size: ${width} x ${height}\n`);

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const gridFont = await pdfDoc.embedFont(StandardFonts.Courier);

  // Draw grid lines every 50 pixels
  const gridStep = 50;
  const gridColor = rgb(0.9, 0.1, 0.1); // Red
  const textColor = rgb(1, 0, 0); // Bright red

  console.log('Drawing coordinate grid...\n');

  // Vertical lines (X coordinates)
  for (let x = 0; x <= width; x += gridStep) {
    firstPage.drawLine({
      start: { x, y: 0 },
      end: { x, y: height },
      thickness: x % 100 === 0 ? 1 : 0.5,
      color: gridColor,
      opacity: 0.3,
    });

    // Label every 100 pixels
    if (x % 100 === 0) {
      firstPage.drawText(`X:${x}`, {
        x: x + 2,
        y: height - 15,
        size: 8,
        font: gridFont,
        color: textColor,
      });
    }
  }

  // Horizontal lines (Y coordinates)
  for (let y = 0; y <= height; y += gridStep) {
    firstPage.drawLine({
      start: { x: 0, y },
      end: { x: width, y },
      thickness: y % 100 === 0 ? 1 : 0.5,
      color: gridColor,
      opacity: 0.3,
    });

    // Label every 100 pixels
    if (y % 100 === 0) {
      firstPage.drawText(`Y:${y}`, {
        x: 5,
        y: y + 2,
        size: 8,
        font: gridFont,
        color: textColor,
      });
    }
  }

  // Add corner markers
  const markerSize = 10;
  const markers = [
    { x: 0, y: 0, label: '(0,0) BOTTOM-LEFT' },
    { x: width - 100, y: 0, label: `(${width},0) BOTTOM-RIGHT` },
    { x: 0, y: height - 20, label: `(0,${height}) TOP-LEFT` },
    { x: width - 100, y: height - 20, label: `(${width},${height}) TOP-RIGHT` },
  ];

  markers.forEach(marker => {
    firstPage.drawText(marker.label, {
      x: marker.x,
      y: marker.y,
      size: 10,
      font: font,
      color: rgb(1, 0, 0),
    });
  });

  // Save the grid PDF
  const pdfBytes = await pdfDoc.save();
  const outputPath = path.join(outputDir, 'coordinate_grid.pdf');
  fs.writeFileSync(outputPath, pdfBytes);

  console.log('✅ Coordinate grid created!\n');
  console.log(`📁 Saved to: ${outputPath}\n`);
  console.log('━'.repeat(60));
  console.log('\n📋 How to Use:\n');
  console.log('1. Open coordinate_grid.pdf');
  console.log('2. Find the field you want to fill');
  console.log('3. Look at the nearest grid line to find X and Y coordinates');
  console.log('4. Red lines every 100px are thicker for easier counting');
  console.log('5. Labels show coordinates at major grid intersections');
  console.log('\n💡 Tips:');
  console.log('- PDF coordinates start at BOTTOM-LEFT (0,0)');
  console.log('- Y increases going UP the page');
  console.log('- X increases going RIGHT across the page');
  console.log('- Grid lines are every 50 pixels');
  console.log('- Major grid lines (every 100px) are thicker and labeled');
  console.log('\n━'.repeat(60));
}

createCoordinateGrid().catch(console.error);
