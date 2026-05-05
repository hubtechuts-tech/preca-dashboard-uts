/**
 * Test Seed: Report Generation Testing
 *
 * Creates test services and screenings for testing all PDF report templates locally.
 * Run with: npx ts-node prisma/scripts/seed-test-reports.ts
 */

import { PrismaClient, service_catalog_target_person_type_enum } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================
// REPORT SCHEMAS (same as production)
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
      order: 1
    },
    {
      id: "bureau_commitments_text",
      name: "bureauCommitmentsText",
      label: "Compromisos en Buró de Crédito",
      type: "textarea",
      required: true,
      section: "credit",
      order: 2
    },
    {
      id: "legal_records_list",
      name: "legalRecordsList",
      label: "Antecedentes de Juicios",
      type: "textarea",
      required: true,
      section: "legal",
      order: 3
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
      order: 1
    },
    {
      id: "sat_legal_findings",
      name: "satAndLegalFindings",
      label: "Hallazgos en SAT y Antecedentes Legales",
      type: "textarea",
      required: true,
      section: "sat_legal",
      order: 2
    },
    {
      id: "sat_search_images",
      name: "satSearchImages",
      label: "Imágenes de Búsqueda SAT",
      type: "images",
      required: false,
      section: "sat_legal",
      order: 3
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
    { id: "score", name: "score", label: "Puntuación Final", type: "number", required: true, section: "evaluation", order: 1 },
    { id: "ranking", name: "ranking", label: "Rankeo", type: "select", required: true, section: "evaluation", order: 2, options: [{ value: "AAA", label: "AAA" }, { value: "A", label: "A" }, { value: "B", label: "B" }, { value: "C", label: "C" }, { value: "D", label: "D" }, { value: "E", label: "E" }] },
    { id: "risk_level", name: "riskLevel", label: "Nivel de Riesgo", type: "select", required: true, section: "evaluation", order: 3, options: [{ value: "MARGINAL", label: "Marginal" }, { value: "MINIMO", label: "Mínimo" }, { value: "MODERADO", label: "Moderado" }, { value: "MEDIO", label: "Medio" }, { value: "ALTO", label: "Alto" }, { value: "NO_CALIFICA", label: "No Califica" }] },
    { id: "rent_recommendation", name: "rentRecommendation", label: "Recomendación de Renta", type: "select", required: true, section: "evaluation", order: 4, options: [{ value: "SI", label: "SI rentarle" }, { value: "NO", label: "NO rentarle" }, { value: "A_CRITERIO", label: "A criterio" }] },
    { id: "recommendation_details", name: "recommendationDetails", label: "Detalles de Recomendación", type: "textarea", required: true, section: "evaluation", order: 5 },
    { id: "rent_amount", name: "rentAmount", label: "Monto de Renta Mensual", type: "currency", required: true, section: "liquidity", order: 6 },
    { id: "committed_amount", name: "committedAmount", label: "Comprometido en Buró", type: "currency", required: true, section: "liquidity", order: 7 },
    { id: "income_amount", name: "incomeAmount", label: "Ingresos Mensuales", type: "currency", required: true, section: "liquidity", order: 8 },
    { id: "total_expenses", name: "totalExpenses", label: "Total Gastos", type: "currency", required: true, section: "liquidity", order: 9 },
    { id: "payment_capacity_factor", name: "paymentCapacityFactor", label: "Factor de Capacidad de Pago", type: "number", required: true, section: "liquidity", order: 10 },
    { id: "income_comparison", name: "incomeComparison", label: "Comparación de Ingresos", type: "text", required: true, section: "liquidity", order: 11 },
    { id: "liquidity_analysis_text", name: "liquidityAnalysisText", label: "Análisis de Liquidez", type: "textarea", required: false, section: "liquidity", order: 12 },
    { id: "credit_score", name: "creditScore", label: "Score de Buró", type: "score", required: true, section: "credit", order: 13 },
    { id: "payment_probability", name: "paymentProbability", label: "Probabilidad de Pago (%)", type: "percentage", required: true, section: "credit", order: 14 },
    { id: "credit_history_text", name: "creditHistoryText", label: "Historial Crediticio", type: "textarea", required: true, section: "credit", order: 15 },
    { id: "legal_records_list", name: "legalRecordsList", label: "Antecedentes de Juicios", type: "textarea", required: true, section: "legal", order: 16 },
    { id: "origin_mobility_text", name: "originAndMobilityText", label: "Procedencia y Movilidad", type: "textarea", required: true, section: "mobility", order: 17 },
    { id: "employment_months", name: "employmentMonths", label: "Meses en Trabajo Actual", type: "number", required: true, section: "employment", order: 18 },
    { id: "dependents", name: "dependents", label: "Dependientes Económicos", type: "number", required: true, section: "family", order: 19 },
    { id: "age", name: "age", label: "Edad del Prospecto", type: "number", required: true, section: "age", order: 20 },
    { id: "recommendations_list", name: "recommendationsList", label: "Recomendaciones", type: "textarea", required: false, section: "final", order: 21 }
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
    { id: "score", name: "score", label: "Puntuación Final", type: "number", required: true, section: "evaluation", order: 1 },
    { id: "ranking", name: "ranking", label: "Rankeo", type: "select", required: true, section: "evaluation", order: 2, options: [{ value: "AAA", label: "AAA" }, { value: "A", label: "A" }, { value: "B", label: "B" }, { value: "C", label: "C" }, { value: "D", label: "D" }, { value: "E", label: "E" }] },
    { id: "risk_level", name: "riskLevel", label: "Nivel de Riesgo", type: "select", required: true, section: "evaluation", order: 3, options: [{ value: "MARGINAL", label: "Marginal" }, { value: "MINIMO", label: "Mínimo" }, { value: "MODERADO", label: "Moderado" }, { value: "MEDIO", label: "Medio" }, { value: "ALTO", label: "Alto" }, { value: "NO_CALIFICA", label: "No Califica" }] },
    { id: "rent_recommendation", name: "rentRecommendation", label: "Recomendación de Renta", type: "select", required: true, section: "evaluation", order: 4, options: [{ value: "SI", label: "SI rentarle" }, { value: "NO", label: "NO rentarle" }, { value: "A_CRITERIO", label: "A criterio" }] },
    { id: "recommendation_details", name: "recommendationDetails", label: "Detalles de Recomendación", type: "textarea", required: true, section: "evaluation", order: 5 },
    { id: "active_credits", name: "activeCredits", label: "Créditos Activos", type: "number", required: true, section: "bureau", order: 6 },
    { id: "settled_credits", name: "settledCredits", label: "Créditos Liquidados", type: "number", required: true, section: "bureau", order: 7 },
    { id: "settled_credits_text", name: "settledCreditsText", label: "Detalles de Pagos", type: "textarea", required: false, section: "bureau", order: 8 },
    { id: "portfolio_type", name: "portfolioType", label: "Tipo de Cartera", type: "text", required: true, section: "portfolio", order: 9 },
    { id: "on_time_accounts", name: "onTimeAccounts", label: "Cuentas Puntuales", type: "number", required: true, section: "portfolio", order: 10 },
    { id: "late_accounts", name: "lateAccounts", label: "Cuentas Impuntuales", type: "number", required: true, section: "portfolio", order: 11 },
    { id: "legal_records_list", name: "legalRecordsList", label: "Antecedentes de Juicios", type: "textarea", required: true, section: "legal", order: 12 },
    { id: "residence_months", name: "residenceMonths", label: "Meses de Residencia", type: "number", required: true, section: "residence", order: 13 },
    { id: "locality_name", name: "localityName", label: "Localidad", type: "text", required: true, section: "residence", order: 14 },
    { id: "rented_properties", name: "rentedProperties", label: "Inmuebles en Arrendamiento", type: "number", required: true, section: "properties", order: 15 },
    { id: "employee_count", name: "employeeCount", label: "Número de Trabajadores", type: "number", required: true, section: "size", order: 16 },
    { id: "company_age", name: "companyAge", label: "Edad de la Empresa", type: "number", required: true, section: "age", order: 17 },
    { id: "recommendations_list", name: "recommendationsList", label: "Recomendaciones", type: "textarea", required: false, section: "final", order: 18 }
  ]
};

