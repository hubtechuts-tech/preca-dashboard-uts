# Dynamic Form Schema API Documentation

## Overview

The Dynamic Form Schema API allows admins to define custom form fields for each service, enabling:
- Dynamic form creation in the admin dashboard
- Structured data collection for screenings
- Automated form schema delivery to n8n agents via API

---

## Authentication

All endpoints require authentication:
- **Admin endpoints**: Require admin role (use `requireAdmin`)
- **Read endpoints**: Require authentication (use `requireAuth`)

### Headers

```
Authorization: Bearer <your-api-key-or-session-token>
```

---

## Endpoints

### 1. Get Service with Form Schema

Retrieve a service including its form schema.

**Endpoint:** `GET /api/services/:id`

**Authentication:** Required (any authenticated user)

**Response:**

```json
{
  "id": 1,
  "code": "PRECA_BASIC",
  "name": "Precalificación Básica - Persona Física",
  "description": "Servicio básico de precalificación",
  "priceMxn": 299.00,
  "formattedPrice": "$299.00 MXN",
  "targetPersonType": "physical",
  "isActive": true,
  "hasFormSchema": true,
  "formSchema": {
    "version": "1.0",
    "fields": [
      {
        "id": "field_001",
        "name": "nombre_completo",
        "label": "Nombre completo",
        "type": "text",
        "required": true,
        "placeholder": "Juan Pérez García",
        "order": 1
      },
      {
        "id": "field_002",
        "name": "telefono",
        "label": "Teléfono",
        "type": "tel",
        "required": true,
        "placeholder": "5551234567",
        "validation": {
          "pattern": "^[0-9]{10}$",
          "message": "Debe ser un teléfono de 10 dígitos"
        },
        "order": 2
      },
      {
        "id": "field_003",
        "name": "correo_electronico",
        "label": "Correo electrónico",
        "type": "email",
        "required": true,
        "placeholder": "ejemplo@correo.com",
        "helpText": "Correo personal accesible desde celular",
        "order": 3
      }
    ]
  },
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

---

### 2. List Services with Form Schemas

List all services including their form schemas.

**Endpoint:** `GET /api/services`

**Authentication:** Required (any authenticated user)

**Query Parameters:**
- `activeOnly` (boolean, optional): Filter only active services
- `personType` (string, optional): Filter by person type (`physical` or `moral`)

**Example Request:**

```bash
GET /api/services?activeOnly=true&personType=physical
```

**Response:**

```json
[
  {
    "id": 1,
    "code": "PRECA_BASIC",
    "name": "Precalificación Básica - Persona Física",
    "hasFormSchema": true,
    "formSchema": { ... }
  },
  {
    "id": 2,
    "code": "PRECA_PRO",
    "name": "Precalificación Pro - Persona Física",
    "hasFormSchema": true,
    "formSchema": { ... }
  }
]
```

---

### 3. Update Service Form Schema

Update or create a form schema for a service.

**Endpoint:** `PATCH /api/services/:id/schema`

**Authentication:** Required (Admin only)

**Request Body:**

```json
{
  "formSchema": {
    "version": "1.0",
    "fields": [
      {
        "id": "field_001",
        "name": "nombre_completo",
        "label": "Nombre completo",
        "type": "text",
        "required": true,
        "placeholder": "Juan Pérez García",
        "helpText": "Nombre completo del solicitante",
        "order": 1
      },
      {
        "id": "field_002",
        "name": "ciudad_renta",
        "label": "¿En qué ciudad quiere rentar?",
        "type": "text",
        "required": true,
        "order": 2
      },
      {
        "id": "field_003",
        "name": "monto_renta_mensual",
        "label": "Monto de renta mensual",
        "type": "number",
        "required": true,
        "placeholder": "10000",
        "validation": {
          "min": 0,
          "message": "El monto debe ser mayor a 0"
        },
        "order": 3
      },
      {
        "id": "field_004",
        "name": "tiempo_viviendo_ciudad",
        "label": "¿Cuánto tiempo tiene viviendo en la ciudad?",
        "type": "select",
        "required": true,
        "options": [
          { "value": "menos_6_meses", "label": "Menos de 6 meses" },
          { "value": "6_meses_1_ano", "label": "Entre 6 meses y 1 año" },
          { "value": "1_2_anos", "label": "Entre 1 y 2 años" },
          { "value": "mas_2_anos", "label": "Más de 2 años" }
        ],
        "order": 4
      }
    ]
  }
}
```

**Response:**

```json
{
  "id": 1,
  "code": "PRECA_BASIC",
  "name": "Precalificación Básica - Persona Física",
  "hasFormSchema": true,
  "formSchema": { ... },
  "updatedAt": "2024-01-02T00:00:00.000Z"
}
```

**Error Responses:**

```json
// 400 Bad Request - Invalid schema
{
  "error": "Form schema version is required"
}

