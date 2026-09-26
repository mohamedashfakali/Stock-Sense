const {PrismaClient} = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({where: {email: 'admin@stocksense.com'}});
  console.log(user);
  const valid = await bcrypt.compare('password123', user.passwordHash);
  console.log('valid:', valid);
  await prisma.$disconnect()
}
main()