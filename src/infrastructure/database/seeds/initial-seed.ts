import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seed() {
  try {
    console.log('🌱 Starting database seed...');

    // Seed Admin User
    const adminEmail = 'admin@preca.com';
    const adminExists = await prisma.users.findUnique({
      where: { email: adminEmail },
    });

    if (!adminExists) {
      console.log('Creating default admin user...');
      const passwordHash = await bcrypt.hash('admin123', 12);

      await prisma.users.create({
        data: {
          email: adminEmail,
          full_name: 'System Administrator',
          role: 'admin',
          is_active: true,
          password_hash: passwordHash,
        },
      });

      console.log('✅ Admin user created successfully!');
      console.log(`   Email: ${adminEmail}`);
      console.log('   Password: admin123');
    } else {
      console.log('ℹ️  Admin user already exists.');
    }

    console.log('✅ Seeding completed successfully!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
