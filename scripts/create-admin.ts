/**
 * create-admin.ts
 * ---------------
 * Run this script ONCE to seed your first Super Admin into Neon DB.
 * It uses Argon2 to hash the password properly for your system.
 *
 * Usage:
 *   npx tsx scripts/create-admin.ts
 *
 * Or for other roles:
 *   ADMIN_ROLE=admin npx tsx scripts/create-admin.ts
 */

import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { hash } from 'argon2';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL || process.env.DIRECT_DATABASE_URL || '',
})
const prisma = new PrismaClient({ adapter } as any);

const NAME     = process.env.ADMIN_NAME     || 'Super Admin';
const EMAIL    = process.env.ADMIN_EMAIL    || 'admin@sprintern.in';
const PASSWORD = process.env.ADMIN_PASSWORD || 'Change@Me123!';
const ROLE     = (process.env.ADMIN_ROLE    || 'super_admin') as 'super_admin' | 'admin' | 'reviewer';

async function main() {
  console.log(`\n🔐 Creating ${ROLE} account for ${EMAIL}...\n`);

  const existing = await prisma.admin.findUnique({
    where: { email: EMAIL },
  });

  if (existing) {
    console.log(`⚠️ An admin with email "${EMAIL}" already exists.`);
    
    console.log(`\n🔄 Updating password for existing admin ${existing.email} to use Argon2...\n`);
    const passwordHash = await hash(PASSWORD);
    
    await prisma.admin.update({
      where: { id: existing.id },
      data: { passwordHash, isActive: true }
    });
    
    console.log('✅ Admin password updated to use Argon2! You can now log in.');
    console.log(`   Email    : ${existing.email}`);
    console.log(`   Password : ${PASSWORD}\n`);
    return;
  }

  const passwordHash = await hash(PASSWORD);

  const admin = await prisma.admin.create({
    data: {
      email:    EMAIL,
      passwordHash,
      role:     ROLE,
      isActive: true,
    },
  });

  console.log('✅ Admin created successfully!\n');
  console.log(`   ID       : ${admin.id}`);
  console.log(`   Email    : ${admin.email}`);
  console.log(`   Role     : ${admin.role}`);
  console.log(`   Password : ${PASSWORD}\n`);
}

main()
  .catch((e) => { console.error('❌ Error:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
