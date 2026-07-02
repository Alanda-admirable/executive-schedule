import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  const schedule = await prisma.schedule.findUnique({
    where: { id: '4653b8be-e326-450d-ace9-2f10c8277d52' }
  })
  console.log(schedule?.date)
}
main().catch(console.error).finally(() => process.exit())