// 404 Not Found - Service doesn't exist
{
  "error": "Service with ID 999 not found"
}

// 403 Forbidden - Not an admin
{
  "error": "Forbidden: Admin access required"
}
```

---

## Form Schema Structure

### Field Types

| Type | Description | Example Use Case |
|------|-------------|------------------|
| `text` | Single-line text input | Name, address |
| `textarea` | Multi-line text input | Comments, descriptions |
| `email` | Email input with validation | Contact email |
| `tel` | Phone number input | Phone number |
| `number` | Numeric input | Monthly income, rent amount |
| `date` | Date picker | Birth date |
| `select` | Dropdown selection | City, employment status |
| `radio` | Radio button group | Yes/No questions |
| `checkbox` | Multiple checkboxes | Multi-select options |
| `boolean` | Single checkbox | Accept terms |
| `file` | File upload | Document upload |

### Field Properties

```typescript
{
  "id": string,              // Unique field ID (e.g., "field_001")
  "name": string,            // Field name for form data key (e.g., "rfc")
  "label": string,           // Display label (e.g., "RFC")
  "type": FieldType,         // Field type (see table above)
  "required": boolean,       // Whether field is required
  "placeholder"?: string,    // Placeholder text
  "helpText"?: string,       // Help text shown below field
  "defaultValue"?: any,      // Default value
  "validation"?: {           // Validation rules
    "pattern"?: string,      // Regex pattern
    "message"?: string,      // Error message
    "min"?: number,          // Min value/length
    "max"?: number,          // Max value/length
    "minLength"?: number,    // Min string length
    "maxLength"?: number,    // Max string length
    "maxSize"?: number,      // Max file size (bytes)
    "allowedTypes"?: string[] // Allowed file MIME types
  },
  "options"?: [              // Options for select/radio/checkbox
    {
      "value": string,       // Option value
      "label": string        // Option display label
    }
  ],
  "dependsOn"?: {            // Conditional visibility
    "field": string,         // Field name to depend on
    "value": any,            // Value that triggers visibility
    "operator"?: string      // "equals" | "notEquals" | "contains"
  },
  "order": number            // Display order (1, 2, 3...)
}
```

### Validation Examples

**Phone Number (10 digits):**

```json
{
  "name": "telefono",
  "type": "tel",
  "validation": {
    "pattern": "^[0-9]{10}$",
    "message": "Debe ser un teléfono de 10 dígitos"
  }
}
```

**RFC Format:**

```json
{
  "name": "rfc",
  "type": "text",
  "validation": {
    "pattern": "^[A-Z]{4}[0-9]{6}[A-Z0-9]{3}$",
    "message": "RFC inválido"
  }
}
```

**Number Range:**

```json
{
  "name": "edad",
  "type": "number",
  "validation": {
    "min": 18,
    "max": 100,
    "message": "La edad debe estar entre 18 y 100 años"
  }
}
```

---

## n8n Integration Guide

### 1. Fetch Service Schema

```javascript
// In your n8n workflow
const serviceId = 1;
const response = await fetch(`https://your-app.com/api/services/${serviceId}`, {
  headers: {
    'Authorization': `Bearer ${apiKey}`
  }
});

const service = await response.json();
const fields = service.formSchema.fields;
```

### 2. Use Schema in AI Agent Prompt

```javascript
const prompt = `
You are collecting information for a background check.
You need to collect the following fields:

${fields.map(f => `
- ${f.label} (${f.name}): ${f.required ? 'REQUIRED' : 'Optional'}
  Type: ${f.type}
  ${f.helpText ? `Help: ${f.helpText}` : ''}
  ${f.validation ? `Validation: ${JSON.stringify(f.validation)}` : ''}
`).join('\n')}

Collect this information from the user in a conversational way.
Validate the data according to the rules provided.
`;
```

### 3. Create Screening with Collected Data

```javascript
const screeningData = {
  serviceId: 1,
  applicantName: collectedData.nombre_completo,
  applicantEmail: collectedData.correo_electronico,
  applicantPhone: collectedData.telefono,
  formData: collectedData // All collected fields
};

const response = await fetch('https://your-app.com/api/screenings', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(screeningData)
});

