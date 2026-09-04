import { PrismaClient } from '@prisma/client'
import { PrismaD1 } from '@prisma/adapter-d1'
import { getCloudflareContext } from '@opennextjs/cloudflare'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function getPrismaClient(): PrismaClient {
  try {
    const ctx = getCloudflareContext()
    if (ctx?.env && (ctx.env as any).DB) {
      const db = (ctx.env as any).DB
      if (!db.__prisma) {
        const adapter = new PrismaD1(db)
        db.__prisma = new PrismaClient({ adapter })
      }
      return db.__prisma
    }
  } catch (err) {
    console.error('getPrismaClient Cloudflare error:', err)
  }

  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient()
  }
  return globalForPrisma.prisma
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrismaClient()
    const value = (client as any)[prop]
    return typeof value === 'function' ? value.bind(client) : value
  }
})
