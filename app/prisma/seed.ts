/**
 * Metro Cardz — Prisma Seed Script
 * Run: npx prisma db seed
 *
 * Seeds:
 *  1. Deal categories (8 categories)
 *  2. Deal cities (9 cities)
 *  3. Super admin user (change password immediately after first login!)
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const CATEGORIES = [
  { name: 'Dining', slug: 'dining', icon: '🍽️' },
  { name: 'Shopping', slug: 'shopping', icon: '🛍️' },
  { name: 'Travel', slug: 'travel', icon: '✈️' },
  { name: 'Hotels', slug: 'hotels', icon: '🏨' },
  { name: 'Entertainment', slug: 'entertainment', icon: '🎭' },
  { name: 'Wellness & Spa', slug: 'wellness', icon: '💆' },
  { name: 'Fitness', slug: 'fitness', icon: '🏋️' },
  { name: 'Beauty & Grooming', slug: 'beauty', icon: '💄' },
];

const CITIES = [
  { name: 'Mumbai', slug: 'mumbai' },
  { name: 'Delhi', slug: 'delhi' },
  { name: 'Bengaluru', slug: 'bengaluru' },
  { name: 'Pune', slug: 'pune' },
  { name: 'Hyderabad', slug: 'hyderabad' },
  { name: 'Chennai', slug: 'chennai' },
  { name: 'Kolkata', slug: 'kolkata' },
  { name: 'Jaipur', slug: 'jaipur' },
  { name: 'Goa', slug: 'goa' },
];

async function main() {
  console.log('🌱 Seeding Metro Cardz database...');

  // 1. Deal categories
  for (const cat of CATEGORIES) {
    await prisma.dealCategory.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }
  console.log(`✅ ${CATEGORIES.length} deal categories seeded`);

  // 2. Deal cities
  for (const city of CITIES) {
    await prisma.dealCity.upsert({
      where: { slug: city.slug },
      update: {},
      create: city,
    });
  }
  console.log(`✅ ${CITIES.length} deal cities seeded`);

  // 3. Super admin user (Main Platform & Deals Admin)
  const superAdminPhone = process.env.SUPER_ADMIN_PHONE ?? '9029999614';
  const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD ?? '9029999614';
  const superAdminEmail = (process.env.SUPER_ADMIN_EMAIL ?? 'metrocouponsys@gmail.com').toLowerCase();
  const passwordHash = await bcrypt.hash(superAdminPassword, 10);

  const crypto = await import('crypto');
  const adminId = crypto.randomUUID();

  // Upsert Merchant Super Admin
  const existingMerchantUser = await prisma.merchantUser.findFirst({
    where: { OR: [{ email: superAdminEmail }, { phone: superAdminPhone }] },
  });

  if (!existingMerchantUser) {
    await prisma.merchantUser.create({
      data: {
        id: adminId,
        name: 'Metro Cardz Admin',
        phone: superAdminPhone,
        email: superAdminEmail,
        role: 'super_admin',
        passwordHash,
        merchantId: null,
      },
    });
    console.log(`✅ Super Admin created in merchant_users: ${superAdminEmail} / ${superAdminPhone}`);
  } else {
    await prisma.merchantUser.update({
      where: { id: existingMerchantUser.id },
      data: {
        role: 'super_admin',
        passwordHash,
        email: superAdminEmail,
        phone: superAdminPhone,
      },
    });
    console.log(`✅ Super Admin updated in merchant_users: ${superAdminEmail}`);
  }

  // Upsert Deals Platform Admin (DealAdminUser)
  await prisma.dealAdminUser.upsert({
    where: { email: superAdminEmail },
    update: { passwordHash, role: 'admin' },
    create: {
      email: superAdminEmail,
      passwordHash,
      role: 'admin',
    },
  });
  console.log(`✅ Deals Admin created/updated in deals_admin_users: ${superAdminEmail}`);

  console.log('🚀 Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