// ============================================
// TEST SERVICES
// ============================================

const TEST_SERVICES = [
  {
    code: 'TEST_BASICA_PFAE',
    name: 'TEST - PRECA Básica PFAE',
    description: 'Servicio de prueba para PRECA Básica Persona Física',
    price_mxn: 299.00,
    target_person_type: service_catalog_target_person_type_enum.physical,
    report_schema: PRECA_BASICA_PFAE_SCHEMA
  },
  {
    code: 'TEST_BASICA_PM',
    name: 'TEST - PRECA Básica PM',
    description: 'Servicio de prueba para PRECA Básica Persona Moral',
    price_mxn: 399.00,
    target_person_type: service_catalog_target_person_type_enum.moral,
    report_schema: PRECA_BASICA_PM_SCHEMA
  },
  {
    code: 'TEST_PRO_PFAE',
    name: 'TEST - PRECA Pro PFAE',
    description: 'Servicio de prueba para PRECA Pro Persona Física',
    price_mxn: 599.00,
    target_person_type: service_catalog_target_person_type_enum.physical,
    report_schema: PRECA_PRO_PFAE_SCHEMA
  },
  {
    code: 'TEST_PRO_PM',
    name: 'TEST - PRECA Pro PM',
    description: 'Servicio de prueba para PRECA Pro Persona Moral',
    price_mxn: 699.00,
    target_person_type: service_catalog_target_person_type_enum.moral,
    report_schema: PRECA_PRO_PM_SCHEMA
  }
];

