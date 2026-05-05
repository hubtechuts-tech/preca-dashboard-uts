/**
 * Service Catalog Seed Script
 *
 * Seeds the database with default services (PRECA_BASIC, PRECA_PRO, PRECA_BUSINESS)
 * Optionally creates these services in Stripe as well
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
}

const services: ServiceSeedData[] = [
  {
    code: 'PRECA_BASIC',
    name: 'Precalificación Básica',
    description: 'Verificación de identidad + Buró de Crédito básico para personas físicas',
    priceMxn: 299.00,
    targetPersonType: 'physical',
  },
  {
    code: 'PRECA_PRO',
    name: 'Precalificación Pro',
    description: 'Verificación de identidad + Buró de Crédito detallado + Referencias para personas físicas',
    priceMxn: 499.00,
    targetPersonType: 'physical',
  },
  {
    code: 'PRECA_BUSINESS',
    name: 'Precalificación Empresarial',
    description: 'Verificación de identidad + Buró de Crédito empresarial para personas morales',
    priceMxn: 799.00,
    targetPersonType: 'moral',
  },
];

async function seedServices() {
  try {
    console.log('🌱 Starting service catalog seed...\n');

    // Check if Stripe is configured
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

      // Check if service already exists
      const existingService = await prisma.service_catalog.findUnique({
        where: { code: serviceData.code }
      });

      if (existingService) {
        console.log(`  → Service already exists (ID: ${existingService.id})`);

        // Check if it needs Stripe integration
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
              Math.round(serviceData.priceMxn * 100), // Convert to cents
              'mxn'
            );

            await prisma.service_catalog.update({
              where: { id: existingService.id },
              data: {
                stripe_product_id: product.id,
                stripe_price_id: price.id
              }
            });

            console.log(`  → ✓ Linked to Stripe (Product: ${product.id}, Price: ${price.id})`);
          } catch (error) {
            console.error('  → ✗ Failed to link to Stripe:', error instanceof Error ? error.message : error);
          }
        } else if (existingService.stripe_product_id) {
          console.log(`  → Already linked to Stripe (Product: ${existingService.stripe_product_id})`);
        }

        console.log('');
        continue;
      }

      // Create new service
      let stripeProductId: string | null = null;
      let stripePriceId: string | null = null;

      // Create in Stripe first if enabled
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
            Math.round(serviceData.priceMxn * 100), // Convert to cents
            'mxn'
          );

          stripeProductId = product.id;
          stripePriceId = price.id;
          console.log(`  → ✓ Created in Stripe (Product: ${product.id}, Price: ${price.id})`);
        } catch (error) {
          console.error('  → ✗ Failed to create in Stripe:', error instanceof Error ? error.message : error);
        }
      }

      // Create in database
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
          is_active: true
        }
      });

      console.log(`  → ✓ Created in database (ID: ${service.id})`);
      console.log('');
    }

    console.log('✅ Service catalog seeding completed successfully!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run seed if executed directly
if (require.main === module) {
  seedServices()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { seedServices };
