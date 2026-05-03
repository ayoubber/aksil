import { PrismaClient } from '@prisma/client'
import { app } from 'electron'
import { join } from 'path'
import { existsSync, mkdirSync } from 'fs'
import bcrypt from 'bcryptjs'

let prisma: PrismaClient | null = null

function getDatabasePath(): string {
  const userDataPath = app.getPath('userData')
  const dbDir = join(userDataPath, 'data')
  if (!existsSync(dbDir)) {
    mkdirSync(dbDir, { recursive: true })
  }
  return join(dbDir, 'aksil.db')
}

export function getDatabase(): PrismaClient {
  if (!prisma) {
    const dbPath = getDatabasePath()
    const dbUrl = `file:${dbPath}`

    prisma = new PrismaClient({
      datasources: {
        db: {
          url: dbUrl
        }
      }
    })
  }
  return prisma
}

export async function initializeDatabase(): Promise<void> {
  const db = getDatabase()

  // Push schema to database (creates tables if they don't exist)
  const { execSync } = await import('child_process')
  const dbPath = getDatabasePath()

  try {
    execSync(`npx prisma db push --skip-generate`, {
      env: {
        ...process.env,
        DATABASE_URL: `file:${dbPath}`
      },
      cwd: app.isPackaged
        ? join(process.resourcesPath, 'app.asar.unpacked')
        : join(__dirname, '../../'),
      stdio: 'pipe'
    })
  } catch (error) {
    console.error('Failed to push database schema:', error)
  }

  // Seed default admin if no users exist
  const userCount = await db.user.count()
  if (userCount === 0) {
    const hashedPassword = await bcrypt.hash('admin123', 10)
    await db.user.create({
      data: {
        username: 'admin',
        password: hashedPassword,
        fullName: 'Administrateur',
        role: 'admin'
      }
    })
    console.log('Default admin user created (admin / admin123)')
  }

  // Seed default settings
  const settingsCount = await db.setting.count()
  if (settingsCount === 0) {
    await db.setting.createMany({
      data: [
        { key: 'business_name', value: 'Aksil Miel' },
        { key: 'business_address', value: '' },
        { key: 'business_phone', value: '' },
        { key: 'business_email', value: '' },
        { key: 'business_tax_id', value: '' },
        { key: 'currency', value: 'DZD' },
        { key: 'tax_rate', value: '19' },
        { key: 'wholesale_discount', value: '15' },
        { key: 'logo_path', value: '' },
        { key: 'language', value: 'fr' }
      ]
    })
  }

  // Seed demo data
  await seedDemoData(db)
}

async function seedDemoData(db: PrismaClient): Promise<void> {
  const productCount = await db.product.count()
  if (productCount > 0) return

  // Create demo products
  const products = await Promise.all([
    db.product.create({
      data: {
        name: 'Miel de Jujubier (Sidr)',
        type: 'Sidr',
        description: 'Miel premium de jujubier, récolte artisanale',
        unit: 'kg',
        buyPrice: 3000,
        sellPrice: 5500,
        wholesale: 4500,
        minStock: 5
      }
    }),
    db.product.create({
      data: {
        name: 'Miel de Montagne',
        type: 'Montagne',
        description: 'Miel polyfloral des montagnes de Kabylie',
        unit: 'kg',
        buyPrice: 1500,
        sellPrice: 3000,
        wholesale: 2500,
        minStock: 10
      }
    }),
    db.product.create({
      data: {
        name: "Miel d'Eucalyptus",
        type: 'Eucalyptus',
        description: "Miel d'eucalyptus aux propriétés antiseptiques",
        unit: 'kg',
        buyPrice: 1200,
        sellPrice: 2500,
        wholesale: 2000,
        minStock: 8
      }
    }),
    db.product.create({
      data: {
        name: 'Miel de Lavande',
        type: 'Lavande',
        description: 'Miel de lavande doux et parfumé',
        unit: 'kg',
        buyPrice: 2000,
        sellPrice: 4000,
        wholesale: 3200,
        minStock: 5
      }
    }),
    db.product.create({
      data: {
        name: 'Miel de Thym',
        type: 'Thym',
        description: 'Miel de thym sauvage, goût intense',
        unit: 'kg',
        buyPrice: 1800,
        sellPrice: 3500,
        wholesale: 2800,
        minStock: 7
      }
    }),
    db.product.create({
      data: {
        name: 'Miel de Fleurs Sauvages',
        type: 'Fleurs Sauvages',
        description: 'Miel polyfloral naturel',
        unit: 'kg',
        buyPrice: 1000,
        sellPrice: 2200,
        wholesale: 1800,
        minStock: 15
      }
    }),
    db.product.create({
      data: {
        name: 'Miel de Romarin',
        type: 'Romarin',
        description: 'Miel cristallisé de romarin',
        unit: 'pot',
        buyPrice: 800,
        sellPrice: 1500,
        wholesale: 1200,
        minStock: 20
      }
    }),
    db.product.create({
      data: {
        name: "Miel d'Oranger",
        type: 'Oranger',
        description: "Miel délicat de fleurs d'oranger",
        unit: 'kg',
        buyPrice: 1600,
        sellPrice: 3200,
        wholesale: 2600,
        minStock: 6
      }
    })
  ])

  // Create inventory for each product
  for (const product of products) {
    const qty = Math.floor(Math.random() * 50) + 5
    await db.inventoryMovement.create({
      data: {
        productId: product.id,
        type: 'IN',
        quantity: qty,
        reason: 'Stock initial',
        reference: 'INIT-001'
      }
    })
  }

  // Create demo customers
  const customers = await Promise.all([
    db.customer.create({
      data: {
        name: 'Épicerie Amine',
        type: 'wholesale',
        phone: '0555 12 34 56',
        email: 'amine@epicerie.dz',
        address: 'Rue des Oliviers, Tizi Ouzou'
      }
    }),
    db.customer.create({
      data: {
        name: 'Boutique Naturelle',
        type: 'wholesale',
        phone: '0661 78 90 12',
        email: 'contact@naturelle.dz',
        address: 'Boulevard de la Liberté, Alger'
      }
    }),
    db.customer.create({
      data: {
        name: 'Karim Bouzid',
        type: 'retail',
        phone: '0770 34 56 78'
      }
    }),
    db.customer.create({
      data: {
        name: 'Fatima Kaci',
        type: 'retail',
        phone: '0550 98 76 54'
      }
    }),
    db.customer.create({
      data: {
        name: 'Supermarché El Baraka',
        type: 'wholesale',
        phone: '0560 11 22 33',
        email: 'elbaraka@market.dz',
        address: 'Centre Commercial, Béjaïa'
      }
    })
  ])

  // Create demo sales
  const now = new Date()
  for (let i = 0; i < 15; i++) {
    const daysAgo = Math.floor(Math.random() * 30)
    const saleDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)
    const customer = customers[Math.floor(Math.random() * customers.length)]
    const product = products[Math.floor(Math.random() * products.length)]
    const qty = Math.floor(Math.random() * 5) + 1
    const isWholesale = customer.type === 'wholesale'
    const price = isWholesale ? product.wholesale || product.sellPrice : product.sellPrice
    const total = price * qty
    const discount = isWholesale ? total * 0.05 : 0

    await db.sale.create({
      data: {
        customerId: customer.id,
        type: isWholesale ? 'wholesale' : 'retail',
        total: total - discount,
        discount,
        paid: total - discount,
        status: 'completed',
        createdAt: saleDate,
        items: {
          create: {
            productId: product.id,
            quantity: qty,
            unitPrice: price,
            total: price * qty
          }
        }
      }
    })

    // Create OUT movement for the sale
    await db.inventoryMovement.create({
      data: {
        productId: product.id,
        type: 'OUT',
        quantity: qty,
        reason: 'Vente',
        reference: `SALE-${i + 1}`,
        createdAt: saleDate
      }
    })
  }

  console.log('Demo data seeded successfully')
}

export async function closeDatabase(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect()
    prisma = null
  }
}

export function getDatabaseFilePath(): string {
  return getDatabasePath()
}
