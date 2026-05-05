/**
 * Service Catalog Seed Script
 * 
 * Seeds the database with default services (PRECA_BASIC, PRECA_PRO, PRECA_BUSINESS)
 * Creates these services in Stripe and populates the required JSON form schemas.
 */

import { PrismaClient } from '@prisma/client';
import { StripeService } from '../../services/StripeService';

const prisma = new PrismaClient();

interface ServiceSeedData {
  code: string;
  name: string;
  description: string;
  priceMxn: number;
  targetPersonType: 'physical' | 'moral';
  formSchema: any;
}

// Esquemas JSON requeridos para que el frontend renderice los campos
const basicFormSchema = {
  fields: [
    { name: "full_name", label: "Nombre Completo", type: "text", required: true, placeholder: "Juan Pérez" },
    { name: "rfc", label: "RFC", type: "text", required: true, placeholder: "ABCD123456XYZ" },
    { name: "email", label: "Correo Electrónico", type: "email", required: true, placeholder: "usuario@ejemplo.com" }
  ]
};

const proFormSchema = {
  fields: [
    { name: "full_name", label: "Nombre Completo", type: "text", required: true },
    { name: "rfc", label: "RFC", type: "text", required: true },
    { name: "email", label: "Correo Electrónico", type: "email", required: true },
    { name: "phone", label: "Teléfono de Contacto", type: "tel", required: true },
    { name: "address", label: "Dirección Completa", type: "text", required: true }
  ]
};

const services: ServiceSeedData[] = [
  {
    code: 'PRECA_BASIC',
    name: 'Precalificación Básica',
    description: 'Verificación de identidad + Buró de Crédito básico para personas físicas',
    priceMxn: 299.00,
    targetPersonType: 'physical',
    formSchema: basicFormSchema
  },
  {
    code: 'PRECA_PRO',
    name: 'Precalificación Pro',
    description: 'Verificación de identidad + Buró de Crédito detallado + Referencias para personas físicas',
    priceMxn: 499.00,
    targetPersonType: 'physical',
    formSchema: proFormSchema
  },
  {
    code: 'PRECA_BUSINESS',
    name: 'Precalificación Empresarial',
    description: 'Verificación de identidad + Buró de Crédito empresarial para personas morales',
    priceMxn: 799.00,
    targetPersonType: 'moral',
    formSchema: proFormSchema
  },
];

async function seedServices() {
  try {
    console.log('🌱 Starting service catalog seed...\n');

    const stripeEnabled = !!process.env.STRIPE_SECRET_KEY;
    let stripeService: StripeService | undefined;

    if (stripeEnabled) {
      console.log('✓ Stripe integration enabled');
      stripeService = new StripeService(process.env.STRIPE_SECRET_KEY!);
    } else {
      console.log('⚠ Stripe integration disabled (no STRIPE_SECRET_KEY found)');
    }

    console.log('');

    for (const serviceData of services) {
      console.log(`Processing service: ${serviceData.code}...`);

      const existingService = await prisma.service_catalog.findUnique({
        where: { code: serviceData.code }
      });

      if (existingService) {
        console.log(`  → Service already exists (ID: ${existingService.id}). Updating schema...`);
        
        // Actualizamos el esquema y nos aseguramos de que esté activo
        await prisma.service_catalog.update({
          where: { id: existingService.id },
          data: {
            form_schema: serviceData.formSchema,
            is_active: true
          }
        });

        // Lógica de Stripe para servicios existentes no vinculados
        if (stripeService && !existingService.stripe_product_id) {
          console.log('  → Linking to Stripe...');
          try {
            const { product, price } = await stripeService.createProductWithPrice(
              {
                name: serviceData.name,
                description: serviceData.description,
                active: true,
                metadata: {
                  service_code: serviceData.code,
                  target_person_type: serviceData.targetPersonType
                }
              },
              Math.round(serviceData.priceMxn * 100),
              'mxn'
            );

            await prisma.service_catalog.update({
              where: { id: existingService.id },
              data: {
                stripe_product_id: product.id,
                stripe_price_id: price.id
              }
            });
            console.log(`  → ✓ Linked to Stripe (Product: ${product.id})`);
          } catch (error) {
            console.error('  → ✗ Failed to link to Stripe:', error instanceof Error ? error.message : error);
          }
        }
        console.log('');
        continue;
      }

      // Crear nuevo servicio desde cero
      let stripeProductId: string | null = null;
      let stripePriceId: string | null = null;

      if (stripeService) {
        console.log('  → Creating in Stripe...');
        try {
          const { product, price } = await stripeService.createProductWithPrice(
            {
              name: serviceData.name,
              description: serviceData.description,
              active: true,
              metadata: {
                service_code: serviceData.code,
                target_person_type: serviceData.targetPersonType
              }
            },
            Math.round(serviceData.priceMxn * 100),
            'mxn'
          );

          stripeProductId = product.id;
          stripePriceId = price.id;
          console.log(`  → ✓ Created in Stripe (Product: ${product.id})`);
        } catch (error) {
          console.error('  → ✗ Failed to create in Stripe:', error instanceof Error ? error.message : error);
        }
      }

      console.log('  → Creating in database...');
      const service = await prisma.service_catalog.create({
        data: {
          code: serviceData.code,
          name: serviceData.name,
          description: serviceData.description,
          price_mxn: serviceData.priceMxn,
          target_person_type: serviceData.targetPersonType,
          stripe_product_id: stripeProductId,
          stripe_price_id: stripePriceId,
          is_active: true,
          form_schema: serviceData.formSchema
        }
      });

      console.log(`  → ✓ Created in database (ID: ${service.id})\n`);
    }

    console.log('✅ Service catalog seeding completed successfully!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  seedServices()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { seedServices };