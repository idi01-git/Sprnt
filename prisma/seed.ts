import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { hash } from 'argon2'

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL || process.env.DIRECT_DATABASE_URL || '',
})
const prisma = new PrismaClient({ adapter } as any)

async function main() {
  console.log('[Seed] Starting database seed...')

  // ─── 1. Create Super Admin ────────────────────────────────────────────────
  const adminEmail = 'admin@sprintern.in'
  const adminPassword = 'Sprintern@2026!'

  const existingAdmin = await prisma.admin.findUnique({
    where: { email: adminEmail },
  })

  if (!existingAdmin) {
    const hashedPassword = await hash(adminPassword)
    await prisma.admin.create({
      data: {
        email: adminEmail,
        passwordHash: hashedPassword,
        role: 'super_admin',
        isActive: true,
      },
    })
    console.log('[Seed] Created super_admin:', adminEmail)
  } else {
    console.log('[Seed] super_admin already exists:', adminEmail)
  }

  // ─── 2. Create System Settings ────────────────────────────────────────────
  const settings = [
    { key: 'quiz_pass_percentage', value: 80, description: 'Minimum percentage required to pass a quiz (out of 100)' },
    { key: 'quiz_cooldown_minutes', value: 30, description: 'Minutes of cooldown after every N failed quiz attempts' },
    { key: 'quiz_cooldown_attempts', value: 3, description: 'Number of failed quiz attempts before cooldown is triggered' },
    { key: 'quiz_total_days', value: 7, description: 'Total number of days in the program' },
    { key: 'quiz_submission_deadline_days', value: 7, description: 'Days from Day 7 quiz pass until project submission deadline' },
    { key: 'withdrawal_minimum', value: 100, description: 'Minimum wallet balance (in INR) required to request a withdrawal' },
    { key: 'referral_amount', value: 50, description: 'Amount credited to referrer when referee completes first purchase (in INR)' },
    { key: 'referral_lock_days', value: 7, description: 'Days after which a pending referral becomes eligible for auto-approval' },
    { key: 'max_resubmissions', value: 2, description: 'Maximum number of times a rejected submission can be resubmitted' },
  ]

  for (const setting of settings) {
    const existing = await prisma.systemSetting.findUnique({
      where: { settingKey: setting.key },
    })

    if (!existing) {
      await prisma.systemSetting.create({
        data: {
          settingKey: setting.key,
          settingValue: setting.value,
          description: setting.description,
        },
      })
      console.log(`[Seed] Created system_setting: ${setting.key} = ${setting.value}`)
    } else {
      console.log(`[Seed] system_setting already exists: ${setting.key}`)
    }
  }

  console.log('[Seed] Database seeding completed successfully.')
}

main()
  .catch((e) => {
    console.error('[Seed] Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
