# Multi-Service PDF Report Architecture

This document explains how to configure different PDF report formats for each of the 10 services in the PRECA platform.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Configuration Approaches](#configuration-approaches)
3. [Template System](#template-system)
4. [ReportSchema Configuration](#reportschema-configuration)
5. [Admin Workflow](#admin-workflow)
6. [Implementation Checklist](#implementation-checklist)

---

## Architecture Overview

The system uses a **schema-driven approach** where each service defines:

1. **ReportSchema** - What fields the admin fills out (stored in database)
2. **Handlebars Template** - How the PDF looks (stored in code)

```
┌─────────────────────────────────────────────────────────────────┐
│                        SERVICE CATALOG                          │
├─────────────────────────────────────────────────────────────────┤
│  Service 1 (PRECA_BASIC)                                        │
│  ├── reportSchema: { fields: [...], templateId: "preca-basic" } │
│  └── Template: /templates/reports/preca-basic-pfae.hbs          │
├─────────────────────────────────────────────────────────────────┤
│  Service 2 (PRECA_PRO)                                          │
│  ├── reportSchema: { fields: [...], templateId: "preca-pro" }   │
│  └── Template: /templates/reports/preca-pro-pfae.hbs            │
├─────────────────────────────────────────────────────────────────┤
│  Service N...                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
Admin selects screening
       │
       ▼
System loads service.reportSchema
       │
       ▼
ReportDataForm renders dynamic form based on schema
       │
       ▼
Admin fills fields → Data saved to screening.reportData
       │
       ▼
Admin clicks "Generate PDF"
       │
       ▼
System uses schema.templateId to select Handlebars template
       │
       ▼
Puppeteer renders template with reportData → PDF generated
```

---

## Configuration Approaches

### What Goes Where?

| Component | Location | Modified By | Why |
|-----------|----------|-------------|-----|
| **ReportSchema** | Database (`service_catalog.report_schema`) | Admin via UI or API | Frequently changes, different per client needs |
| **Handlebars Templates** | Code (`/src/templates/reports/`) | Developer | Requires HTML/CSS knowledge, deployment |
| **Template Partials** | Code (`/src/templates/reports/partials/`) | Developer | Shared components across templates |

### Configuration Matrix

```
┌────────────────────┬─────────────────┬──────────────────────────────┐
│ What               │ Where           │ How to Change                │
├────────────────────┼─────────────────┼──────────────────────────────┤
│ Field labels       │ Database        │ Admin UI / API               │
│ Field types        │ Database        │ Admin UI / API               │
│ Field order        │ Database        │ Admin UI / API               │
│ Required fields    │ Database        │ Admin UI / API               │
│ Sections           │ Database        │ Admin UI / API               │
│ Validation rules   │ Database        │ Admin UI / API               │
├────────────────────┼─────────────────┼──────────────────────────────┤
│ PDF body layout    │ Code (.hbs)     │ Developer + Deploy           │
│ Body colors/fonts  │ Code (.hbs)     │ Developer + Deploy           │
│ Page structure     │ Code (.hbs)     │ Developer + Deploy           │
├────────────────────┼─────────────────┼──────────────────────────────┤
│ Header/Footer      │ Code (.ts)      │ Developer + Deploy           │
│ Header bars/logo   │ Code (.ts)      │ Developer + Deploy           │
│ Footer contact     │ Code (.ts)      │ Developer + Deploy           │
│ Page numbers       │ Code (.ts)      │ Developer + Deploy           │
│ Folio generation   │ Code (.ts)      │ Developer + Deploy           │
└────────────────────┴─────────────────┴──────────────────────────────┘

Note: Header/Footer are in PuppeteerPdfGeneratorService.ts (inline styles)
      Body templates are in /src/templates/reports/*.hbs (Handlebars)
```

---

## Template System

### Directory Structure

```
src/templates/reports/
├── partials/                    # Reusable components
│   ├── styles.hbs              # Shared CSS styles
│   ├── applicant-info.hbs      # Name, RFC, address block
│   ├── credit-score.hbs        # Score visualization
│   ├── accounts-table.hbs      # Credit accounts table
│   └── signature-block.hbs     # Signature area
│
├── preca-basic-pfae.hbs        # PRECA Basic - Individual
├── preca-basic-pm.hbs          # PRECA Basic - Business
├── preca-pro-pfae.hbs          # PRECA Pro - Individual
├── preca-pro-pm.hbs            # PRECA Pro - Business
├── preca-premium-pfae.hbs      # PRECA Premium - Individual
├── preca-premium-pm.hbs        # PRECA Premium - Business
└── [service-code]-[type].hbs   # Pattern for other services
```

### Header & Footer (Puppeteer Native)

Headers and footers are **NOT** handled by Handlebars templates. Instead, they use **Puppeteer's native `headerTemplate` and `footerTemplate`** options, which:

- Appear on **every page** automatically
- Use **inline styles only** (no `<style>` tags allowed)
- Are defined in `PuppeteerPdfGeneratorService.ts`

```
Header Layout:
┌─────────────────────────────────────────────────────────────┐
│ [green 3.67cm] [navy 6.73cm] [LOGO] [spacer] [green 1.80cm] │
│ FECHA: DD/MM/YYYY                                           │
│ FOLIO: YYYYMMDD-XXXX                                        │
└─────────────────────────────────────────────────────────────┘

Footer Layout:
┌─────────────────────────────────────────────────────────────┐
│ ○ Av Central Poniente 1377 PA, Tuxtla Gutierrez, Chis.     │
│ ○ www.preca.com.mx                                          │
│ ○ contacto@preca.com.mx                                     │
│ ○ 961 5508233 y 34                                          │
│              Pagina X de Y                                  │
│ [navy 7.4cm] [green (rest)] [navy 7.4cm]                   │
└─────────────────────────────────────────────────────────────┘
```

**Why Puppeteer native templates?**
- Handlebars partials in the body only render once (HTML document flow limitation)
- Puppeteer's `displayHeaderFooter: true` with `headerTemplate`/`footerTemplate` renders on every page
- Requires inline styles due to Puppeteer's isolated header/footer context

### Template Naming Convention

```
{service-code}-{person-type}.hbs

Where:
- service-code: Lowercase, hyphenated (e.g., "preca-basic", "credit-check")
- person-type: "pfae" (individual) or "pm" (business)

Examples:
- preca-basic-pfae.hbs
- preca-pro-pm.hbs
- background-check-pfae.hbs
```

### Template Selection Logic

The system selects templates in this order:

1. `reportSchema.templateId` (if specified in schema)
2. Default: `{serviceCode}-{personType}.hbs`

```typescript
// In GenerateReportUseCase.ts
const templateId =
  overrideTemplateId ||                              // Optional override
  service.reportSchema?.templateId ||                // From schema
  `${service.code.toLowerCase()}-${personType}`;    // Default fallback
```

### Example Template with Partials

```handlebars
{{!-- preca-pro-pfae.hbs --}}
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Reporte PRECA Pro - {{applicantName}}</title>
  {{> styles}}  {{!-- Shared CSS styles --}}
</head>
<body>
  {{!-- NOTE: Header and footer are handled by Puppeteer's native templates --}}
  {{!-- They appear on every page automatically --}}

  <div class="report-title-section">
    <h1 class="report-main-title">Reporte PRECA Pro</h1>
    <p class="report-subtitle">{{serviceName}}</p>
  </div>

  {{> applicant-info }}

  <section class="credit-analysis">
    <h2 class="section-title">Análisis de Crédito</h2>
    {{> credit-score score=creditScore showRange=true }}

    {{#if creditAccounts}}
      {{> accounts-table accounts=creditAccounts }}
    {{/if}}
  </section>

  {{!-- PRO-specific sections --}}
  <section class="employment-history">
    <h2 class="section-title">Historial Laboral</h2>
    {{#each employmentHistory}}
      <div class="job">
        <strong>{{company}}</strong> - {{position}}
        <span>{{startDate}} - {{endDate}}</span>
      </div>
    {{/each}}
  </section>

  {{> signature-block analystName=analystName applicantName=applicantName }}
</body>
</html>
```

---

## ReportSchema Configuration

### Schema Structure

```typescript
interface ReportSchema {
  version: string;           // Schema version (e.g., "1.0")
  templateId: string;        // Which template to use
  sections: Section[];       // Logical groupings
  fields: Field[];          // Form fields
}

interface Section {
  id: string;               // Unique identifier
  title: string;            // Display name
  order: number;            // Sort order
}

interface Field {
  id: string;               // Unique identifier
  name: string;             // Variable name in template
  label: string;            // Display label
  type: FieldType;          // Field type
  required: boolean;
  section?: string;         // Section ID
  order: number;
  placeholder?: string;
  helpText?: string;
  defaultValue?: any;
  validation?: ValidationRules;
  options?: Option[];       // For select/status
  tableColumns?: Column[];  // For table type
  dependsOn?: Dependency;   // Conditional visibility
}
```

### Supported Field Types

| Type | Description | Use Case |
|------|-------------|----------|
| `text` | Single line input | Names, short text |
| `textarea` | Multi-line input | Observations, notes |
| `number` | Numeric input | Quantities, IDs |
| `currency` | Money format (MXN) | Salaries, debts |
| `percentage` | 0-100 with % | Rates, scores |
| `date` | Date picker | Dates |
| `select` | Dropdown options | Categories, status |
| `boolean` | Yes/No toggle | Flags |
| `status` | Colored status badge | Approval status |
| `score` | 300-850 score display | Credit scores |
| `table` | Dynamic rows | Accounts, history |
| `image` | Image upload | Documents, photos |
| `section_header` | Visual divider | Organize form |

### Example Schema (PRECA Pro)

```json
{
  "version": "1.0",
  "templateId": "preca-pro-pfae",
  "sections": [
    { "id": "general", "title": "Información General", "order": 1 },
    { "id": "credit", "title": "Análisis Crediticio", "order": 2 },
    { "id": "employment", "title": "Historial Laboral", "order": 3 },
    { "id": "recommendation", "title": "Recomendación", "order": 4 }
  ],
  "fields": [
    {
      "id": "f1",
      "name": "creditScore",
      "label": "Score de Crédito",
      "type": "score",
      "required": true,
      "section": "credit",
      "order": 1,
      "validation": { "min": 300, "max": 850 }
    },
    {
      "id": "f2",
      "name": "creditAccounts",
      "label": "Cuentas de Crédito",
      "type": "table",
      "required": false,
      "section": "credit",
      "order": 2,
      "tableColumns": [
        { "key": "institution", "label": "Institución", "type": "text" },
        { "key": "accountType", "label": "Tipo", "type": "text" },
        { "key": "balance", "label": "Saldo", "type": "currency" },
        { "key": "status", "label": "Estado", "type": "select" }
      ]
    },
    {
      "id": "f3",
      "name": "employmentHistory",
      "label": "Empleos Anteriores",
      "type": "table",
      "required": false,
      "section": "employment",
      "order": 1,
      "tableColumns": [
        { "key": "company", "label": "Empresa", "type": "text" },
        { "key": "position", "label": "Puesto", "type": "text" },
        { "key": "startDate", "label": "Inicio", "type": "date" },
        { "key": "endDate", "label": "Fin", "type": "date" }
      ]
    },
    {
      "id": "f4",
      "name": "recommendationStatus",
      "label": "Recomendación Final",
      "type": "status",
      "required": true,
      "section": "recommendation",
      "order": 1,
      "options": [
        { "value": "approved", "label": "Aprobado", "color": "green" },
        { "value": "conditional", "label": "Condicionado", "color": "yellow" },
        { "value": "rejected", "label": "Rechazado", "color": "red" }
      ]
    },
    {
      "id": "f5",
      "name": "observations",
      "label": "Observaciones",
      "type": "textarea",
      "required": false,
      "section": "recommendation",
      "order": 2,
      "placeholder": "Notas adicionales sobre el solicitante..."
    }
  ]
}
```

---

## Admin Workflow

Since the admin is **non-technical**, the system requires a **visual Admin UI** for configuring report schemas. No coding or API knowledge required.

### Responsibilities Split

| Role | Responsibility | How |
|------|----------------|-----|
| **Developer** | Create PDF templates (layout, design) | Code + Deploy |
| **Developer** | Initial service setup | Database seed |
| **Admin** | Configure form fields | Visual UI |
| **Admin** | Add/remove/reorder fields | Visual UI |
| **Admin** | Set field validations | Visual UI |
| **Admin** | Organize sections | Visual UI |

### Admin UI: Report Schema Editor

The admin panel will include a visual schema editor at:

```
/admin/services → Select Service → "Configurar Formulario de Reporte"
```

#### Main Editor Screen

```
┌─────────────────────────────────────────────────────────────────┐
│  ← Volver                                                       │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  PRECA Pro - Configuración de Formulario de Reporte       │ │
│  │  Template: preca-pro-pfae                                 │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌─ SECCIONES ──────────────────────────────────────────────┐  │
│  │                                                          │  │
│  │  ☰ Información General                      [Editar] [×] │  │
│  │  ☰ Análisis Crediticio                      [Editar] [×] │  │
│  │  ☰ Historial Laboral                        [Editar] [×] │  │
│  │  ☰ Recomendación                            [Editar] [×] │  │
│  │                                                          │  │
│  │  [+ Agregar Sección]                                     │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─ CAMPOS ─────────────────────────────────────────────────┐  │
│  │                                                          │  │
│  │  Filtrar por sección: [Todas                        ▼]   │  │
│  │                                                          │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │ ☰  Score de Crédito                                │  │  │
│  │  │    Tipo: score  │  Sección: Análisis Crediticio    │  │  │
│  │  │    ✓ Requerido                                     │  │  │
│  │  │                                    [Editar] [×]    │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  │                                                          │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │ ☰  Cuentas de Crédito                              │  │  │
│  │  │    Tipo: tabla  │  Sección: Análisis Crediticio    │  │  │
│  │  │    4 columnas                                      │  │  │
│  │  │                                    [Editar] [×]    │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  │                                                          │  │
│  │  [+ Agregar Campo]                                       │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  [Vista Previa del Formulario]      [Guardar Cambios]    │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

#### Add/Edit Field Dialog

```
┌─────────────────────────────────────────────────────────────────┐
│  Agregar Nuevo Campo                                        [×] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Nombre del Campo *                                             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Score de Crédito                                        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Identificador (automático): creditScore                        │
│                                                                 │
│  Tipo de Campo *                                                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Score (300-850)                                      ▼  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Sección *                                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Análisis Crediticio                                  ▼  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ☑ Campo requerido                                              │
│                                                                 │
│  Texto de ayuda (opcional)                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Ingrese el score del buró de crédito                    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ▼ Opciones Avanzadas                                           │
│    ┌─────────────────────────────────────────────────────┐     │
│    │ Valor mínimo: [300]  Valor máximo: [850]            │     │
│    │ Placeholder: [Ej: 650]                              │     │
│    └─────────────────────────────────────────────────────┘     │
│                                                                 │
│                               [Cancelar]    [Guardar Campo]     │
└─────────────────────────────────────────────────────────────────┘
```

#### Field Type Selector (Visual)

```
┌─────────────────────────────────────────────────────────────────┐
│  Seleccionar Tipo de Campo                                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  [Aa]       │  │  [¶]        │  │  [123]      │             │
│  │  Texto      │  │  Texto      │  │  Número     │             │
│  │  Corto      │  │  Largo      │  │             │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  [$]        │  │  [%]        │  │  [📅]       │             │
│  │  Moneda     │  │  Porcentaje │  │  Fecha      │             │
│  │  (MXN)      │  │             │  │             │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  [▼]        │  │  [✓/✗]      │  │  [●●●]      │             │
│  │  Lista      │  │  Sí/No      │  │  Estado     │             │
│  │  Opciones   │  │             │  │  (color)    │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  [⬡]        │  │  [▦]        │  │  [🖼]        │             │
│  │  Score      │  │  Tabla      │  │  Imagen     │             │
│  │  Crédito    │  │  (filas)    │  │             │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### Form Preview

The admin can click "Vista Previa" to see exactly how the form will look:

```
┌─────────────────────────────────────────────────────────────────┐
│  Vista Previa del Formulario                                [×] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─ Información General ────────────────────────────────────┐  │
│  │                                                          │  │
│  │  Nombre Completo *                                       │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │                                                    │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  │                                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─ Análisis Crediticio ────────────────────────────────────┐  │
│  │                                                          │  │
│  │  Score de Crédito *                                      │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │ [=========●===========] 650                        │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  │  ℹ Ingrese el score del buró de crédito                 │  │
│  │                                                          │  │
│  │  Cuentas de Crédito                                      │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │ Institución │ Tipo │ Saldo    │ Estado │           │  │  │
│  │  │─────────────┼──────┼──────────┼────────┤           │  │  │
│  │  │             │      │          │        │ [+ Fila]  │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  │                                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│                                              [Cerrar Vista]     │
└─────────────────────────────────────────────────────────────────┘
```

### Admin UI Components to Build

| Component | Description |
|-----------|-------------|
| `ReportSchemaEditor.tsx` | Main page with sections and fields list |
| `SectionList.tsx` | Drag-and-drop section manager |
| `SectionDialog.tsx` | Add/edit section modal |
| `FieldList.tsx` | Drag-and-drop field manager |
| `FieldDialog.tsx` | Add/edit field modal with type-specific options |
| `FieldTypeSelector.tsx` | Visual grid of field types |
| `TableColumnsEditor.tsx` | Configure columns for table fields |
| `OptionsEditor.tsx` | Configure options for select/status fields |
| `SchemaPreview.tsx` | Live preview of the form |
| `ValidationRulesEditor.tsx` | Configure min/max/pattern rules |

### Admin Workflow Step-by-Step

#### To Add a New Field:

1. Go to **Admin Panel** → **Servicios**
2. Click on the service (e.g., "PRECA Pro")
3. Click **"Configurar Formulario de Reporte"**
4. Click **"+ Agregar Campo"**
5. Fill in:
   - Nombre del campo (e.g., "Ingresos Mensuales")
   - Seleccionar tipo (e.g., "Moneda")
   - Seleccionar sección (e.g., "Información Financiera")
   - Marcar si es requerido
6. Click **"Guardar Campo"**
7. Click **"Guardar Cambios"** (main screen)

#### To Reorder Fields:

1. Drag the **☰** handle on the field card
2. Drop in the new position
3. Click **"Guardar Cambios"**

#### To Preview Changes:

1. Click **"Vista Previa del Formulario"**
2. Review how the form looks
3. Close preview and make adjustments if needed

---

## Developer Responsibilities

The developer handles the **one-time setup** and **PDF template creation**.

### Initial Setup (Done Once Per Service)

```typescript
// Developer creates the initial schema via database seed
// File: prisma/seeds/report-schemas/preca-pro.ts

export const precaProSchema = {
  version: "1.0",
  templateId: "preca-pro-pfae",
  sections: [
    { id: "general", title: "Información General", order: 1 },
    { id: "credit", title: "Análisis Crediticio", order: 2 },
  ],
  fields: [
    // Initial fields...
  ]
};
```

### PDF Template Creation (Done Once Per Service)

```bash
# Developer creates the Handlebars template
src/templates/reports/preca-pro-pfae.hbs
src/templates/reports/preca-pro-pm.hbs  # If business variant needed
```

### When Admin Needs Layout Changes

If the admin needs changes to the **PDF appearance** (colors, fonts, layout):

**For body content changes:**
1. Admin requests change (e.g., "Add a new section for employment history")
2. Developer modifies the `.hbs` template
3. Developer deploys the change
4. PDF generation uses new layout immediately

**For header/footer changes:**
1. Admin requests change (e.g., "Change the header bar colors")
2. Developer modifies `PuppeteerPdfGeneratorService.ts`
3. Developer deploys the change
4. All PDFs will use the new header/footer

---

## Implementation Checklist

### Phase 1: Build Admin UI (Developer)

- [ ] Create `ReportSchemaEditor` page at `/admin/services/[id]/report-schema`
- [ ] Implement `SectionList` with drag-and-drop
- [ ] Implement `FieldList` with drag-and-drop
- [ ] Create `FieldDialog` with all field type options
- [ ] Create `FieldTypeSelector` visual picker
- [ ] Implement `SchemaPreview` component
- [ ] Add save/load API integration
- [ ] Add validation and error handling

### Phase 2: Create Templates (Developer)

For each of the 10 services:

- [x] Header/footer implemented (Puppeteer native - shared across all templates)
- [x] Folio auto-generation implemented (YYYYMMDD-XXXX format)
- [ ] Create `.hbs` body template file for each service
- [ ] Add shared partials (styles, credit-score, signature-block, etc.)
- [ ] Test PDF generation

### Phase 3: Configure Services (Admin via UI)

Once the Admin UI is built, the admin can:

- [ ] Configure fields for Service 1
- [ ] Configure fields for Service 2
- [ ] ... (repeat for all 10 services)
- [ ] Test each service's report generation

### Service Template Planning

| # | Service | Template | Admin Configures |
|---|---------|----------|------------------|
| 1 | PRECA Basic | `preca-basic-pfae.hbs` | 5-10 fields |
| 2 | PRECA Pro | `preca-pro-pfae.hbs` | 15-20 fields |
| 3 | PRECA Premium | `preca-premium-pfae.hbs` | 25+ fields |
| 4 | Credit Check | `credit-check-pfae.hbs` | 5-10 fields |
| 5 | Background | `background-check-pfae.hbs` | 10-15 fields |
| 6 | Employment | `employment-verify-pfae.hbs` | 5-10 fields |
| 7 | Reference | `reference-check-pfae.hbs` | 5-10 fields |
| 8 | Income | `income-verify-pfae.hbs` | 10-15 fields |
| 9 | Identity | `identity-verify-pfae.hbs` | 5-10 fields |
| 10 | Full | `full-screening-pfae.hbs` | 25+ fields |

---

## Summary

| Question | Answer |
|----------|--------|
| Who creates PDF templates? | **Developer** (requires code + deploy) |
| Who configures form fields? | **Admin** (via visual UI, no code needed) |
| Does admin need to write code? | **No** |
| Does admin need API knowledge? | **No** |
| Can admin add/remove/reorder fields? | **Yes** (via drag-and-drop UI) |
| Can admin change PDF layout? | **No** (must request from developer) |
| Where is field config stored? | **Database** (service_catalog.report_schema) |
| Where is PDF body layout stored? | **Code** (src/templates/reports/*.hbs) |
| Where is header/footer stored? | **Code** (PuppeteerPdfGeneratorService.ts) |
| How do headers/footers repeat? | **Puppeteer native** (headerTemplate/footerTemplate) |
| What format is the folio? | **Auto-generated** (YYYYMMDD-XXXX) |
