import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

/**
 * Demo credentials (copy the same values into README for P4):
 *
 * ADMIN
 *   Email:    admin@demo.local
 *   Password: Admin123!
 *
 * STAFF
 *   Email:    staff@demo.local
 *   Password: Staff123!
 */
const DEMO_ADMIN_EMAIL = 'admin@demo.local';
const DEMO_ADMIN_PASSWORD = 'Admin123!';

const DEMO_STAFF_EMAIL = 'staff@demo.local';
const DEMO_STAFF_PASSWORD = 'Staff123!';

async function main(): Promise<void> {
  const adminHash = await bcrypt.hash(DEMO_ADMIN_PASSWORD, 10);
  const staffHash = await bcrypt.hash(DEMO_STAFF_PASSWORD, 10);

  await prisma.user.upsert({
    where: { email: DEMO_ADMIN_EMAIL },
    update: { passwordHash: adminHash, role: Role.ADMIN },
    create: {
      email: DEMO_ADMIN_EMAIL,
      passwordHash: adminHash,
      role: Role.ADMIN,
    },
  });

  await prisma.user.upsert({
    where: { email: DEMO_STAFF_EMAIL },
    update: { passwordHash: staffHash, role: Role.STAFF },
    create: {
      email: DEMO_STAFF_EMAIL,
      passwordHash: staffHash,
      role: Role.STAFF,
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
