/* eslint-disable */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Roles
  const roles = ['CLIENT', 'PROVIDER', 'ADMIN'];
  const createdRoles = {};
  for (const roleName of roles) {
    const role = await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName },
    });
    createdRoles[roleName] = role;
    console.log(`Role ${roleName} upserted.`);
  }

  // 2. Admin User
  // Password hash for 'admin123'
  const adminPasswordHash = '$2b$10$3IjRJo3IxPT4CH4/2xic6.Issh1ZfjLhCm6yUJSEM/F6QfyzorC9q';
  const adminEmail = 'admin@marketplace.com';
  const adminId = '00000000-0000-0000-0000-000000000000';

  const adminUser = await prisma.user.upsert({
    where: { id: adminId },
    update: {
      email: adminEmail,
      passwordHash: adminPasswordHash,
      isActive: true,
    },
    create: {
      id: adminId,
      email: adminEmail,
      passwordHash: adminPasswordHash,
      isActive: true,
    },
  });
  console.log(`Admin user upserted: ${adminEmail}`);

  // Admin User Role assignment
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: adminUser.id,
        roleId: createdRoles['ADMIN'].id,
      },
    },
    update: {
      status: 'approved',
    },
    create: {
      userId: adminUser.id,
      roleId: createdRoles['ADMIN'].id,
      status: 'approved',
    },
  });
  console.log('Admin user role assigned.');

  // 3. Parent Categories
  const parentCategories = [
    { name: 'Digital Services', description: 'Services that can be delivered online such as web dev, graphic design, writing, etc.' },
    { name: 'Local Services', description: 'Services requiring physical presence, such as repairs, home cleaning, delivery, etc.' },
    { name: 'Professional Services', description: 'Expert services including financial advisory, legal consultation, tutoring, etc.' },
  ];

  const categoryMap = {};
  for (const cat of parentCategories) {
    const createdCat = await prisma.category.upsert({
      where: { name: cat.name },
      update: { description: cat.description },
      create: { name: cat.name, description: cat.description },
    });
    categoryMap[cat.name] = createdCat.id;
    console.log(`Category '${cat.name}' upserted.`);
  }

  // 4. Subcategories
  const subcategories = [
    { name: 'Software Development', parentName: 'Digital Services', description: 'Web apps, mobile development, APIs, script automation' },
    { name: 'Graphic Design', parentName: 'Digital Services', description: 'Logo design, UI/UX design, branding materials' },
    { name: 'Content Writing', parentName: 'Digital Services', description: 'Copywriting, blog posts, SEO marketing content' },
    { name: 'Home Repair & Handyman', parentName: 'Local Services', description: 'Plumbing, electrical fixing, furniture assembly' },
    { name: 'House Cleaning', parentName: 'Local Services', description: 'Deep cleaning, disinfection, laundry service' },
    { name: 'Local Moving & Delivery', parentName: 'Local Services', description: 'Relocation assistance, package delivery' },
    { name: 'Business Consulting', parentName: 'Professional Services', description: 'Strategic planning, financial audit, startup advising' },
    { name: 'Legal Advisory', parentName: 'Professional Services', description: 'Contract drafting, legal consulting, registration assistance' },
    { name: 'Tutoring & Language', parentName: 'Professional Services', description: 'Academic support, language lessons, test prep' },
  ];

  for (const sub of subcategories) {
    await prisma.category.upsert({
      where: { name: sub.name },
      update: {
        parentId: categoryMap[sub.parentName],
        description: sub.description,
      },
      create: {
        name: sub.name,
        parentId: categoryMap[sub.parentName],
        description: sub.description,
      },
    });
    console.log(`Subcategory '${sub.name}' upserted under '${sub.parentName}'.`);
  }

  console.log('Database seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