// ============================================
// TEST DATA FOR SCREENINGS
// ============================================

const TEST_REPORT_DATA = {
  basica_pfae: {
    paymentProbability: 85,
    bureauCommitmentsText: 'Pagos comprometidos en buró de crédito mensualmente $6,234.00 (Seis Mil Doscientos Treinta y Cuatro Pesos 00/100 M.N.)',
    legalRecordsList: 'No se encontraron antecedentes de juicios con el nombre del solicitante.'
  },
  basica_pm: {
    creditHistoryText: 'No cuenta con historial crediticio.',
    satAndLegalFindings: 'DENTRO DE LA BUSQUEDA DE INCONSISTENCIA DE DATOS, SERVIDORES PUBLICOS SANCIONADOS, FUNCIONARIOS PÚBLICOS, SAT 69, SAT 69-B, ACTIVIDADES VULNERABLES, FGJ, FGR, COMUNICADOS FGR, INTERPOL, INFORMACION DE JUICIOS, INFORMACION DE JUICIOS PENALES: No existe información reportada.',
    satSearchImages: []
  },
  pro_pfae: {
    score: 82,
    ranking: 'A',
    riskLevel: 'MINIMO',
    rentRecommendation: 'SI',
    recommendationDetails: 'SI rentarle con los siguientes requisitos: FIRMA DE CONTRATO, PAGARÉS Y OBLIGADO SOLIDARIO.',
    rentAmount: 20000,
    committedAmount: 25820,
    incomeAmount: 100000,
    totalExpenses: 45820,
    paymentCapacityFactor: 2.18,
    incomeComparison: '2.2 veces mayores',
    liquidityAnalysisText: 'El factor ideal es 4. El prospecto tiene capacidad de pago aceptable.',
    creditScore: 720,
    paymentProbability: 85,
    creditHistoryText: 'Tienen registro en buró de crédito desde el año 2021, tiene 6 cuentas abiertas el cual los ha pagado de manera puntual. (se anexa buró de crédito).',
    legalRecordsList: 'No se encontraron antecedentes de juicios.',
    originAndMobilityText: 'El titular es oriundo de CHIAPAS, tiene 2 domicilios reportados:\n\n• Calle Sin Nombre SN SN, Col: Jardín Colonial, Tuxtla Gutiérrez, Chiapas, México, C.P. 29020, reportado el 24 de Marzo 2022.\n• Cda Los Tulipanes 255, Colonia Los Tulipanes, Tuxtla Gutiérrez, Tuxtla Gutiérrez, México, CP29020.\n\nY en la localidad (Tuxtla Gutiérrez, Chiapas), tiene 168 meses de residencia.',
    employmentMonths: 36,
    dependents: 2,
    age: 35,
    recommendationsList: '• Verificar comprobante de domicilio actual\n• Solicitar referencias personales\n• Validar información laboral con el empleador'
  },
  pro_pm: {
    score: 75,
    ranking: 'B',
    riskLevel: 'MODERADO',
    rentRecommendation: 'SI',
    recommendationDetails: 'SI rentarle con los siguientes requisitos: FIRMA DE CONTRATO, PAGARÉS Y OBLIGADO SOLIDARIO SIN BURÓ.',
    activeCredits: 3,
    settledCredits: 5,
    settledCreditsText: 'los ha pagado de manera puntual',
    portfolioType: 'A',
    onTimeAccounts: 5,
    lateAccounts: 1,
    legalRecordsList: 'No se encontraron antecedentes de juicios.',
    residenceMonths: 48,
    localityName: 'Tuxtla Gutiérrez, Chiapas',
    rentedProperties: 2,
    employeeCount: 15,
    companyAge: 8,
    recommendationsList: '• Solicitar estados financieros auditados\n• Verificar referencias comerciales\n• Validar acta constitutiva'
  }
};

// ============================================
// MAIN SCRIPT
// ============================================

