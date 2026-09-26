const {PrismaClient} = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10);
  await prisma.user.update({
    where: { email: 'admin@stocksense.com' },
    data: { passwordHash }
  });
  console.log('Password updated');
  await prisma.$disconnect()
}
main()