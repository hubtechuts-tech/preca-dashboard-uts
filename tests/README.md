# PDF Filler Service Tests

This directory contains tests for the PDF filling functionality.

## Running the PDF Filler Test

The PDF filler test generates actual PDFs with mock data so you can visually inspect and adjust field positions.

### Quick Start

```bash
# Install dependencies if you haven't already
npm install

# Run the PDF filler test
npx tsx tests/pdf-filler.test.ts
```

### What It Does

The test will:
1. Load the authorization document template from `public/documents/Formato_Autorizacion.pdf`
2. Generate 3 test PDFs:
   - `filled_PFAE.pdf` - Persona Física example
   - `filled_PM.pdf` - Persona Moral example
   - `test_pattern.pdf` - Test pattern with markers for alignment checking
3. Save them to `tests/output/`

### Adjusting Field Positions

If the fields don't align correctly:

1. Open `tests/output/test_pattern.pdf` to see which fields are misaligned
2. Edit `src/infrastructure/services/PDFFillerService.ts`
3. Adjust the positions in the `positions` object (lines 49-83)
4. Re-run the test to verify: `npx tsx tests/pdf-filler.test.ts`

**Coordinate Tips:**
- PDF coordinates start from **bottom-left** corner
- Increase X to move right, decrease to move left
- Increase Y to move up, decrease to move down
- Small adjustments (5-10 pixels) are usually enough

### Example Position Adjustment

If "Nombre" appears too far to the right:

```typescript
// Before
applicantName: { x: 71, y: 351 }

// After (moved 10 pixels left)
applicantName: { x: 61, y: 351 }
```

### Output Files

All generated PDFs are saved to `tests/output/` (git-ignored).

You can safely delete this directory - it will be recreated on the next test run.
