# PDF Templates Specification

This document defines all PDF report templates, their fields, and how they map to services.

---

## Table of Contents

1. [Services Overview](#services-overview)
2. [Template Mapping](#template-mapping)
3. [Template: PRECA Básica PFAE](#template-preca-básica-pfae)
4. [Template: PRECA Básica PM](#template-preca-básica-pm)
5. [Template: PRECA Pro PFAE](#template-preca-pro-pfae)
6. [Template: PRECA Pro PM](#template-preca-pro-pm)
7. [Services Without Reports](#services-without-reports)
8. [Shared Elements](#shared-elements)

---

## Services Overview

| ID | Code | Name | Person Type | Template | Has Report |
|----|------|------|-------------|----------|------------|
| 7 | PRECA_BASICA_FISICA | PRECA Básica Física | PFAE | `preca-basica-pfae` | Yes |
| 9 | PRECA_BASICA_MORAL | PRECA Básica Moral | PM | `preca-basica-pm` | Yes |
| 12 | PRECA_PRO_FISICA | PRECA Pro Física | PFAE | `preca-pro-pfae` | Yes |
| 16 | PRECA_PRO_MORAL | PRECA Pro Moral | PM | `preca-pro-pm` | Yes |
| 18 | PRECA_COMPLETA_FISICA | PRECA Completa Física | PFAE | `preca-pro-pfae` | Yes (same as Pro) |
| 20 | PRECA_COMPLETA_MORAL | PRECA Completa Moral | PM | `preca-pro-pm` | Yes (same as Pro) |
| 25 | PRECA_INE_FISICA | PRECA INE Física | PFAE | - | No |
| 26 | PRECA_INE_MORAL | PRECA INE Moral | PM | - | No |
| 52 | PRECA_EXTRANJEROS | PRECA Extranjeros | PM | - | No |

---

## Template Mapping

```
┌─────────────────────────────────────────────────────────────────────┐
│                        TEMPLATES (4 total)                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  preca-basica-pfae.hbs ←── PRECA_BASICA_FISICA (ID: 7)             │
│                                                                     │
│  preca-basica-pm.hbs ←── PRECA_BASICA_MORAL (ID: 9)                │
│                                                                     │
│  preca-pro-pfae.hbs ←── PRECA_PRO_FISICA (ID: 12)                  │
│                      ←── PRECA_COMPLETA_FISICA (ID: 18)            │
│                                                                     │
│  preca-pro-pm.hbs ←── PRECA_PRO_MORAL (ID: 16)                     │
│                   ←── PRECA_COMPLETA_MORAL (ID: 20)                │
│                                                                     │
│  (No template) ←── PRECA_INE_FISICA (ID: 25)                       │
│                ←── PRECA_INE_MORAL (ID: 26)                        │
│                ←── PRECA_EXTRANJEROS (ID: 52)                      │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Template: PRECA Básica PFAE

**File:** `src/templates/reports/preca-basica-pfae.hbs`
**Services:** PRECA_BASICA_FISICA (ID: 7)

### Content Structure

```
┌─────────────────────────────────────────────────────────────────────┐
│ [HEADER - Puppeteer native]                                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ Le informamos que el solicitante "{applicantName}"                  │
│ resultó con una probabilidad de pago del "{paymentProbability}%"    │
│                                                                     │
│ "{bureauCommitmentsText}"                                           │
│ Example: "Pagos comprometidos en buró de crédito mensualmente       │
│ $6,234.00 (Seis Mil Doscientos Treinta y Cuatro Pesos 00/100 M.N.)" │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ Dentro de los antecedentes de juicios, se encontró que con el       │
│ nombre "{applicantName}" se encuentran los siguientes:              │
│                                                                     │
│ {legalRecordsList}                                                  │
│ • Juicio 1...                                                       │
│ • Juicio 2...                                                       │
│ (or "No se encontraron antecedentes")                               │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ Se anexa el reporte de validación de identidad con reconocimiento   │
│ facial, reporte de buró de crédito y el correo electrónico.         │
│ ({applicantEmail})                                                  │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ [CONFIDENTIALITY DISCLAIMER - Static text]                          │
│                                                                     │
│ Preca valida por 90 días, a partir de la fecha de elaboración.      │
│                                                                     │
│ Para solicitar autentificación de la Preca, llamar al número        │
│ 961 550 8233 o al 961 550 8234.                                     │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│ [FOOTER - Puppeteer native]                                         │
└─────────────────────────────────────────────────────────────────────┘
```

### Fields Schema

| Field ID | Name | Label | Type | Required | Notes |
|----------|------|-------|------|----------|-------|
| `payment_probability` | paymentProbability | Probabilidad de Pago | percentage | Yes | 0-100% |
| `bureau_commitments_text` | bureauCommitmentsText | Compromisos en Buró | textarea | Yes | Full text with amount in words |
| `legal_records_list` | legalRecordsList | Antecedentes de Juicios | textarea | Yes | List of legal records or "No se encontraron" |

### Schema JSON

```json
{
  "version": "1.0",
  "templateId": "preca-basica-pfae",
  "sections": [
    { "id": "credit", "title": "Información Crediticia", "order": 1 },
    { "id": "legal", "title": "Antecedentes Legales", "order": 2 }
  ],
  "fields": [
    {
      "id": "payment_probability",
      "name": "paymentProbability",
      "label": "Probabilidad de Pago (%)",
      "type": "percentage",
      "required": true,
      "section": "credit",
      "order": 1,
      "helpText": "Porcentaje de probabilidad de pago del solicitante"
    },
    {
      "id": "bureau_commitments_text",
      "name": "bureauCommitmentsText",
      "label": "Compromisos en Buró de Crédito",
      "type": "textarea",
      "required": true,
      "section": "credit",
      "order": 2,
      "placeholder": "Pagos comprometidos en buró de crédito mensualmente $X,XXX.00 (Cantidad en letra Pesos 00/100 M.N.)",
      "helpText": "Texto completo con monto en número y letra"
    },
    {
      "id": "legal_records_list",
      "name": "legalRecordsList",
      "label": "Antecedentes de Juicios",
      "type": "textarea",
      "required": true,
      "section": "legal",
      "order": 3,
      "placeholder": "No se encontraron antecedentes de juicios",
      "helpText": "Lista de juicios encontrados o indicar que no se encontraron"
    }
  ]
}
```

---

## Template: PRECA Básica PM

**File:** `src/templates/reports/preca-basica-pm.hbs`
**Services:** PRECA_BASICA_MORAL (ID: 9)

### Content Structure

```
┌─────────────────────────────────────────────────────────────────────┐
│ [HEADER - Puppeteer native]                                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ Le informamos que el solicitante "{applicantName}"                  │
│ "{creditHistoryText}"                                               │
│ Example: "No cuenta con historial crediticio."                      │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ Dentro de los antecedentes de reportes del SAT y de juicios,        │
│ se encontró que con el nombre de "{applicantName}" se encuentran    │
│ lo siguiente:                                                       │
│                                                                     │
│ "{satAndLegalFindings}"                                             │
│ Example: "DENTRO DE LA BUSQUEDA DE INCONSISTENCIA DE DATOS,         │
│ SERVIDORES PUBLICOS SANCIONADOS, FUNCIONARIOS PÚBLICOS, SAT 69,     │
│ SAT 69-B, ACTIVIDADES VULNERABLES, FGJ, FGR, COMUNICADOS FGR,       │
│ INTERPOL, INFORMACION DE JUICIOS, INFORMACION DE JUICIOS PENALES:   │
│ No existe información reportada."                                   │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ Dentro de la información del SAT de empresas reportadas se          │
│ hicieron las siguientes búsquedas:                                  │
│                                                                     │
│ [satSearchImages - 3 images]                                        │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ Se anexa el reporte de validación de identidad con reconocimiento   │
│ facial al representante legal y el reporte de buró de crédito       │
│ de la empresa.                                                      │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ [CONFIDENTIALITY DISCLAIMER - Static text]                          │
│                                                                     │
│ Preca valida por 90 días, a partir de la fecha de elaboración.      │
│                                                                     │
│ Para solicitar autentificación de la Preca, llamar al número        │
│ 961 550 8233 o al 961 550 8234.                                     │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│ [FOOTER - Puppeteer native]                                         │
└─────────────────────────────────────────────────────────────────────┘
```

### Fields Schema

| Field ID | Name | Label | Type | Required | Notes |
|----------|------|-------|------|----------|-------|
| `credit_history_text` | creditHistoryText | Estado de Historial Crediticio | textarea | Yes | Text about credit history |
| `sat_legal_findings` | satAndLegalFindings | Hallazgos SAT y Legales | textarea | Yes | Full text of SAT/legal search results |
| `sat_search_images` | satSearchImages | Imágenes de Búsqueda SAT | images | No | Up to 3 images |

### Schema JSON

```json
{
  "version": "1.0",
  "templateId": "preca-basica-pm",
  "sections": [
    { "id": "credit", "title": "Historial Crediticio", "order": 1 },
    { "id": "sat_legal", "title": "Antecedentes SAT y Legales", "order": 2 }
  ],
  "fields": [
    {
      "id": "credit_history_text",
      "name": "creditHistoryText",
      "label": "Estado del Historial Crediticio",
      "type": "textarea",
      "required": true,
      "section": "credit",
      "order": 1,
      "placeholder": "No cuenta con historial crediticio.",
      "helpText": "Describir el estado del historial crediticio de la empresa"
    },
    {
      "id": "sat_legal_findings",
      "name": "satAndLegalFindings",
      "label": "Hallazgos en SAT y Antecedentes Legales",
      "type": "textarea",
      "required": true,
      "section": "sat_legal",
      "order": 2,
      "placeholder": "DENTRO DE LA BUSQUEDA DE INCONSISTENCIA DE DATOS, SERVIDORES PUBLICOS SANCIONADOS...",
      "helpText": "Resultados de búsqueda en SAT 69, SAT 69-B, FGJ, FGR, INTERPOL, etc."
    },
    {
      "id": "sat_search_images",
      "name": "satSearchImages",
      "label": "Imágenes de Búsqueda SAT",
      "type": "images",
      "required": false,
      "section": "sat_legal",
      "order": 3,
      "helpText": "Capturas de pantalla de las búsquedas en SAT (máximo 3)",
      "validation": { "maxItems": 3 }
    }
  ]
}
```

---

## Template: PRECA Pro PFAE

**File:** `src/templates/reports/preca-pro-pfae.hbs`
**Services:** PRECA_PRO_FISICA (ID: 12), PRECA_COMPLETA_FISICA (ID: 18)

### Content Structure

```
┌─────────────────────────────────────────────────────────────────────┐
│ [HEADER - Puppeteer native]                                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ [INTRO TEXT - Static]                                               │
│ En PRECA hemos desarrollado nuestro "Módulo de evaluación de        │
│ prospecto a inquilinos" único en el mercado inmobiliario del país.  │
│ Con el mismo, evaluamos 7 características del prospecto y damos     │
│ como resultado una puntuación que nos dice el rankeo del            │
│ interesado y las recomendaciones de rentarle o no, así como,        │
│ los requerimientos sugeridos a solicitar como requisitos.           │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ [EVALUATION RESULT]                                                 │
│ De acuerdo a la información proporcionada por el solicitante        │
│ "{applicantName}", la cual le recomendamos sea verificada con       │
│ documentos, resultó con una puntuación de: "{scoreRange}"           │
│ dando un rankeo de prospecto "{ranking}" con un riesgo "{riskLevel}"│
│ y le recomendamos "{recommendation}".                               │
│ {recommendationDetails}                                             │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ [RANKING TABLE - Static reference]                                  │
│ ┌─────────┬───────────┬────────────┬───────────┬─────────────────┐ │
│ │ RANKEO  │ RIESGO    │ OTORGAR    │ PUNTUACIÓN│ ACCIÓN SUGERIDA │ │
│ ├─────────┼───────────┼────────────┼───────────┼─────────────────┤ │
│ │ AAA     │ MARGINAL  │ SI         │ 90+       │ Contrato+Pagaré │ │
│ │ A       │ MINIMO    │ SI         │ 80-89     │ Contrato+Pagaré │ │
│ │ B       │ MODERADO  │ SI         │ 70-79     │ +Obl.Sol s/Buró │ │
│ │ C       │ MEDIO     │ SI         │ 60-69     │ +Obl.Sol c/PRECA│ │
│ │ D       │ ALTO      │ A CRITERIO │ 50-59     │ +Garantía Prend.│ │
│ │ E       │ NO CALIFICA│ NO        │ 0-49      │ -               │ │
│ └─────────┴───────────┴────────────┴───────────┴─────────────────┘ │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ ASPECTOS ANALIZADOS:                                                │
│                                                                     │
│ 1.- LIQUIDEZ Y APALANCAMIENTO                                       │
│ El prospecto tiene un factor de capacidad de pago del               │
│ "{paymentCapacityFactor}". Sus ingresos son "{incomeComparison}"    │
│ {liquidityAnalysisText}                                             │
│                                                                     │
│ [PAYMENT CAPACITY TABLE]                                            │
│ ┌──────────┬──────────────┬─────────┬──────────┬──────────────────┐│
│ │ RENTA    │ COMPROMETIDO │ TOTAL   │ INGRESOS │ CAPACIDAD PAGO   ││
│ │ {rent}   │ {committed}  │ {total} │ {income} │ {capacityFactor} ││
│ └──────────┴──────────────┴─────────┴──────────┴──────────────────┘│
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ 2.- ANTECEDENTES CREDITICIOS                                        │
│ El Titular cuenta con un score de "{creditScore}".                  │
│ CON UNA PROBABILIDAD DE PAGO DEL "{paymentProbability}%".           │
│ {creditHistoryText}                                                 │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ 3.- ANTECEDENTES LEGALES                                            │
│ Dentro de los antecedentes de juicios, se encontró que con el       │
│ nombre de "{applicantName}" se encuentran los siguientes:           │
│ {legalRecordsList}                                                  │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ 4.- PROCEDENCIA Y MOVILIDAD                                         │
│ {originAndMobilityText}                                             │
│ Example: "El titular es oriundo de CHIAPAS, tiene 2 domicilios      │
│ reportados... Y en la localidad tiene 168 meses de residencia."     │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ 5.- ANÁLISIS DEL SECTOR DONDE SE DESARROLLA                         │
│ El titular tiene laborando "{employmentMonths}" meses en su         │
│ actual trabajo.                                                     │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ 6.- ECONOMÍA FAMILIAR                                               │
│ El Titular tiene "{dependents}" dependientes económicos.            │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ 7.- EDAD                                                            │
│ El prospecto tiene "{age}" años de edad.                            │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ Se anexa el reporte de validación de identidad con reconocimiento   │
│ facial, reporte de buró de crédito y verificación del correo        │
│ electrónico. ({applicantEmail})                                     │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ Se hacen las siguientes recomendaciones:                            │
│ {recommendationsList}                                               │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ [CONFIDENTIALITY DISCLAIMER - Static text]                          │
│                                                                     │
│ Preca valida por 60 días, a partir de la fecha de elaboración.      │
│                                                                     │
│ Para solicitar autentificación de la Preca, llamar al número        │
│ 961 550 8233 o al 961 550 8234.                                     │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│ [FOOTER - Puppeteer native]                                         │
└─────────────────────────────────────────────────────────────────────┘
```

### Fields Schema

| Field ID | Name | Label | Type | Required | Section | Notes |
|----------|------|-------|------|----------|---------|-------|
| `score` | score | Puntuación | number | Yes | evaluation | 0-100 |
| `score_range` | scoreRange | Rango de Puntuación | text | Yes | evaluation | e.g., "80 - 89" |
| `ranking` | ranking | Rankeo | select | Yes | evaluation | AAA, A, B, C, D, E |
| `risk_level` | riskLevel | Nivel de Riesgo | select | Yes | evaluation | MARGINAL, MINIMO, etc. |
| `recommendation` | recommendation | Recomendación | select | Yes | evaluation | SI/NO/A CRITERIO |
| `recommendation_details` | recommendationDetails | Detalles de Recomendación | textarea | Yes | evaluation | Full recommendation text |
| `rent_amount` | rentAmount | Monto de Renta | currency | Yes | liquidity | Monthly rent |
| `committed_amount` | committedAmount | Comprometido en Buró | currency | Yes | liquidity | Monthly bureau commitments |
| `income_amount` | incomeAmount | Ingresos Mensuales | currency | Yes | liquidity | Monthly income |
| `payment_capacity_factor` | paymentCapacityFactor | Factor de Capacidad de Pago | number | Yes | liquidity | e.g., 2.18 |
| `income_comparison` | incomeComparison | Comparación de Ingresos | text | Yes | liquidity | e.g., "2.2 mayores" |
| `liquidity_analysis_text` | liquidityAnalysisText | Análisis de Liquidez | textarea | No | liquidity | Additional text |
| `credit_score` | creditScore | Score de Crédito | score | Yes | credit | 300-850 |
| `payment_probability` | paymentProbability | Probabilidad de Pago | percentage | Yes | credit | 0-100% |
| `credit_history_text` | creditHistoryText | Historial Crediticio | textarea | Yes | credit | Full credit history text |
| `legal_records_list` | legalRecordsList | Antecedentes Legales | textarea | Yes | legal | List of legal records |
| `origin_mobility_text` | originAndMobilityText | Procedencia y Movilidad | textarea | Yes | mobility | Full address history text |
| `employment_months` | employmentMonths | Meses en Trabajo Actual | number | Yes | employment | Months employed |
| `dependents` | dependents | Dependientes Económicos | number | Yes | family | Number of dependents |
| `age` | age | Edad | number | Yes | age | Years old |
| `recommendations_list` | recommendationsList | Lista de Recomendaciones | textarea | No | final | Bullet list |

### Schema JSON

```json
{
  "version": "1.0",
  "templateId": "preca-pro-pfae",
  "sections": [
    { "id": "evaluation", "title": "Resultado de Evaluación", "order": 1 },
    { "id": "liquidity", "title": "1. Liquidez y Apalancamiento", "order": 2 },
    { "id": "credit", "title": "2. Antecedentes Crediticios", "order": 3 },
    { "id": "legal", "title": "3. Antecedentes Legales", "order": 4 },
    { "id": "mobility", "title": "4. Procedencia y Movilidad", "order": 5 },
    { "id": "employment", "title": "5. Análisis del Sector", "order": 6 },
    { "id": "family", "title": "6. Economía Familiar", "order": 7 },
    { "id": "age", "title": "7. Edad", "order": 8 },
    { "id": "final", "title": "Recomendaciones Finales", "order": 9 }
  ],
  "fields": [
    {
      "id": "score",
      "name": "score",
      "label": "Puntuación Final",
      "type": "number",
      "required": true,
      "section": "evaluation",
      "order": 1,
      "validation": { "min": 0, "max": 100 },
      "helpText": "Puntuación del 0 al 100"
    },
    {
      "id": "ranking",
      "name": "ranking",
      "label": "Rankeo",
      "type": "select",
      "required": true,
      "section": "evaluation",
      "order": 2,
      "options": [
        { "value": "AAA", "label": "AAA - Marginal" },
        { "value": "A", "label": "A - Mínimo" },
        { "value": "B", "label": "B - Moderado" },
        { "value": "C", "label": "C - Medio" },
        { "value": "D", "label": "D - Alto" },
        { "value": "E", "label": "E - No Califica" }
      ]
    },
    {
      "id": "risk_level",
      "name": "riskLevel",
      "label": "Nivel de Riesgo",
      "type": "select",
      "required": true,
      "section": "evaluation",
      "order": 3,
      "options": [
        { "value": "MARGINAL", "label": "Marginal" },
        { "value": "MINIMO", "label": "Mínimo" },
        { "value": "MODERADO", "label": "Moderado" },
        { "value": "MEDIO", "label": "Medio" },
        { "value": "ALTO", "label": "Alto" },
        { "value": "NO_CALIFICA", "label": "No Califica" }
      ]
    },
    {
      "id": "rent_recommendation",
      "name": "rentRecommendation",
      "label": "Recomendación de Renta",
      "type": "select",
      "required": true,
      "section": "evaluation",
      "order": 4,
      "options": [
        { "value": "SI", "label": "SI rentarle" },
        { "value": "NO", "label": "NO rentarle" },
        { "value": "A_CRITERIO", "label": "A criterio" }
      ]
    },
    {
      "id": "recommendation_details",
      "name": "recommendationDetails",
      "label": "Detalles de Recomendación",
      "type": "textarea",
      "required": true,
      "section": "evaluation",
      "order": 5,
      "placeholder": "SI rentarle con los siguientes requisitos: FIRMA DE CONTRATO, PAGARES Y OBLIGADO SOLIDARIO."
    },
    {
      "id": "rent_amount",
      "name": "rentAmount",
      "label": "Monto de Renta Mensual",
      "type": "currency",
      "required": true,
      "section": "liquidity",
      "order": 6
    },
    {
      "id": "committed_amount",
      "name": "committedAmount",
      "label": "Comprometido en Buró (mensual)",
      "type": "currency",
      "required": true,
      "section": "liquidity",
      "order": 7
    },
    {
      "id": "income_amount",
      "name": "incomeAmount",
      "label": "Ingresos Mensuales",
      "type": "currency",
      "required": true,
      "section": "liquidity",
      "order": 8
    },
    {
      "id": "payment_capacity_factor",
      "name": "paymentCapacityFactor",
      "label": "Factor de Capacidad de Pago",
      "type": "number",
      "required": true,
      "section": "liquidity",
      "order": 9,
      "helpText": "Ingresos / (Renta + Comprometido). El factor ideal es 4."
    },
    {
      "id": "liquidity_analysis_text",
      "name": "liquidityAnalysisText",
      "label": "Análisis de Liquidez (texto adicional)",
      "type": "textarea",
      "required": false,
      "section": "liquidity",
      "order": 10,
      "placeholder": "Sus ingresos son X veces mayores a la suma de la renta más sus gastos mensuales comprometidos en buró."
    },
    {
      "id": "credit_score",
      "name": "creditScore",
      "label": "Score de Buró de Crédito",
      "type": "score",
      "required": true,
      "section": "credit",
      "order": 11,
      "validation": { "min": 300, "max": 850 }
    },
    {
      "id": "payment_probability",
      "name": "paymentProbability",
      "label": "Probabilidad de Pago (%)",
      "type": "percentage",
      "required": true,
      "section": "credit",
      "order": 12
    },
    {
      "id": "credit_history_text",
      "name": "creditHistoryText",
      "label": "Historial Crediticio",
      "type": "textarea",
      "required": true,
      "section": "credit",
      "order": 13,
      "placeholder": "Tienen registro en buró de crédito desde el año 2021, tiene 6 cuentas abiertas el cual los ha pagado de manera puntual."
    },
    {
      "id": "legal_records_list",
      "name": "legalRecordsList",
      "label": "Antecedentes de Juicios",
      "type": "textarea",
      "required": true,
      "section": "legal",
      "order": 14,
      "placeholder": "No se encontraron antecedentes de juicios"
    },
    {
      "id": "origin_mobility_text",
      "name": "originAndMobilityText",
      "label": "Procedencia y Movilidad",
      "type": "textarea",
      "required": true,
      "section": "mobility",
      "order": 15,
      "placeholder": "El titular es oriundo de CHIAPAS, tiene 2 domicilios reportados..."
    },
    {
      "id": "employment_months",
      "name": "employmentMonths",
      "label": "Meses en Trabajo Actual",
      "type": "number",
      "required": true,
      "section": "employment",
      "order": 16
    },
    {
      "id": "dependents",
      "name": "dependents",
      "label": "Dependientes Económicos",
      "type": "number",
      "required": true,
      "section": "family",
      "order": 17
    },
    {
      "id": "age",
      "name": "age",
      "label": "Edad del Prospecto",
      "type": "number",
      "required": true,
      "section": "age",
      "order": 18
    },
    {
      "id": "recommendations_list",
      "name": "recommendationsList",
      "label": "Recomendaciones Adicionales",
      "type": "textarea",
      "required": false,
      "section": "final",
      "order": 19,
      "placeholder": "• Recomendación 1\n• Recomendación 2"
    }
  ]
}
```

---

## Template: PRECA Pro PM

**File:** `src/templates/reports/preca-pro-pm.hbs`
**Services:** PRECA_PRO_MORAL (ID: 16), PRECA_COMPLETA_MORAL (ID: 20)

### Content Structure

```
┌─────────────────────────────────────────────────────────────────────┐
│ [HEADER - Puppeteer native]                                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ [INTRO TEXT - Static, same as Pro PFAE]                             │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ [EVALUATION RESULT - Same structure as Pro PFAE]                    │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ [RANKING TABLE - Static, same as Pro PFAE]                          │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ ASPECTOS ANALIZADOS:                                                │
│                                                                     │
│ 1.- BURÓ DE CRÉDITO                                                 │
│ Cuenta con {activeCredits} Créditos Activos.                        │
│ Tiene {settledCredits} Créditos liquidados, {settledCreditsText}    │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ 2.- TIPO DE CARTERA                                                 │
│ La Persona Moral cuenta con un tipo de cartera "{portfolioType}".   │
│ Tiene {onTimeAccounts} cuentas que ha pagado de manera PUNTUAL y    │
│ {lateAccounts} cuentas que ha pagado de manera impuntual.           │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ 3.- ANTECEDENTES LEGALES                                            │
│ Dentro de los antecedentes de juicios, se encontró que con el       │
│ nombre "{applicantName}" se encuentran los siguientes:              │
│ {legalRecordsList}                                                  │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ 4.- TIEMPO DE RESIDENCIA EN LA LOCALIDAD                            │
│ La persona moral tiene "{residenceMonths}" meses de residencia      │
│ en la localidad ("{localityName}").                                 │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ 5.- NÚMERO DE INMUEBLES QUE RENTAN                                  │
│ La persona moral tiene "{rentedProperties}" inmuebles en            │
│ arrendamiento. Le recomendamos pedir referencias a los              │
│ propietarios de estos inmuebles.                                    │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ 6.- TAMAÑO DE EMPRESA POR NÚMERO DE TRABAJADORES                    │
│ La persona moral cuenta con "{employeeCount}" trabajadores.         │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ 7.- EDAD DE LA EMPRESA                                              │
│ El prospecto tiene "{companyAge}" años de edad.                     │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ [ATTACHMENTS TEXT + RECOMMENDATIONS - Same as Pro PFAE]             │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ [CONFIDENTIALITY DISCLAIMER - Static]                               │
│                                                                     │
│ Preca valida por 90 días, a partir de la fecha de elaboración.      │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│ [FOOTER - Puppeteer native]                                         │
└─────────────────────────────────────────────────────────────────────┘
```

### Fields Schema

| Field ID | Name | Label | Type | Required | Section | Notes |
|----------|------|-------|------|----------|---------|-------|
| `score` | score | Puntuación | number | Yes | evaluation | 0-100 |
| `ranking` | ranking | Rankeo | select | Yes | evaluation | AAA to E |
| `risk_level` | riskLevel | Nivel de Riesgo | select | Yes | evaluation | |
| `rent_recommendation` | rentRecommendation | Recomendación | select | Yes | evaluation | |
| `recommendation_details` | recommendationDetails | Detalles | textarea | Yes | evaluation | |
| `active_credits` | activeCredits | Créditos Activos | number | Yes | bureau | |
| `settled_credits` | settledCredits | Créditos Liquidados | number | Yes | bureau | |
| `settled_credits_text` | settledCreditsText | Detalles de Pago | textarea | No | bureau | |
| `portfolio_type` | portfolioType | Tipo de Cartera | text | Yes | portfolio | |
| `on_time_accounts` | onTimeAccounts | Cuentas Puntuales | number | Yes | portfolio | |
| `late_accounts` | lateAccounts | Cuentas Impuntuales | number | Yes | portfolio | |
| `legal_records_list` | legalRecordsList | Antecedentes Legales | textarea | Yes | legal | |
| `residence_months` | residenceMonths | Meses de Residencia | number | Yes | residence | |
| `locality_name` | localityName | Localidad | text | Yes | residence | |
| `rented_properties` | rentedProperties | Inmuebles en Arrendamiento | number | Yes | properties | |
| `employee_count` | employeeCount | Número de Trabajadores | number | Yes | size | |
| `company_age` | companyAge | Edad de la Empresa (años) | number | Yes | age | |
| `recommendations_list` | recommendationsList | Recomendaciones | textarea | No | final | |

### Schema JSON

```json
{
  "version": "1.0",
  "templateId": "preca-pro-pm",
  "sections": [
    { "id": "evaluation", "title": "Resultado de Evaluación", "order": 1 },
    { "id": "bureau", "title": "1. Buró de Crédito", "order": 2 },
    { "id": "portfolio", "title": "2. Tipo de Cartera", "order": 3 },
    { "id": "legal", "title": "3. Antecedentes Legales", "order": 4 },
    { "id": "residence", "title": "4. Tiempo de Residencia", "order": 5 },
    { "id": "properties", "title": "5. Inmuebles en Arrendamiento", "order": 6 },
    { "id": "size", "title": "6. Tamaño de Empresa", "order": 7 },
    { "id": "age", "title": "7. Edad de la Empresa", "order": 8 },
    { "id": "final", "title": "Recomendaciones Finales", "order": 9 }
  ],
  "fields": [
    {
      "id": "score",
      "name": "score",
      "label": "Puntuación Final",
      "type": "number",
      "required": true,
      "section": "evaluation",
      "order": 1,
      "validation": { "min": 0, "max": 100 }
    },
    {
      "id": "ranking",
      "name": "ranking",
      "label": "Rankeo",
      "type": "select",
      "required": true,
      "section": "evaluation",
      "order": 2,
      "options": [
        { "value": "AAA", "label": "AAA - Marginal" },
        { "value": "A", "label": "A - Mínimo" },
        { "value": "B", "label": "B - Moderado" },
        { "value": "C", "label": "C - Medio" },
        { "value": "D", "label": "D - Alto" },
        { "value": "E", "label": "E - No Califica" }
      ]
    },
    {
      "id": "risk_level",
      "name": "riskLevel",
      "label": "Nivel de Riesgo",
      "type": "select",
      "required": true,
      "section": "evaluation",
      "order": 3,
      "options": [
        { "value": "MARGINAL", "label": "Marginal" },
        { "value": "MINIMO", "label": "Mínimo" },
        { "value": "MODERADO", "label": "Moderado" },
        { "value": "MEDIO", "label": "Medio" },
        { "value": "ALTO", "label": "Alto" },
        { "value": "NO_CALIFICA", "label": "No Califica" }
      ]
    },
    {
      "id": "rent_recommendation",
      "name": "rentRecommendation",
      "label": "Recomendación de Renta",
      "type": "select",
      "required": true,
      "section": "evaluation",
      "order": 4,
      "options": [
        { "value": "SI", "label": "SI rentarle" },
        { "value": "NO", "label": "NO rentarle" },
        { "value": "A_CRITERIO", "label": "A criterio" }
      ]
    },
    {
      "id": "recommendation_details",
      "name": "recommendationDetails",
      "label": "Detalles de Recomendación",
      "type": "textarea",
      "required": true,
      "section": "evaluation",
      "order": 5
    },
    {
      "id": "active_credits",
      "name": "activeCredits",
      "label": "Créditos Activos",
      "type": "number",
      "required": true,
      "section": "bureau",
      "order": 6
    },
    {
      "id": "settled_credits",
      "name": "settledCredits",
      "label": "Créditos Liquidados",
      "type": "number",
      "required": true,
      "section": "bureau",
      "order": 7
    },
    {
      "id": "settled_credits_text",
      "name": "settledCreditsText",
      "label": "Detalles de Pagos",
      "type": "textarea",
      "required": false,
      "section": "bureau",
      "order": 8,
      "placeholder": "Los ha pagado de manera puntual"
    },
    {
      "id": "portfolio_type",
      "name": "portfolioType",
      "label": "Tipo de Cartera",
      "type": "text",
      "required": true,
      "section": "portfolio",
      "order": 9
    },
    {
      "id": "on_time_accounts",
      "name": "onTimeAccounts",
      "label": "Cuentas con Pago Puntual",
      "type": "number",
      "required": true,
      "section": "portfolio",
      "order": 10
    },
    {
      "id": "late_accounts",
      "name": "lateAccounts",
      "label": "Cuentas con Pago Impuntual",
      "type": "number",
      "required": true,
      "section": "portfolio",
      "order": 11
    },
    {
      "id": "legal_records_list",
      "name": "legalRecordsList",
      "label": "Antecedentes de Juicios",
      "type": "textarea",
      "required": true,
      "section": "legal",
      "order": 12
    },
    {
      "id": "residence_months",
      "name": "residenceMonths",
      "label": "Meses de Residencia en Localidad",
      "type": "number",
      "required": true,
      "section": "residence",
      "order": 13
    },
    {
      "id": "locality_name",
      "name": "localityName",
      "label": "Nombre de la Localidad",
      "type": "text",
      "required": true,
      "section": "residence",
      "order": 14
    },
    {
      "id": "rented_properties",
      "name": "rentedProperties",
      "label": "Inmuebles en Arrendamiento",
      "type": "number",
      "required": true,
      "section": "properties",
      "order": 15
    },
    {
      "id": "employee_count",
      "name": "employeeCount",
      "label": "Número de Trabajadores",
      "type": "number",
      "required": true,
      "section": "size",
      "order": 16
    },
    {
      "id": "company_age",
      "name": "companyAge",
      "label": "Edad de la Empresa (años)",
      "type": "number",
      "required": true,
      "section": "age",
      "order": 17
    },
    {
      "id": "recommendations_list",
      "name": "recommendationsList",
      "label": "Recomendaciones Adicionales",
      "type": "textarea",
      "required": false,
      "section": "final",
      "order": 18
    }
  ]
}
```

---

## Services Without Reports

These services do NOT generate PDF reports:

| ID | Code | Name | Reason |
|----|------|------|--------|
| 25 | PRECA_INE_FISICA | PRECA INE Física | Identity verification only |
| 26 | PRECA_INE_MORAL | PRECA INE Moral | Identity verification only |
| 52 | PRECA_EXTRANJEROS | PRECA Extranjeros | No report required |

**Configuration:** These services will have `report_schema: null` in the database.

---

## Shared Elements

### Static Text Blocks

These text blocks appear in all templates and should be stored as constants:

#### Confidentiality Disclaimer (Spanish)
```
Se le hace de su conocimiento que los documentos adjuntados deben ser
confidenciales y por lo tanto NO deben ser divulgados a persona alguna
o al público en general dado que estaría violentando la privacidad de
datos personales del solicitante, de acuerdo a lo establecido en la ley
general de protección de datos personales en posesión de sujetos
obligados, publicada en el Diario Oficial de la Federación el 26 de
enero de 2017.
```

#### Validation Period
- PRECA Básica: 90 días
- PRECA Pro PFAE: 60 días
- PRECA Pro PM: 90 días
- PRECA Completa: Same as Pro

#### Contact Information
```
Para solicitar autentificación de la Preca, llamar al número
961 550 8233 o al 961 550 8234.
```

### Ranking Table (Pro Templates)

This is a static reference table shown in all Pro/Completa templates:

| RANKEO | RIESGO | OTORGAMIENTO | PUNTUACIÓN | ACCIÓN SUGERIDA | PÓLIZA |
|--------|--------|--------------|------------|-----------------|--------|
| AAA | MARGINAL | SI | 90+ | Contrato, Pagarés, Obl. Solidario | SI |
| A | MINIMO | SI | 80-89 | Contrato, Pagarés, Obl. Solidario | SI |
| B | MODERADO | SI | 70-79 | Contrato, Pagarés, Obl. Sol. sin Buró | SI |
| C | MEDIO | SI | 60-69 | Contrato, Pagarés, Obl. Sol. con PRECA | SI |
| D | ALTO | A CRITERIO | 50-59 | Contrato, Pagarés, Obl. Sol. con Garantía Prendaria | A CRITERIO |
| E | NO CALIFICA | NO | 0-49 | - | NO |

---

## Implementation Summary

### Files to Create

```
src/templates/reports/
├── preca-basica-pfae.hbs    (update existing)
├── preca-basica-pm.hbs      (update existing)
├── preca-pro-pfae.hbs       (create)
├── preca-pro-pm.hbs         (create)

prisma/scripts/
├── update-report-schemas-prod.ts    (updates production DB)
├── seed-test-reports.ts             (creates test services/screenings)
```

### Database Updates

For production, update `service_catalog.report_schema` for:
- ID 7: PRECA_BASICA_FISICA → schema with templateId "preca-basica-pfae"
- ID 9: PRECA_BASICA_MORAL → schema with templateId "preca-basica-pm"
- ID 12: PRECA_PRO_FISICA → schema with templateId "preca-pro-pfae"
- ID 16: PRECA_PRO_MORAL → schema with templateId "preca-pro-pm"
- ID 18: PRECA_COMPLETA_FISICA → schema with templateId "preca-pro-pfae"
- ID 20: PRECA_COMPLETA_MORAL → schema with templateId "preca-pro-pm"
- ID 25, 26, 52: report_schema = null
