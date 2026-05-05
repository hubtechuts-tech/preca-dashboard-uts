/**
 * Check PDF Form Fields Script
 *
 * This script checks if a PDF has fillable form fields
 * and lists all available fields with their types.
 */

const { PDFDocument } = require('pdf-lib');
const fs = require('fs').promises;
const path = require('path');

async function checkPDFFields(pdfPath) {
  try {
    console.log(`\n📄 Checking PDF: ${pdfPath}\n`);

    // Read PDF file
    const pdfBuffer = await fs.readFile(pdfPath);

    // Load PDF document
    const pdfDoc = await PDFDocument.load(pdfBuffer);

    // Get form
    const form = pdfDoc.getForm();

    // Get all fields
    const fields = form.getFields();

    console.log(`✅ PDF loaded successfully`);
    console.log(`📊 Total pages: ${pdfDoc.getPageCount()}`);
    console.log(`📝 Total form fields: ${fields.length}\n`);

    if (fields.length === 0) {
      console.log('❌ This PDF has NO fillable form fields.');
      console.log('   You will need to either:');
      console.log('   1. Add form fields to the PDF using Adobe Acrobat');
      console.log('   2. Generate PDF from scratch using pdfkit');
      console.log('   3. Use HTML → PDF with Puppeteer\n');
      return false;
    }

    console.log('✨ Form Fields Found:\n');
    console.log('━'.repeat(80));

    fields.forEach((field, index) => {
      const name = field.getName();
      const type = field.constructor.name;

      console.log(`${index + 1}. Field Name: "${name}"`);
      console.log(`   Type: ${type}`);

      // Try to get field value if it exists
      try {
        if (type.includes('Text')) {
          const textField = form.getTextField(name);
          const currentValue = textField.getText();
          console.log(`   Current Value: "${currentValue || '(empty)'}"`);
          console.log(`   Max Length: ${textField.getMaxLength() || 'unlimited'}`);
        } else if (type.includes('CheckBox')) {
          const checkBox = form.getCheckBox(name);
          console.log(`   Checked: ${checkBox.isChecked()}`);
        } else if (type.includes('Radio')) {
          const radioGroup = form.getRadioGroup(name);
          console.log(`   Selected: ${radioGroup.getSelected() || 'none'}`);
          console.log(`   Options: ${radioGroup.getOptions().join(', ')}`);
        } else if (type.includes('Dropdown')) {
          const dropdown = form.getDropdown(name);
          console.log(`   Selected: ${dropdown.getSelected() || 'none'}`);
          console.log(`   Options: ${dropdown.getOptions().join(', ')}`);
        }
      } catch (error) {
        console.log(`   (Unable to read field details)`);
      }

      console.log('');
    });

    console.log('━'.repeat(80));
    console.log('\n✅ This PDF has fillable form fields!');
    console.log('   You can use pdf-lib to fill them programmatically.\n');

    // Generate example code
    console.log('📋 Example Code:\n');
    console.log('```typescript');
    console.log('import { PDFDocument } from "pdf-lib";');
    console.log('');
    console.log('async function fillPDF(templateBuffer: Buffer, userData: any) {');
    console.log('  const pdfDoc = await PDFDocument.load(templateBuffer);');
    console.log('  const form = pdfDoc.getForm();');
    console.log('');

    // Generate code for first 3 fields as example
    fields.slice(0, 3).forEach(field => {
      const name = field.getName();
      const type = field.constructor.name;

      if (type.includes('Text')) {
        console.log(`  const ${name.replace(/[^a-zA-Z0-9]/g, '_')} = form.getTextField('${name}');`);
        console.log(`  ${name.replace(/[^a-zA-Z0-9]/g, '_')}.setText(userData.someValue);`);
      } else if (type.includes('CheckBox')) {
        console.log(`  const ${name.replace(/[^a-zA-Z0-9]/g, '_')} = form.getCheckBox('${name}');`);
        console.log(`  ${name.replace(/[^a-zA-Z0-9]/g, '_')}.check(); // or .uncheck()`);
      }
    });

    console.log('');
    console.log('  // Flatten form (make read-only)');
    console.log('  form.flatten();');
    console.log('');
    console.log('  return Buffer.from(await pdfDoc.save());');
    console.log('}');
    console.log('```\n');

    return true;

  } catch (error) {
    console.error('❌ Error reading PDF:', error.message);
    return false;
  }
}

// Main execution
const pdfPath = process.argv[2] || path.join(__dirname, '..', 'public', 'documents', 'Formato de Autorizacion PM.pdf');

checkPDFFields(pdfPath)
  .then(hasFields => {
    process.exit(hasFields ? 0 : 1);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
