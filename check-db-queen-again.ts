import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  const schedule = await prisma.schedule.findMany({
    where: { mission: { contains: "Queen's Cup" } }
  })
  if (schedule.length > 0) {
    console.log(JSON.stringify(schedule[0].mission));
  } else {
    console.log("Not found");
  }
}
main().catch(console.error).finally(() => prisma.$disconnect())