async function seedTestReports() {
  console.log('='.repeat(60));
  console.log('🧪 Seeding Test Data for Report Generation');
  console.log('='.repeat(60));
  console.log('');

  // 1. Get admin user
  let adminUser = await prisma.users.findFirst({
    where: { role: 'admin' }
  });

  if (!adminUser) {
    console.log('⚠️  No admin user found. Creating test admin...');
    adminUser = await prisma.users.create({
      data: {
        email: 'admin@test.com',
        full_name: 'Test Admin',
        role: 'admin',
        is_active: true
      }
    });
  }
  console.log(`✓ Using admin: ${adminUser.email}\n`);

  // 2. Create or update test services
  const createdServices: any[] = [];

  for (const serviceData of TEST_SERVICES) {
    const existing = await prisma.service_catalog.findUnique({
      where: { code: serviceData.code }
    });

    let service;
    if (existing) {
      service = await prisma.service_catalog.update({
        where: { code: serviceData.code },
        data: {
          ...serviceData,
          is_active: true,
          updated_at: new Date()
        }
      });
      console.log(`✓ Updated service: ${service.name}`);
    } else {
      service = await prisma.service_catalog.create({
        data: {
          ...serviceData,
          is_active: true,
          requires_applicant_details: true
        }
      });
      console.log(`✓ Created service: ${service.name}`);
    }
    createdServices.push(service);
  }
  console.log('');

  // 3. Create test screenings
  const testScreenings = [
    {
      service: createdServices[0], // Básica PFAE
      applicantName: 'Juan Pérez García (TEST BÁSICA PFAE)',
      applicantEmail: 'juan.basica.pfae@test.com',
      personType: service_catalog_target_person_type_enum.physical,
      reportData: TEST_REPORT_DATA.basica_pfae
    },
    {
      service: createdServices[1], // Básica PM
      applicantName: 'Comercializadora Test S.A. de C.V. (TEST BÁSICA PM)',
      applicantEmail: 'empresa.basica.pm@test.com',
      personType: service_catalog_target_person_type_enum.moral,
      reportData: TEST_REPORT_DATA.basica_pm
    },
    {
      service: createdServices[2], // Pro PFAE
      applicantName: 'María López Hernández (TEST PRO PFAE)',
      applicantEmail: 'maria.pro.pfae@test.com',
      personType: service_catalog_target_person_type_enum.physical,
      reportData: TEST_REPORT_DATA.pro_pfae
    },
    {
      service: createdServices[3], // Pro PM
      applicantName: 'Desarrollos Inmobiliarios Test S.A. de C.V. (TEST PRO PM)',
      applicantEmail: 'empresa.pro.pm@test.com',
      personType: service_catalog_target_person_type_enum.moral,
      reportData: TEST_REPORT_DATA.pro_pm
    }
  ];

  console.log('Creating test screenings...\n');

  for (const testData of testScreenings) {
    // Check if screening already exists
    const existing = await prisma.screenings.findFirst({
      where: { applicant_email: testData.applicantEmail }
    });

    if (existing) {
      // Update existing - ensure all required fields are set for report generation
      await prisma.screenings.update({
        where: { id: existing.id },
        data: {
          report_data: testData.reportData,
          status: 'processing_bureau',
          payment_completed_at: existing.payment_completed_at || new Date(),
          authorization_document_url: existing.authorization_document_url || 'https://example.com/test-authorization.pdf',
          authorization_signed_at: existing.authorization_signed_at || new Date(),
          is_identity_verified: true,
          identity_verified_at: existing.identity_verified_at || new Date(),
          updated_at: new Date()
        }
      });
      console.log(`✓ Updated screening: ${testData.applicantName}`);
      console.log(`  ID: ${existing.id}`);
      console.log(`  URL: http://localhost:3000/dashboard/screenings/${existing.id}\n`);
    } else {
      // Create new
      const screening = await prisma.screenings.create({
        data: {
          service_id: testData.service.id,
          status: 'processing_bureau',
          applicant_name: testData.applicantName,
          applicant_email: testData.applicantEmail,
          applicant_phone: '+52 55 1234 5678',
          applicant_person_type: testData.personType,
          applicant_rfc: testData.personType === service_catalog_target_person_type_enum.physical ? 'PEGJ850101H12' : 'CTS850101XX1',
          form_data: { purpose: 'Renta de inmueble' },
          report_data: testData.reportData,
          payment_amount: testData.service.price_mxn,
          payment_completed_at: new Date(),
          is_identity_verified: true,
          authorization_document_url: 'https://example.com/test-authorization.pdf',
          authorization_signed_at: new Date(),
          identity_verified_at: new Date(),
          admin_user_id: adminUser.id
        }
      });
      console.log(`✓ Created screening: ${testData.applicantName}`);
      console.log(`  ID: ${screening.id}`);
      console.log(`  URL: http://localhost:3000/dashboard/screenings/${screening.id}\n`);
    }
  }

  console.log('='.repeat(60));
  console.log('🎉 TEST DATA READY!');
  console.log('='.repeat(60));
  console.log('\nTo test report generation:');
  console.log('1. Start the dev server: npm run dev');
  console.log('2. Go to any of the screening URLs above');
  console.log('3. The report data is pre-filled');
  console.log('4. Click "Generar PDF" to test PDF generation');
  console.log('='.repeat(60));
}

seedTestReports()
  .then(() => {
    console.log('\n✅ Seed completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
