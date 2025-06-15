import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@inventory.com' },
    update: {},
    create: {
      email: 'admin@inventory.com',
      password: hashedPassword,
      name: 'Admin User',
      role: 'ADMIN'
    }
  });

  // Create categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { name: 'Electronics' },
      update: {},
      create: {
        name: 'Electronics',
        description: 'Consumer electronics and gadgets'
      }
    }),
    prisma.category.upsert({
      where: { name: 'Clothing' },
      update: {},
      create: {
        name: 'Clothing',
        description: 'Apparel and fashion items'
      }
    }),
    prisma.category.upsert({
      where: { name: 'Home & Garden' },
      update: {},
      create: {
        name: 'Home & Garden',
        description: 'Home improvement and garden supplies'
      }
    }),
    prisma.category.upsert({
      where: { name: 'Kitchen & Dining' },
      update: {},
      create: {
        name: 'Kitchen & Dining',
        description: 'Kitchen appliances and dining essentials'
      }
    })
  ]);

  // Create suppliers
  const suppliers = await Promise.all([
    prisma.supplier.create({
      data: {
        name: 'TechSupply Co.',
        contactEmail: 'contact@techsupply.com',
        contactPhone: '+1-555-0101',
        address: '123 Tech Street, Silicon Valley, CA',
        rating: 4.5
      }
    }),
    prisma.supplier.create({
      data: {
        name: 'EcoProducts Ltd.',
        contactEmail: 'orders@ecoproducts.com',
        contactPhone: '+1-555-0102',
        address: '456 Green Avenue, Portland, OR',
        rating: 4.2
      }
    }),
    prisma.supplier.create({
      data: {
        name: 'Textile Partners',
        contactEmail: 'sales@textilepartners.com',
        contactPhone: '+1-555-0103',
        address: '789 Fashion Blvd, New York, NY',
        rating: 4.7
      }
    }),
    prisma.supplier.create({
      data: {
        name: 'CulinaryPro Supply',
        contactEmail: 'info@culinarypro.com',
        contactPhone: '+1-555-0104',
        address: '321 Kitchen Way, Chicago, IL',
        rating: 4.8
      }
    })
  ]);

  // Create locations
  const locations = await Promise.all([
    prisma.location.create({
      data: {
        name: 'A-1-001',
        warehouse: 'Main Warehouse',
        zone: 'A'
      }
    }),
    prisma.location.create({
      data: {
        name: 'B-2-015',
        warehouse: 'Main Warehouse',
        zone: 'B'
      }
    }),
    prisma.location.create({
      data: {
        name: 'C-1-022',
        warehouse: 'Secondary Warehouse',
        zone: 'C'
      }
    }),
    prisma.location.create({
      data: {
        name: 'D-3-008',
        warehouse: 'Main Warehouse',
        zone: 'D'
      }
    })
  ]);

  // Create products
  const products = await Promise.all([
    prisma.product.create({
      data: {
        name: 'Wireless Bluetooth Headphones',
        sku: 'WBH-001',
        currentStock: 45,
        reorderPoint: 50,
        optimalStock: 150,
        unitPrice: 89.99,
        velocity: 'HIGH',
        riskLevel: 'HIGH',
        categoryId: categories[0].id, // Electronics
        supplierId: suppliers[0].id,
        locationId: locations[0].id
      }
    }),
    prisma.product.create({
      data: {
        name: 'Stainless Steel Water Bottle',
        sku: 'SSWB-002',
        currentStock: 200,
        reorderPoint: 75,
        optimalStock: 250,
        unitPrice: 24.99,
        velocity: 'MEDIUM',
        riskLevel: 'LOW',
        categoryId: categories[2].id, // Home & Garden
        supplierId: suppliers[1].id,
        locationId: locations[1].id
      }
    }),
    prisma.product.create({
      data: {
        name: 'Organic Cotton T-Shirt',
        sku: 'OCT-003',
        currentStock: 85,
        reorderPoint: 100,
        optimalStock: 300,
        unitPrice: 19.99,
        velocity: 'HIGH',
        riskLevel: 'MEDIUM',
        categoryId: categories[1].id, // Clothing
        supplierId: suppliers[2].id,
        locationId: locations[2].id
      }
    }),
    prisma.product.create({
      data: {
        name: 'Professional Kitchen Knife Set',
        sku: 'PKNS-004',
        currentStock: 25,
        reorderPoint: 30,
        optimalStock: 75,
        unitPrice: 149.99,
        velocity: 'LOW',
        riskLevel: 'MEDIUM',
        categoryId: categories[3].id, // Kitchen & Dining
        supplierId: suppliers[3].id,
        locationId: locations[3].id
      }
    }),
    prisma.product.create({
      data: {
        name: 'Smart Fitness Tracker',
        sku: 'SFT-005',
        currentStock: 15,
        reorderPoint: 25,
        optimalStock: 120,
        unitPrice: 129.99,
        velocity: 'HIGH',
        riskLevel: 'HIGH',
        categoryId: categories[0].id, // Electronics
        supplierId: suppliers[0].id,
        locationId: locations[0].id
      }
    })
  ]);

  // Create sample stock movements
  const movements = [];
  for (const product of products) {
    // Create some historical movements for AI training
    for (let i = 30; i > 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      // Random outbound movements (sales)
      if (Math.random() > 0.3) {
        movements.push(
          prisma.stockMovement.create({
            data: {
              productId: product.id,
              movementType: 'OUT',
              quantity: Math.floor(Math.random() * 10) + 1,
              referenceNumber: `SALE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              notes: 'Customer order',
              createdAt: date,
              createdBy: adminUser.id
            }
          })
        );
      }

      // Occasional inbound movements (restocking)
      if (Math.random() > 0.8) {
        movements.push(
          prisma.stockMovement.create({
            data: {
              productId: product.id,
              movementType: 'IN',
              quantity: Math.floor(Math.random() * 50) + 20,
              referenceNumber: `PO-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              notes: 'Supplier delivery',
              createdAt: date,
              createdBy: adminUser.id
            }
          })
        );
      }
    }
  }

  await Promise.all(movements);

  // Create sample alerts
  await Promise.all([
    prisma.alert.create({
      data: {
        productId: products[4].id, // Smart Fitness Tracker
        alertType: 'CRITICAL',
        title: 'Stock Out Alert',
        description: 'Smart Fitness Tracker is below critical threshold (15 units remaining)'
      }
    }),
    prisma.alert.create({
      data: {
        productId: products[0].id, // Wireless Bluetooth Headphones
        alertType: 'WARNING',
        title: 'Reorder Point Reached',
        description: 'Wireless Bluetooth Headphones has reached reorder point (45 units)'
      }
    }),
    prisma.alert.create({
      data: {
        alertType: 'INFO',
        title: 'Supplier Performance Update',
        description: 'TechSupply Co. delivery performance improved by 15% this month'
      }
    })
  ]);

  console.log('✅ Database seeded successfully!');
  console.log(`👤 Admin user created: admin@inventory.com / admin123`);
  console.log(`📦 Created ${categories.length} categories`);
  console.log(`🏢 Created ${suppliers.length} suppliers`);
  console.log(`📍 Created ${locations.length} locations`);
  console.log(`🎯 Created ${products.length} products`);
  console.log(`📊 Created ${movements.length} stock movements`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });