import { db } from './db.js';
import { users, employees, departments, twvApplications } from '../shared/schema.js';
import bcrypt from 'bcryptjs';

async function seedDatabase() {
  console.log('Starting database seeding...');

  try {
    // Create demo admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const adminUser = await db.insert(users).values({
      email: 'admin@twv.nl',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      status: 'active'
    }).returning().catch(() => null);

    if (adminUser) {
      console.log('Admin user created: admin@twv.nl / admin123');
    }

    // Create demo HR user
    const hrPassword = await bcrypt.hash('hr123', 10);
    
    const hrUser = await db.insert(users).values({
      email: 'hr@twv.nl',
      password: hrPassword,
      firstName: 'HR',
      lastName: 'Manager',
      role: 'hr',
      status: 'active'
    }).returning().catch(() => null);

    if (hrUser) {
      console.log('HR user created: hr@twv.nl / hr123');
    }

    // Create demo department
    const department = await db.insert(departments).values({
      name: 'Algemeen',
      description: 'Algemene afdeling voor medewerkers',
      isActive: true
    }).returning().catch(() => null);

    // Create demo employees
    const demoEmployees = [
      {
        firstName: 'Ahmed',
        lastName: 'Hassan',
        email: 'ahmed.hassan@demo.nl',
        nationality: 'non_EU' as const,
        positionTitle: 'Warehouse Worker',
        employmentStartDate: '2024-01-15',
        status: 'active' as const,
        departmentId: department?.[0]?.id || null
      },
      {
        firstName: 'Maria',
        lastName: 'Rodriguez',
        email: 'maria.rodriguez@demo.nl',
        nationality: 'EU' as const,
        positionTitle: 'Production Assistant',
        employmentStartDate: '2024-02-01',
        status: 'active' as const,
        departmentId: department?.[0]?.id || null
      },
      {
        firstName: 'Viktor',
        lastName: 'Petrov',
        email: 'viktor.petrov@demo.nl',
        nationality: 'non_EU' as const,
        positionTitle: 'Logistics Coordinator',
        employmentStartDate: '2024-03-10',
        status: 'active' as const,
        departmentId: department?.[0]?.id || null
      }
    ];

    for (const employeeData of demoEmployees) {
      const employee = await db.insert(employees).values(employeeData).returning().catch(() => null);
      
      if (employee && employee[0] && employeeData.nationality === 'non_EU') {
        // Create TWV application for non-EU employees
        await db.insert(twvApplications).values({
          employeeId: employee[0].id,
          twvType: 'general',
          status: Math.random() > 0.5 ? 'pending' : 'approved',
          applicationDate: new Date(),
          createdBy: adminUser?.[0]?.id || 1
        }).catch(() => null);
      }
    }

    console.log('Demo employees and TWV applications created');
    console.log('Database seeding completed successfully!');

  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

// Run seed if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  await seedDatabase();
  process.exit(0);
}

export { seedDatabase };