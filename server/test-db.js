import { prisma } from './src/lib/prisma.js';

async function main() {
  // Get all notebooks
  const allNotebooks = await prisma.notebook.findMany();
  console.log("All Notebooks:", allNotebooks);

  // Get notebooks for specific user
  const userNotebooks = await prisma.notebook.findMany({
    where: { userId: 'user_3AWcj6nRYdLBdDmO8PbCU3FYu9J' }
  });
  console.log("\nNotebooks for user_3AWcj6nRYdLBdDmO8PbCU3FYu9J:", userNotebooks);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
