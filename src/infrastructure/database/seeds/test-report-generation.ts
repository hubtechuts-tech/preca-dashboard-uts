import { Prisma, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Test seed for Dynamic PDF Report Generation feature
 * Creates a service with reportSchema and a screening in processing_bureau status
 */
async function seedTestReportGeneration() {
    console.log('🧪 Seeding test data for Report Generation...\n');

    // 1. Get or create admin user first
    let adminUser = await prisma.users.findFirst({
        where: { role: 'admin' }
    });

    if (!adminUser) {
        console.log('⚠️  No admin user found. Please run initial-seed.ts first.');
        return;
    }

    console.log(`✓ Using admin user: ${adminUser.email}`);

    // 2. Define a ReportSchema for testing
    const testReportSchema = {
        version: "1.0",
        templateId: "preca-basic-pfae",
        sections: [
            { id: "credit_score", title: "Score Crediticio", order: 1 },
            { id: "credit_accounts", title: "Cuentas de Crédito", order: 2 },
            { id: "summary", title: "Resumen", order: 3 }
        ],
        fields: [
            {
                id: "credit_score",
                name: "creditScore",
                label: "Score de Buró",
                type: "score",
                required: true,
                helpText: "Puntaje entre 300 y 850",
                section: "credit_score",
                order: 1,
                validation: { min: 300, max: 850 }
            },
            {
                id: "credit_rating",
                name: "creditRating",
                label: "Calificación",
                type: "status",
                required: true,
                section: "credit_score",
                order: 2,
                options: [
                    { value: "excellent", label: "Excelente", color: "#22c55e" },
                    { value: "good", label: "Bueno", color: "#84cc16" },
                    { value: "regular", label: "Regular", color: "#eab308" },
                    { value: "poor", label: "Malo", color: "#ef4444" }
                ]
            },
            {
                id: "total_debt",
                name: "totalDebt",
                label: "Deuda Total Actual",
                type: "currency",
                required: true,
                placeholder: "0.00",
                section: "credit_accounts",
                order: 3
            },
            {
                id: "monthly_payment",
                name: "monthlyPayment",
                label: "Pago Mensual Estimado",
                type: "currency",
                required: false,
                placeholder: "0.00",
                section: "credit_accounts",
                order: 4
            },
            {
                id: "credit_accounts_table",
                name: "creditAccounts",
                label: "Cuentas de Crédito",
                type: "table",
                required: false,
                section: "credit_accounts",
                order: 5,
                tableColumns: [
                    { key: "institution", label: "Institución", type: "text" },
                    { key: "accountType", label: "Tipo", type: "text" },
                    { key: "balance", label: "Saldo", type: "currency" },
                    { key: "status", label: "Estado", type: "text" },
                    { key: "lastPayment", label: "Último Pago", type: "date" }
                ]
            },
            {
                id: "analyst_notes",
                name: "analystNotes",
                label: "Notas del Analista",
                type: "textarea",
                required: false,
                helpText: "Observaciones adicionales sobre el reporte",
                section: "summary",
                order: 6
            },
            {
                id: "recommendation",
                name: "recommendation",
                label: "Recomendación",
                type: "select",
                required: true,
                section: "summary",
                order: 7,
                options: [
                    { value: "approved", label: "Aprobado" },
                    { value: "approved_conditions", label: "Aprobado con condiciones" },
                    { value: "needs_review", label: "Requiere revisión" },
                    { value: "rejected", label: "Rechazado" }
                ]
            }
        ]
    };

    // 3. Create or update test service with reportSchema
    const existingService = await prisma.service_catalog.findUnique({
        where: { code: 'PRECA_BASIC_TEST' }
    });

    let testService;
    if (existingService) {
        testService = await prisma.service_catalog.update({
            where: { code: 'PRECA_BASIC_TEST' },
            data: {
                report_schema: testReportSchema,
                updated_at: new Date()
            }
        });
        console.log(`✓ Updated service: ${testService.name} (ID: ${testService.id})`);
    } else {
        testService = await prisma.service_catalog.create({
            data: {
                code: 'PRECA_BASIC_TEST',
                name: 'PreCA Básico - TEST',
                description: 'Servicio de prueba para generar reportes dinámicos',
                price_mxn: 299.00,
                target_person_type: 'physical',
                is_active: true,
                report_schema: testReportSchema,
                requires_applicant_details: true
            }
        });
        console.log(`✓ Created service: ${testService.name} (ID: ${testService.id})`);
    }

    // 4. Create test screening in processing_bureau status
    const testScreening = await prisma.screenings.create({
        data: {
            service_id: testService.id,
            status: 'processing_bureau',
            applicant_name: 'Juan Pérez García (TEST)',
            applicant_email: 'juan.perez.test@example.com',
            applicant_phone: '+52 55 1234 5678',
            applicant_person_type: 'physical',
            applicant_rfc: 'PEGJ850101H12',
            applicant_street: 'Av. Reforma 222, Piso 10',
            applicant_colony: 'Juárez',
            applicant_municipality: 'Cuauhtémoc',
            applicant_state: 'Ciudad de México',
            applicant_zip_code: '06600',
            form_data: {
                purpose: 'Renta de departamento',
                monthlyIncome: 35000,
                employer: 'Empresa Ejemplo S.A. de C.V.'
            },
            payment_amount: 299.00,
            payment_completed_at: new Date(),
            is_identity_verified: true,
            wee_trust_document_id: 'TEST_DOC_ID_12345',
            authorization_document_url: 'https://example.com/test-authorization.pdf',
            authorization_signed_at: new Date(),
            identity_verified_at: new Date(),
            admin_user_id: adminUser.id,
            created_at: new Date(),
            updated_at: new Date()
        }
    });

    console.log(`✓ Created test screening: ${testScreening.applicant_name}`);
    console.log(`  ID: ${testScreening.id}`);
    console.log(`  Status: ${testScreening.status}`);

    console.log('\n' + '='.repeat(60));
    console.log('🎉 TEST DATA READY!');
    console.log('='.repeat(60));
    console.log('\nTo test the report generation feature:');
    console.log(`1. Start the dev server: npm run dev`);
    console.log(`2. Go to: http://localhost:3000/dashboard/screenings/${testScreening.id}`);
    console.log(`3. You should see the "Datos del Reporte" form instead of file upload`);
    console.log(`4. Fill in the form fields and click "Guardar Datos"`);
    console.log(`5. Click "Generar PDF" to test PDF generation`);
    console.log('='.repeat(60) + '\n');
}

seedTestReportGeneration()
    .then(() => {
        console.log('✅ Seed completed!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Seed failed:', error);
        process.exit(1);
    })
    .finally(() => {
        prisma.$disconnect();
    });
