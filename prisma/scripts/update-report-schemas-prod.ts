/**
 * Production Script: Update Report Schemas
 *
 * This script updates the report_schema field for existing services in production.
 * Run with: npx ts-node prisma/scripts/update-report-schemas-prod.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================
// REPORT SCHEMAS DEFINITION
// ============================================

const PRECA_BASICA_PFAE_SCHEMA = {
  version: "1.0",
  templateId: "preca-basica-pfae",
  sections: [
    { id: "credit", title: "Información Crediticia", order: 1 },
    { id: "legal", title: "Antecedentes Legales", order: 2 }
  ],
  fields: [
    {
      id: "payment_probability",
      name: "paymentProbability",
      label: "Probabilidad de Pago (%)",
      type: "percentage",
      required: true,
      section: "credit",
      order: 1,
      helpText: "Porcentaje de probabilidad de pago del solicitante"
    },
    {
      id: "bureau_commitments_text",
      name: "bureauCommitmentsText",
      label: "Compromisos en Buró de Crédito",
      type: "textarea",
      required: true,
      section: "credit",
      order: 2,
      placeholder: "Pagos comprometidos en buró de crédito mensualmente $X,XXX.00 (Cantidad en letra Pesos 00/100 M.N.)",
      helpText: "Texto completo con monto en número y letra"
    },
    {
      id: "legal_records_list",
      name: "legalRecordsList",
      label: "Antecedentes de Juicios",
      type: "textarea",
      required: true,
      section: "legal",
      order: 3,
      placeholder: "No se encontraron antecedentes de juicios",
      helpText: "Lista de juicios encontrados o indicar que no se encontraron"
    }
  ]
};

const PRECA_BASICA_PM_SCHEMA = {
  version: "1.0",
  templateId: "preca-basica-pm",
  sections: [
    { id: "credit", title: "Historial Crediticio", order: 1 },
    { id: "sat_legal", title: "Antecedentes SAT y Legales", order: 2 }
  ],
  fields: [
    {
      id: "credit_history_text",
      name: "creditHistoryText",
      label: "Estado del Historial Crediticio",
      type: "textarea",
      required: true,
      section: "credit",
      order: 1,
      placeholder: "No cuenta con historial crediticio.",
      helpText: "Describir el estado del historial crediticio de la empresa"
    },
    {
      id: "sat_legal_findings",
      name: "satAndLegalFindings",
      label: "Hallazgos en SAT y Antecedentes Legales",
      type: "textarea",
      required: true,
      section: "sat_legal",
      order: 2,
      placeholder: "DENTRO DE LA BUSQUEDA DE INCONSISTENCIA DE DATOS, SERVIDORES PUBLICOS SANCIONADOS...",
      helpText: "Resultados de búsqueda en SAT 69, SAT 69-B, FGJ, FGR, INTERPOL, etc."
    },
    {
      id: "sat_search_images",
      name: "satSearchImages",
      label: "Imágenes de Búsqueda SAT",
      type: "images",
      required: false,
      section: "sat_legal",
      order: 3,
      helpText: "Capturas de pantalla de las búsquedas en SAT (máximo 3)",
      validation: { maxItems: 3 }
    }
  ]
};

const PRECA_PRO_PFAE_SCHEMA = {
  version: "1.0",
  templateId: "preca-pro-pfae",
  sections: [
    { id: "evaluation", title: "Resultado de Evaluación", order: 1 },
    { id: "liquidity", title: "1. Liquidez y Apalancamiento", order: 2 },
    { id: "credit", title: "2. Antecedentes Crediticios", order: 3 },
    { id: "legal", title: "3. Antecedentes Legales", order: 4 },
    { id: "mobility", title: "4. Procedencia y Movilidad", order: 5 },
    { id: "employment", title: "5. Análisis del Sector", order: 6 },
    { id: "family", title: "6. Economía Familiar", order: 7 },
    { id: "age", title: "7. Edad", order: 8 },
    { id: "final", title: "Recomendaciones Finales", order: 9 }
  ],
  fields: [
    {
      id: "score",
      name: "score",
      label: "Puntuación Final",
      type: "number",
      required: true,
      section: "evaluation",
      order: 1,
      validation: { min: 0, max: 100 },
      helpText: "Puntuación del 0 al 100"
    },
    {
      id: "ranking",
      name: "ranking",
      label: "Rankeo",
      type: "select",
      required: true,
      section: "evaluation",
      order: 2,
      options: [
        { value: "AAA", label: "AAA - Marginal" },
        { value: "A", label: "A - Mínimo" },
        { value: "B", label: "B - Moderado" },
        { value: "C", label: "C - Medio" },
        { value: "D", label: "D - Alto" },
        { value: "E", label: "E - No Califica" }
      ]
    },
    {
      id: "risk_level",
      name: "riskLevel",
      label: "Nivel de Riesgo",
      type: "select",
      required: true,
      section: "evaluation",
      order: 3,
      options: [
        { value: "MARGINAL", label: "Marginal" },
        { value: "MINIMO", label: "Mínimo" },
        { value: "MODERADO", label: "Moderado" },
        { value: "MEDIO", label: "Medio" },
        { value: "ALTO", label: "Alto" },
        { value: "NO_CALIFICA", label: "No Califica" }
      ]
    },
    {
      id: "rent_recommendation",
      name: "rentRecommendation",
      label: "Recomendación de Renta",
      type: "select",
      required: true,
      section: "evaluation",
      order: 4,
      options: [
        { value: "SI", label: "SI rentarle" },
        { value: "NO", label: "NO rentarle" },
        { value: "A_CRITERIO", label: "A criterio" }
      ]
    },
    {
      id: "recommendation_details",
      name: "recommendationDetails",
      label: "Detalles de Recomendación",
      type: "textarea",
      required: true,
      section: "evaluation",
      order: 5,
      placeholder: "SI rentarle con los siguientes requisitos: FIRMA DE CONTRATO, PAGARES Y OBLIGADO SOLIDARIO."
    },
    {
      id: "rent_amount",
      name: "rentAmount",
      label: "Monto de Renta Mensual",
      type: "currency",
      required: true,
      section: "liquidity",
      order: 6
    },
    {
      id: "committed_amount",
      name: "committedAmount",
      label: "Comprometido en Buró (mensual)",
      type: "currency",
      required: true,
      section: "liquidity",
      order: 7
    },
    {
      id: "income_amount",
      name: "incomeAmount",
      label: "Ingresos Mensuales",
      type: "currency",
      required: true,
      section: "liquidity",
      order: 8
    },
    {
      id: "total_expenses",
      name: "totalExpenses",
      label: "Total Gastos (Renta + Comprometido)",
      type: "currency",
      required: true,
      section: "liquidity",
      order: 9,
      helpText: "Suma de renta mensual más comprometido en buró"
    },
    {
      id: "payment_capacity_factor",
      name: "paymentCapacityFactor",
      label: "Factor de Capacidad de Pago",
      type: "number",
      required: true,
      section: "liquidity",
      order: 10,
      helpText: "Ingresos / (Renta + Comprometido). El factor ideal es 4."
    },
    {
      id: "income_comparison",
      name: "incomeComparison",
      label: "Comparación de Ingresos",
      type: "text",
      required: true,
      section: "liquidity",
      order: 11,
      placeholder: "2.2 veces mayores",
      helpText: "Ej: '2.2 veces mayores'"
    },
    {
      id: "liquidity_analysis_text",
      name: "liquidityAnalysisText",
      label: "Análisis de Liquidez (texto adicional)",
      type: "textarea",
      required: false,
      section: "liquidity",
      order: 12
    },
    {
      id: "credit_score",
      name: "creditScore",
      label: "Score de Buró de Crédito",
      type: "score",
      required: true,
      section: "credit",
      order: 13,
      validation: { min: 300, max: 850 }
    },
    {
      id: "payment_probability",
      name: "paymentProbability",
      label: "Probabilidad de Pago (%)",
      type: "percentage",
      required: true,
      section: "credit",
      order: 14
    },
    {
      id: "credit_history_text",
      name: "creditHistoryText",
      label: "Historial Crediticio",
      type: "textarea",
      required: true,
      section: "credit",
      order: 15,
      placeholder: "Tienen registro en buró de crédito desde el año 2021, tiene 6 cuentas abiertas el cual los ha pagado de manera puntual."
    },
    {
      id: "legal_records_list",
      name: "legalRecordsList",
      label: "Antecedentes de Juicios",
      type: "textarea",
      required: true,
      section: "legal",
      order: 16,
      placeholder: "No se encontraron antecedentes de juicios"
    },
    {
      id: "origin_mobility_text",
      name: "originAndMobilityText",
      label: "Procedencia y Movilidad",
      type: "textarea",
      required: true,
      section: "mobility",
      order: 17,
      placeholder: "El titular es oriundo de CHIAPAS, tiene 2 domicilios reportados..."
    },
    {
      id: "employment_months",
      name: "employmentMonths",
      label: "Meses en Trabajo Actual",
      type: "number",
      required: true,
      section: "employment",
      order: 18
    },
    {
      id: "dependents",
      name: "dependents",
      label: "Dependientes Económicos",
      type: "number",
      required: true,
      section: "family",
      order: 19
    },
    {
      id: "age",
      name: "age",
      label: "Edad del Prospecto",
      type: "number",
      required: true,
      section: "age",
      order: 20
    },
    {
      id: "recommendations_list",
      name: "recommendationsList",
      label: "Recomendaciones Adicionales",
      type: "textarea",
      required: false,
      section: "final",
      order: 21,
      placeholder: "• Recomendación 1\n• Recomendación 2"
    }
  ]
};

const PRECA_PRO_PM_SCHEMA = {
  version: "1.0",
  templateId: "preca-pro-pm",
  sections: [
    { id: "evaluation", title: "Resultado de Evaluación", order: 1 },
    { id: "bureau", title: "1. Buró de Crédito", order: 2 },
    { id: "portfolio", title: "2. Tipo de Cartera", order: 3 },
    { id: "legal", title: "3. Antecedentes Legales", order: 4 },
    { id: "residence", title: "4. Tiempo de Residencia", order: 5 },
    { id: "properties", title: "5. Inmuebles en Arrendamiento", order: 6 },
    { id: "size", title: "6. Tamaño de Empresa", order: 7 },
    { id: "age", title: "7. Edad de la Empresa", order: 8 },
    { id: "final", title: "Recomendaciones Finales", order: 9 }
  ],
  fields: [
    {
      id: "score",
      name: "score",
      label: "Puntuación Final",
      type: "number",
      required: true,
      section: "evaluation",
      order: 1,
      validation: { min: 0, max: 100 }
    },
    {
      id: "ranking",
      name: "ranking",
      label: "Rankeo",
      type: "select",
      required: true,
      section: "evaluation",
      order: 2,
      options: [
        { value: "AAA", label: "AAA - Marginal" },
        { value: "A", label: "A - Mínimo" },
        { value: "B", label: "B - Moderado" },
        { value: "C", label: "C - Medio" },
        { value: "D", label: "D - Alto" },
        { value: "E", label: "E - No Califica" }
      ]
    },
    {
      id: "risk_level",
      name: "riskLevel",
      label: "Nivel de Riesgo",
      type: "select",
      required: true,
      section: "evaluation",
      order: 3,
      options: [
        { value: "MARGINAL", label: "Marginal" },
        { value: "MINIMO", label: "Mínimo" },
        { value: "MODERADO", label: "Moderado" },
        { value: "MEDIO", label: "Medio" },
        { value: "ALTO", label: "Alto" },
        { value: "NO_CALIFICA", label: "No Califica" }
      ]
    },
    {
      id: "rent_recommendation",
      name: "rentRecommendation",
      label: "Recomendación de Renta",
      type: "select",
      required: true,
      section: "evaluation",
      order: 4,
      options: [
        { value: "SI", label: "SI rentarle" },
        { value: "NO", label: "NO rentarle" },
        { value: "A_CRITERIO", label: "A criterio" }
      ]
    },
    {
      id: "recommendation_details",
      name: "recommendationDetails",
      label: "Detalles de Recomendación",
      type: "textarea",
      required: true,
      section: "evaluation",
      order: 5
    },
    {
      id: "active_credits",
      name: "activeCredits",
      label: "Créditos Activos",
      type: "number",
      required: true,
      section: "bureau",
      order: 6
    },
    {
      id: "settled_credits",
      name: "settledCredits",
      label: "Créditos Liquidados",
      type: "number",
      required: true,
      section: "bureau",
      order: 7
    },
    {
      id: "settled_credits_text",
      name: "settledCreditsText",
      label: "Detalles de Pagos",
      type: "textarea",
      required: false,
      section: "bureau",
      order: 8,
      placeholder: "los ha pagado de manera puntual"
    },
    {
      id: "portfolio_type",
      name: "portfolioType",
      label: "Tipo de Cartera",
      type: "text",
      required: true,
      section: "portfolio",
      order: 9
    },
    {
      id: "on_time_accounts",
      name: "onTimeAccounts",
      label: "Cuentas con Pago Puntual",
      type: "number",
      required: true,
      section: "portfolio",
      order: 10
    },
    {
      id: "late_accounts",
      name: "lateAccounts",
      label: "Cuentas con Pago Impuntual",
      type: "number",
      required: true,
      section: "portfolio",
      order: 11
    },
    {
      id: "legal_records_list",
      name: "legalRecordsList",
      label: "Antecedentes de Juicios",
      type: "textarea",
      required: true,
      section: "legal",
      order: 12
    },
    {
      id: "residence_months",
      name: "residenceMonths",
      label: "Meses de Residencia en Localidad",
      type: "number",
      required: true,
      section: "residence",
      order: 13
    },
    {
      id: "locality_name",
      name: "localityName",
      label: "Nombre de la Localidad",
      type: "text",
      required: true,
      section: "residence",
      order: 14
    },
    {
      id: "rented_properties",
      name: "rentedProperties",
      label: "Inmuebles en Arrendamiento",
      type: "number",
      required: true,
      section: "properties",
      order: 15
    },
    {
      id: "employee_count",
      name: "employeeCount",
      label: "Número de Trabajadores",
      type: "number",
      required: true,
      section: "size",
      order: 16
    },
    {
      id: "company_age",
      name: "companyAge",
      label: "Edad de la Empresa (años)",
      type: "number",
      required: true,
      section: "age",
      order: 17
    },
    {
      id: "recommendations_list",
      name: "recommendationsList",
      label: "Recomendaciones Adicionales",
      type: "textarea",
      required: false,
      section: "final",
      order: 18
    }
  ]
};

// ============================================
// SERVICE TO SCHEMA MAPPING
// ============================================

const SERVICE_SCHEMA_MAP: Record<number, any> = {
  // PRECA Básica
  7: PRECA_BASICA_PFAE_SCHEMA,   // PRECA_BASICA_FISICA
  9: PRECA_BASICA_PM_SCHEMA,     // PRECA_BASICA_MORAL

  // PRECA Pro
  12: PRECA_PRO_PFAE_SCHEMA,     // PRECA_PRO_FISICA
  16: PRECA_PRO_PM_SCHEMA,       // PRECA_PRO_MORAL

  // PRECA Completa (same as Pro)
  18: PRECA_PRO_PFAE_SCHEMA,     // PRECA_COMPLETA_FISICA
  20: PRECA_PRO_PM_SCHEMA,       // PRECA_COMPLETA_MORAL

  // Services without reports
  25: null,  // PRECA_INE_FISICA
  26: null,  // PRECA_INE_MORAL
  52: null,  // PRECA_EXTRANJEROS
};

// ============================================
// MAIN SCRIPT
// ============================================

async function updateReportSchemas() {
  console.log('='.repeat(60));
  console.log('🚀 Updating Report Schemas in Production Database');
  console.log('='.repeat(60));
  console.log('');

  for (const [serviceId, schema] of Object.entries(SERVICE_SCHEMA_MAP)) {
    const id = parseInt(serviceId);

    try {
      const service = await prisma.service_catalog.findUnique({
        where: { id }
      });

      if (!service) {
        console.log(`⚠️  Service ID ${id} not found - skipping`);
        continue;
      }

      await prisma.service_catalog.update({
        where: { id },
        data: {
          report_schema: schema,
          updated_at: new Date()
        }
      });

      if (schema) {
        console.log(`✅ Updated: ${service.name} (ID: ${id})`);
        console.log(`   Template: ${schema.templateId}`);
        console.log(`   Fields: ${schema.fields.length}`);
      } else {
        console.log(`✅ Updated: ${service.name} (ID: ${id})`);
        console.log(`   Template: NONE (no report for this service)`);
      }
      console.log('');
    } catch (error) {
      console.error(`❌ Error updating service ID ${id}:`, error);
    }
  }

  console.log('='.repeat(60));
  console.log('✅ Report schema update complete!');
  console.log('='.repeat(60));
}

updateReportSchemas()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
