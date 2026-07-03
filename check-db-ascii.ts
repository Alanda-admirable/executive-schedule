import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  const schedule = await prisma.schedule.findUnique({
    where: { id: '8c458623-069a-4686-a3fe-433fc62fd5b8' }
  })
  if (schedule) {
    const chars = [];
    for(let i = 0; i < schedule.mission.length; i++) {
        const code = schedule.mission.charCodeAt(i);
        if (code < 32 || code > 126) {
            chars.push(\[\\u\]\);
        } else {
            chars.push(schedule.mission[i]);
        }
    }
    console.log(chars.join(''));
  }
}
main().catch(console.error).finally(() => prisma.$disconnect())
