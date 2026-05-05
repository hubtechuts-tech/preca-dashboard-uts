# Authorization Documents

## carta_autorizacion.pdf

This directory should contain the **Carta de Autorización** (Authorization Letter) template required for Buró de Crédito queries in Mexico.

### Requirements

The authorization document must:
- Be in PDF format
- Comply with Mexican credit bureau (Buró de Crédito) legal requirements
- Include spaces for digital signatures
- Contain legal text authorizing the credit bureau query

### Creating the Document

1. Consult with your legal team to create a compliant authorization letter
2. The document should include:
   - Company information
   - Authorization text (permitting credit bureau queries)
   - Data usage and privacy notice
   - Signature space (will be signed via Wee Trust)

3. Save the PDF as `carta_autorizacion.pdf` in this directory

### Template Example Structure

```
CARTA DE AUTORIZACIÓN PARA CONSULTA DE BURÓ DE CRÉDITO

[Company Name]
[Company Address]
[RFC/Tax ID]

Yo, [Applicant Name], autorizo expresamente a [Company Name] para que...

[Legal authorization text]

[Privacy notice and data usage terms]

_____________________________
Firma Digital
```

### Important Notes

- **Do NOT commit** the actual authorization document to version control if it contains confidential company information
- Add `carta_autorizacion.pdf` to `.gitignore` if needed
- For development/testing, you can use a placeholder PDF
- Ensure the document complies with:
  - Ley Federal de Protección de Datos Personales (Mexico)
  - Buró de Crédito authorization requirements
  - Circular 14/2014 de CONDUSEF (financial regulations)

### Environment Configuration

Set the path in your `.env` file:

```env
AUTHORIZATION_DOCUMENT_PATH=./public/documents/carta_autorizacion.pdf
```

Or use an absolute path if the document is stored elsewhere:

```env
AUTHORIZATION_DOCUMENT_PATH=/path/to/your/carta_autorizacion.pdf
```
