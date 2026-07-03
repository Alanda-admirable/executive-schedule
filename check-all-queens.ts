import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  const schedules = await prisma.schedule.findMany({
    where: { mission: { contains: "Queen" } }
  })
  schedules.forEach(s => {
    console.log(s.id, JSON.stringify(s.mission));
  });
}
main().catch(console.error).finally(() => prisma.$disconnect())
