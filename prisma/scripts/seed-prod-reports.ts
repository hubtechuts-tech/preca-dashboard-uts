/**
 * Production Services Test Seed
 * 
 * Creates test screenings for EXISTING production services to test PDF generation locally.
 * Uses specific production IDs: 
 * - 7: PRECA Básica PFAE
 * - 9: PRECA Básica PM
 * - 12: PRECA Pro PFAE
 * - 16: PRECA Pro PM
 * 
 * Run with: npx ts-node prisma/scripts/seed-prod-reports.ts
 */

import { PrismaClient, service_catalog_target_person_type_enum } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================
// PRODUCTION SERVICE IDS
// ============================================
const PROD_SERVICE_IDS = {
    BASICA_PFAE: 7,
    BASICA_PM: 9,
    PRO_PFAE: 12,
    PRO_PM: 16
};

// ============================================
// TEST DATA FOR SCREENINGS
// ============================================

const PROD_REPORT_DATA = {
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

async function seedProdReports() {
    console.log('='.repeat(60));
    console.log('🏭 Seeding Test Data for PRODUCTION Services');
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
                email: 'admin@prod-test.com',
                full_name: 'Prod Test Admin',
                role: 'admin',
                is_active: true
            }
        });
    }
    console.log(`✓ Using admin: ${adminUser.email}\n`);

    // 2. Validate services exist
    const servicesToSeed = [
        { id: PROD_SERVICE_IDS.BASICA_PFAE, name: 'Básica PFAE', type: service_catalog_target_person_type_enum.physical, data: PROD_REPORT_DATA.basica_pfae, email: 'prod.basica.pfae@test.com' },
        { id: PROD_SERVICE_IDS.BASICA_PM, name: 'Básica PM', type: service_catalog_target_person_type_enum.moral, data: PROD_REPORT_DATA.basica_pm, email: 'prod.basica.pm@test.com' },
        { id: PROD_SERVICE_IDS.PRO_PFAE, name: 'Pro PFAE', type: service_catalog_target_person_type_enum.physical, data: PROD_REPORT_DATA.pro_pfae, email: 'prod.pro.pfae@test.com' },
        { id: PROD_SERVICE_IDS.PRO_PM, name: 'Pro PM', type: service_catalog_target_person_type_enum.moral, data: PROD_REPORT_DATA.pro_pm, email: 'prod.pro.pm@test.com' }
    ];

    for (const item of servicesToSeed) {
        const service = await prisma.service_catalog.findUnique({
            where: { id: item.id }
        });

        if (!service) {
            console.error(`❌ Service ID ${item.id} (${item.name}) NOT FOUND. Skipping...`);
            continue;
        }
        console.log(`✓ Verified Service: ${service.name} (ID: ${item.id})`);

        // 3. Create/Update Screening
        const existing = await prisma.screenings.findFirst({
            where: { applicant_email: item.email }
        });

        if (existing) {
            // Update existing
            await prisma.screenings.update({
                where: { id: existing.id },
                data: {
                    report_data: item.data,
                    status: 'processing_bureau',
                    payment_completed_at: existing.payment_completed_at || new Date(),
                    authorization_document_url: existing.authorization_document_url || 'https://example.com/test-authorization.pdf',
                    authorization_signed_at: existing.authorization_signed_at || new Date(),
                    is_identity_verified: true,
                    identity_verified_at: existing.identity_verified_at || new Date(),
                    updated_at: new Date()
                }
            });
            console.log(`  ✓ Updated screening for ${item.name}`);
            console.log(`    URL: http://localhost:3000/dashboard/screenings/${existing.id}`);
        } else {
            // Create new
            const screening = await prisma.screenings.create({
                data: {
                    service_id: item.id,
                    status: 'processing_bureau',
                    applicant_name: `TEST ${item.name.toUpperCase()}`,
                    applicant_email: item.email,
                    applicant_phone: '+52 55 9999 9999',
                    applicant_person_type: item.type,
                    applicant_rfc: item.type === service_catalog_target_person_type_enum.physical ? 'XAXX010101000' : 'XAX010101000',
                    form_data: { purpose: 'Prueba de Producción' },
                    report_data: item.data,
                    payment_amount: Number(service.price_mxn),
                    payment_completed_at: new Date(),
                    is_identity_verified: true,
                    authorization_document_url: 'https://example.com/test-authorization.pdf',
                    authorization_signed_at: new Date(),
                    identity_verified_at: new Date(),
                    admin_user_id: adminUser.id
                }
            });
            console.log(`  ✓ Created screening for ${item.name}`);
            console.log(`    URL: http://localhost:3000/dashboard/screenings/${screening.id}`);
        }
        console.log('');
    }

    console.log('='.repeat(60));
    console.log('🎉 PROD TEST DATA READY!');
    console.log('='.repeat(60));
}

seedProdReports()
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
