import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing database...');
  await prisma.activityLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.maintenance.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.transfer.deleteMany();
  await prisma.allocation.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();

  console.log('Seeding departments...');
  const itDept = await prisma.department.create({ data: { name: 'IT' } });
  const hrDept = await prisma.department.create({ data: { name: 'HR' } });
  const opsDept = await prisma.department.create({ data: { name: 'Operations' } });
  const finDept = await prisma.department.create({ data: { name: 'Finance' } });

  console.log('Seeding users...');
  // 1. Admin
  const admin = await prisma.user.create({
    data: {
      name: 'Sarah Connor',
      email: 'admin@assetflow.com',
      role: 'ADMIN',
    },
  });

  // 2. Asset Manager
  const manager = await prisma.user.create({
    data: {
      name: 'John Doe',
      email: 'manager@assetflow.com',
      role: 'ASSET_MANAGER',
    },
  });

  // 3. Department Heads
  const itHead = await prisma.user.create({
    data: {
      name: 'James Smith',
      email: 'ithead@assetflow.com',
      role: 'DEPARTMENT_HEAD',
      departmentId: itDept.id,
    },
  });

  const hrHead = await prisma.user.create({
    data: {
      name: 'Emily Davis',
      email: 'hrhead@assetflow.com',
      role: 'DEPARTMENT_HEAD',
      departmentId: hrDept.id,
    },
  });

  // 4. Employees
  const employeeIt = await prisma.user.create({
    data: {
      name: 'Alex Johnson',
      email: 'employee@assetflow.com',
      role: 'EMPLOYEE',
      departmentId: itDept.id,
    },
  });

  const employeeHr = await prisma.user.create({
    data: {
      name: 'Priya Sharma',
      email: 'priya@assetflow.com',
      role: 'EMPLOYEE',
      departmentId: hrDept.id,
    },
  });

  console.log('Seeding assets...');
  const now = new Date();
  
  const tomorrow = new Date();
  tomorrow.setDate(now.getDate() + 1);

  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(now.getDate() - 3);

  const fiveDaysLater = new Date();
  fiveDaysLater.setDate(now.getDate() + 5);

  const tenDaysLater = new Date();
  tenDaysLater.setDate(now.getDate() + 10);

  // Asset 1: MacBook Pro (Allocated to Alex Johnson in IT, expected return: tomorrow)
  const mbp = await prisma.asset.create({
    data: {
      assetTag: 'AF-0001',
      name: 'MacBook Pro 16"',
      category: 'LAPTOP',
      status: 'ALLOCATED',
      value: 2400.0,
      expectedReturnDate: tomorrow,
      departmentId: itDept.id,
    },
  });

  // Asset 2: Office Chair (Available in Operations)
  const chair = await prisma.asset.create({
    data: {
      assetTag: 'AF-0002',
      name: 'Ergonomic Office Chair',
      category: 'FURNITURE',
      status: 'AVAILABLE',
      value: 350.0,
      departmentId: opsDept.id,
    },
  });

  // Asset 3: Dell Monitor (Under Maintenance in IT)
  const monitor = await prisma.asset.create({
    data: {
      assetTag: 'AF-0003',
      name: 'Dell UltraSharp 27" Monitor',
      category: 'ELECTRONICS',
      status: 'UNDER_MAINTENANCE',
      value: 500.0,
      departmentId: itDept.id,
    },
  });

  // Asset 4: iPad Pro (Allocated to Alex Johnson in IT, expected return: 3 days ago - OVERDUE!)
  const ipad = await prisma.asset.create({
    data: {
      assetTag: 'AF-0004',
      name: 'iPad Pro 11"',
      category: 'TABLET',
      status: 'ALLOCATED',
      value: 900.0,
      expectedReturnDate: threeDaysAgo,
      departmentId: itDept.id,
    },
  });

  // Asset 5: Projector (Available in Operations)
  const projector = await prisma.asset.create({
    data: {
      assetTag: 'AF-0005',
      name: 'Epson 4K Projector',
      category: 'ELECTRONICS',
      status: 'AVAILABLE',
      value: 1200.0,
      departmentId: opsDept.id,
    },
  });

  // Asset 6: Laptop AF-0114 (Allocated to Priya Sharma in HR, expected return: 5 days later)
  const hrLaptop = await prisma.asset.create({
    data: {
      assetTag: 'AF-0114',
      name: 'ThinkPad T14',
      category: 'LAPTOP',
      status: 'ALLOCATED',
      value: 1500.0,
      expectedReturnDate: fiveDaysLater,
      departmentId: hrDept.id,
    },
  });

  console.log('Seeding allocations...');
  await prisma.allocation.createMany({
    data: [
      { assetId: mbp.id, userId: employeeIt.id, allocatedAt: threeDaysAgo },
      { assetId: ipad.id, userId: employeeIt.id, allocatedAt: threeDaysAgo },
      { assetId: hrLaptop.id, userId: employeeHr.id, allocatedAt: now },
    ],
  });

  console.log('Seeding transfers...');
  // Transfer request: Chair from Operations to IT (Pending)
  await prisma.transfer.create({
    data: {
      assetId: chair.id,
      fromDepartmentId: opsDept.id,
      toDepartmentId: itDept.id,
      status: 'PENDING',
      requestedById: employeeIt.id,
      requestedAt: now,
    },
  });

  console.log('Seeding bookings...');
  // Active booking for Epson Projector by IT Employee
  const bookingStart = new Date(now.getTime() - 60 * 60 * 1000); // 1 hour ago
  const bookingEnd = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours from now
  await prisma.booking.create({
    data: {
      assetId: projector.id,
      userId: employeeIt.id,
      startTime: bookingStart,
      endTime: bookingEnd,
      status: 'ACTIVE',
      purpose: 'Department Quarterly Review meeting',
    },
  });

  console.log('Seeding maintenance...');
  // Dell Monitor currently under maintenance
  await prisma.maintenance.create({
    data: {
      assetId: monitor.id,
      status: 'IN_PROGRESS',
      description: 'Screen flickering issue - replacing display panel',
      cost: 150.0,
      scheduledFor: now,
      startedAt: now,
    },
  });

  console.log('Seeding notifications...');
  // Overdue alerts
  await prisma.notification.createMany({
    data: [
      {
        userId: employeeIt.id,
        message: 'Your iPad Pro 11" (AF-0004) was due on ' + threeDaysAgo.toDateString() + ' and is now overdue.',
        type: 'OVERDUE_RETURN',
        isRead: false,
        createdAt: threeDaysAgo,
      },
      {
        userId: itHead.id,
        message: 'Employee Alex Johnson has an overdue asset: iPad Pro 11" (AF-0004).',
        type: 'OVERDUE_RETURN',
        isRead: false,
        createdAt: now,
      },
      {
        userId: manager.id,
        message: 'A new transfer request is pending approval: Ergonomic Office Chair (AF-0002) from Operations to IT.',
        type: 'TRANSFER_REQUEST',
        isRead: false,
        createdAt: now,
      },
    ],
  });

  console.log('Seeding activity logs...');
  await prisma.activityLog.createMany({
    data: [
      {
        type: 'ASSET_ALLOCATED',
        message: 'Laptop AF-0114 assigned to Priya Sharma',
        userId: employeeHr.id,
        createdAt: new Date(now.getTime() - 2 * 60 * 1000), // 2 min ago
      },
      {
        type: 'TRANSFER_REQUESTED',
        message: 'Alex Johnson requested transfer of Ergonomic Office Chair (AF-0002) to IT',
        userId: employeeIt.id,
        createdAt: new Date(now.getTime() - 15 * 60 * 1000), // 15 min ago
      },
      {
        type: 'MAINTENANCE_CREATED',
        message: 'Maintenance ticket raised for Dell UltraSharp 27" Monitor (AF-0003)',
        userId: itHead.id,
        createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
      },
      {
        type: 'ASSET_ALLOCATED',
        message: 'MacBook Pro 16" (AF-0001) assigned to Alex Johnson',
        userId: employeeIt.id,
        createdAt: threeDaysAgo,
      },
    ],
  });

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