const result = await response.json();
// result.id - Screening ID
// result.status - "pending_payment"
// result.paymentLinkUrl - Stripe checkout URL
```

---

## Example: Complete Form Schema for "Preca Básica"

```json
{
  "version": "1.0",
  "fields": [
    {
      "id": "field_001",
      "name": "nombre_completo",
      "label": "Nombre completo",
      "type": "text",
      "required": true,
      "placeholder": "Juan Pérez García",
      "order": 1
    },
    {
      "id": "field_002",
      "name": "telefono",
      "label": "Teléfono",
      "type": "tel",
      "required": true,
      "placeholder": "5551234567",
      "validation": {
        "pattern": "^[0-9]{10}$",
        "message": "Debe ser un teléfono de 10 dígitos"
      },
      "order": 2
    },
    {
      "id": "field_003",
      "name": "correo_electronico",
      "label": "Correo electrónico",
      "type": "email",
      "required": true,
      "placeholder": "ejemplo@correo.com",
      "helpText": "Correo personal accesible desde celular",
      "order": 3
    },
    {
      "id": "field_004",
      "name": "nombre_asesor",
      "label": "¿Qué asesor lo está atendiendo?",
      "type": "text",
      "required": true,
      "helpText": "Nombre del asesor o dueño de la propiedad",
      "order": 4
    },
    {
      "id": "field_005",
      "name": "telefono_asesor",
      "label": "Teléfono del asesor",
      "type": "tel",
      "required": true,
      "validation": {
        "pattern": "^[0-9]{10}$",
        "message": "Debe ser un teléfono de 10 dígitos"
      },
      "order": 5
    },
    {
      "id": "field_006",
      "name": "inmobiliaria",
      "label": "¿De qué Inmobiliaria?",
      "type": "text",
      "required": false,
      "helpText": "Opcional",
      "order": 6
    },
    {
      "id": "field_007",
      "name": "ciudad_renta",
      "label": "¿En qué ciudad quiere rentar?",
      "type": "text",
      "required": true,
      "order": 7
    },
    {
      "id": "field_008",
      "name": "monto_renta_mensual",
      "label": "¿Cuál es el monto de renta mensual del inmueble?",
      "type": "number",
      "required": true,
      "placeholder": "10000",
      "validation": {
        "min": 0,
        "message": "El monto debe ser mayor a 0"
      },
      "order": 8
    }
  ]
}
```

---

## Testing with cURL

### Get Service with Form Schema

```bash
curl -X GET "https://your-app.com/api/services/1" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### Update Form Schema

```bash
curl -X PATCH "https://your-app.com/api/services/1/schema" \
  -H "Authorization: Bearer YOUR_ADMIN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "formSchema": {
      "version": "1.0",
      "fields": [
        {
          "id": "field_001",
          "name": "nombre_completo",
          "label": "Nombre completo",
          "type": "text",
          "required": true,
          "order": 1
        }
      ]
    }
  }'
```

---

## Error Handling

### Validation Errors

The API validates form schemas at multiple levels:

1. **DTO Level**: Basic structure validation
2. **Domain Level**: Business rules validation (FormSchema value object)
3. **Use Case Level**: Service existence, permissions

**Example Error Response:**

```json
{
  "error": "Field at index 2 is missing 'type'"
}
```

### Common Errors

| Status Code | Error | Solution |
|-------------|-------|----------|
| 400 | "Form schema version is required" | Add `version` field to schema |
| 400 | "Form schema must have at least one field" | Add at least one field |
| 400 | "Field 'ciudad' of type 'select' requires options" | Add options array |
| 404 | "Service with ID 999 not found" | Use valid service ID |
| 403 | "Forbidden: Admin access required" | Use admin credentials |
| 401 | "Unauthorized" | Provide valid API key |

---

## Best Practices

1. **Field Naming**: Use snake_case for field names (e.g., `nombre_completo`)
2. **Required Fields**: Always mark essential fields as required
3. **Validation**: Add regex patterns for structured data (phone, RFC, CURP)
4. **Help Text**: Provide clear instructions for complex fields
5. **Order**: Use sequential ordering (1, 2, 3...) for predictable layout
6. **Options**: Always provide at least 2 options for select/radio/checkbox
7. **File Uploads**: Set reasonable size limits and allowed types

---

## Backward Compatibility

Services without form schemas will continue to work:
- `hasFormSchema` will be `false`
- `formSchema` will be `null`
- Screenings can still be created with unstructured `form_data`

---

## Support

For questions or issues, contact the development team or file an issue in the project repository.
