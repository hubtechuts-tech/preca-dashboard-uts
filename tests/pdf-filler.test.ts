/**
 * PDF Filler Service Test
 *
 * This test generates filled PDFs that you can visually inspect to adjust field positions.
 * The output PDFs will be saved to: tests/output/
 *
 * Run with: npx tsx tests/pdf-filler.test.ts
 */

import { PDFFillerService } from '../src/infrastructure/services/PDFFillerService.js';
import { PDFFieldData, PersonType } from '../src/domain/interfaces/services/IPDFFillerService.js';
import fs from 'fs';
import path from 'path';

// Create output directory if it doesn't exist
const OUTPUT_DIR = path.join(__dirname, 'output');
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Mock data for Persona Física con Actividad Empresarial (PFAE)
const mockDataPFAE: PDFFieldData = {
  personType: 'PFAE' as PersonType,
  applicantName: 'JUAN PÉREZ GARCÍA',
  rfc: 'PEGJ850101ABC',
  street: 'Av. Insurgentes Sur 1234',
  colony: 'Del Valle',
  municipality: 'Benito Juárez',
  state: 'Ciudad de México',
  zipCode: '03100',
  phone: '55-1234-5678',
  date: '15 de Diciembre de 2025',
  // legalRepresentative not needed for PFAE
};

// Mock data for Persona Moral (PM)
const mockDataPM: PDFFieldData = {
  personType: 'PM' as PersonType,
  applicantName: 'COMERCIALIZADORA EJEMPLO S.A. DE C.V.',
  legalRepresentative: 'MARÍA GONZÁLEZ LÓPEZ',
  rfc: 'CEJ120315XYZ',
  street: 'Paseo de la Reforma 500',
  colony: 'Juárez',
  municipality: 'Cuauhtémoc',
  state: 'Ciudad de México',
  zipCode: '06600',
  phone: '55-9876-5432',
  date: '15 de Diciembre de 2025',
};

async function runTests() {
  console.log('🧪 Starting PDF Filler Service Tests\n');
  console.log('📁 Output directory:', OUTPUT_DIR);
  console.log('━'.repeat(60));

  const pdfFillerService = new PDFFillerService();

  // Load the template PDF
  const templatePath = path.join(__dirname, '../public/documents/Formato_Autorizacion.pdf');
  console.log('\n📄 Loading template from:', templatePath);

  if (!fs.existsSync(templatePath)) {
    console.error('❌ Error: Template PDF not found at:', templatePath);
    console.error('   Please ensure the file exists before running tests.');
    process.exit(1);
  }

  const templateBuffer = fs.readFileSync(templatePath);
  console.log('✅ Template loaded successfully');
  console.log('   File size:', (templateBuffer.length / 1024).toFixed(2), 'KB');

  // Test 1: Fill PDF for Persona Física (PFAE)
  console.log('\n━'.repeat(60));
  console.log('\n📝 Test 1: Persona Física con Actividad Empresarial (PFAE)');
  console.log('   Applicant:', mockDataPFAE.applicantName);
  console.log('   RFC:', mockDataPFAE.rfc);

  try {
    const filledPdfPFAE = await pdfFillerService.fillAuthorizationDocument(
      templateBuffer,
      mockDataPFAE
    );

    const outputPathPFAE = path.join(OUTPUT_DIR, 'filled_PFAE.pdf');
    fs.writeFileSync(outputPathPFAE, filledPdfPFAE);

    console.log('✅ PFAE PDF generated successfully');
    console.log('   📁 Saved to:', outputPathPFAE);
    console.log('   📊 Size:', (filledPdfPFAE.length / 1024).toFixed(2), 'KB');
  } catch (error) {
    console.error('❌ Error generating PFAE PDF:', error);
  }

  // Test 2: Fill PDF for Persona Moral (PM)
  console.log('\n━'.repeat(60));
  console.log('\n📝 Test 2: Persona Moral (PM)');
  console.log('   Company:', mockDataPM.applicantName);
  console.log('   Legal Rep:', mockDataPM.legalRepresentative);
  console.log('   RFC:', mockDataPM.rfc);

  try {
    const filledPdfPM = await pdfFillerService.fillAuthorizationDocument(
      templateBuffer,
      mockDataPM
    );

    const outputPathPM = path.join(OUTPUT_DIR, 'filled_PM.pdf');
    fs.writeFileSync(outputPathPM, filledPdfPM);

    console.log('✅ PM PDF generated successfully');
    console.log('   📁 Saved to:', outputPathPM);
    console.log('   📊 Size:', (filledPdfPM.length / 1024).toFixed(2), 'KB');
  } catch (error) {
    console.error('❌ Error generating PM PDF:', error);
  }

  // Test 3: Fill PDF with test pattern (helps identify coordinates)
  console.log('\n━'.repeat(60));
  console.log('\n📝 Test 3: Test Pattern (for coordinate adjustment)');

  const testPatternData: PDFFieldData = {
    personType: 'PFAE' as PersonType,
    applicantName: '>>> NOMBRE AQUÍ <<<',
    rfc: '>>> RFC <<<',
    street: '>>> CALLE <<<',
    colony: '>>> COLONIA <<<',
    municipality: '>>> MUNICIPIO <<<',
    state: '>>> ESTADO <<<',
    zipCode: 'CP',
    phone: '>>> TEL <<<',
    date: '>>> FECHA <<<',
  };

  try {
    const testPatternPdf = await pdfFillerService.fillAuthorizationDocument(
      templateBuffer,
      testPatternData
    );

    const outputPathPattern = path.join(OUTPUT_DIR, 'test_pattern.pdf');
    fs.writeFileSync(outputPathPattern, testPatternPdf);

    console.log('✅ Test pattern PDF generated successfully');
    console.log('   📁 Saved to:', outputPathPattern);
    console.log('   💡 Use this PDF to visually check field alignment');
    console.log('   📊 Size:', (testPatternPdf.length / 1024).toFixed(2), 'KB');
  } catch (error) {
    console.error('❌ Error generating test pattern PDF:', error);
  }

  // Summary
  console.log('\n━'.repeat(60));
  console.log('\n✨ Tests completed!');
  console.log('\n📋 Next Steps:');
  console.log('   1. Open the generated PDFs in tests/output/');
  console.log('   2. Check if the text aligns with the form fields');
  console.log('   3. Adjust positions in PDFFillerService.ts if needed');
  console.log('   4. Re-run this test to verify adjustments');
  console.log('\n💡 Tips for adjusting positions:');
  console.log('   - X coordinate: moves left (lower) or right (higher)');
  console.log('   - Y coordinate: moves up (higher) or down (lower)');
  console.log('   - PDF coordinates start from bottom-left corner');
  console.log('   - Use test_pattern.pdf to identify misalignments');
  console.log('\n━'.repeat(60));
}

// Run the tests
runTests().catch(console.error);
