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
  await prisma.assetCategory.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();

  console.log('Seeding departments...');
  const itDept = await prisma.department.create({ 
    data: { 
      name: 'IT', 
      departmentCode: 'IT-DEPT', 
      status: 'ACTIVE' 
    } 
  });
  const hrDept = await prisma.department.create({ 
    data: { 
      name: 'HR', 
      departmentCode: 'HR-DEPT', 
      status: 'ACTIVE' 
    } 
  });
  const opsDept = await prisma.department.create({ 
    data: { 
      name: 'Operations', 
      departmentCode: 'OPS-DEPT', 
      status: 'ACTIVE' 
    } 
  });
  const finDept = await prisma.department.create({ 
    data: { 
      name: 'Finance', 
      departmentCode: 'FIN-DEPT', 
      status: 'ACTIVE',
      parentDepartmentId: opsDept.id // Finance sits under Operations for testing hierarchy
    } 
  });

  console.log('Seeding categories...');
  const laptopCat = await prisma.assetCategory.create({
    data: { name: 'LAPTOP', description: 'Portable workstations and accessories', customFields: 'RAM,Storage,Processor' }
  });
  const furnitureCat = await prisma.assetCategory.create({
    data: { name: 'FURNITURE', description: 'Office tables, chairs, and desks', customFields: 'Material,Dimensions' }
  });
  const electronicsCat = await prisma.assetCategory.create({
    data: { name: 'ELECTRONICS', description: 'Monitors, projectors, and adapters', customFields: 'Resolution,Power Rating' }
  });
  const tabletCat = await prisma.assetCategory.create({
    data: { name: 'TABLET', description: 'iPads and mobile devices', customFields: 'OS,Storage,Warranty' }
  });

  console.log('Seeding users...');
  // 1. Admin
  const admin = await prisma.user.create({
    data: {
      name: 'Sarah Connor',
      email: 'admin@assetflow.com',
      role: 'ADMIN',
      status: 'ACTIVE'
    },
  });

  // 2. Asset Manager
  const manager = await prisma.user.create({
    data: {
      name: 'John Doe',
      email: 'manager@assetflow.com',
      role: 'ASSET_MANAGER',
      status: 'ACTIVE'
    },
  });

  // 3. Department Heads
  const itHead = await prisma.user.create({
    data: {
      name: 'James Smith',
      email: 'ithead@assetflow.com',
      role: 'DEPARTMENT_HEAD',
      departmentId: itDept.id,
      status: 'ACTIVE'
    },
  });

  const hrHead = await prisma.user.create({
    data: {
      name: 'Emily Davis',
      email: 'hrhead@assetflow.com',
      role: 'DEPARTMENT_HEAD',
      departmentId: hrDept.id,
      status: 'ACTIVE'
    },
  });

  // Set Heads on Departments
  await prisma.department.update({
    where: { id: itDept.id },
    data: { headEmployeeId: itHead.id }
  });

  await prisma.department.update({
    where: { id: hrDept.id },
    data: { headEmployeeId: hrHead.id }
  });

  // 4. Employees
  const employeeIt = await prisma.user.create({
    data: {
      name: 'Alex Johnson',
      email: 'employee@assetflow.com',
      role: 'EMPLOYEE',
      departmentId: itDept.id,
      status: 'ACTIVE'
    },
  });

  const employeeHr = await prisma.user.create({
    data: {
      name: 'Priya Sharma',
      email: 'priya@assetflow.com',
      role: 'EMPLOYEE',
      departmentId: hrDept.id,
      status: 'ACTIVE'
    },
  });

  // Inactive Employee for setup tables testing
  await prisma.user.create({
    data: {
      name: 'Former Colleague',
      email: 'inactive@assetflow.com',
      role: 'EMPLOYEE',
      departmentId: itDept.id,
      status: 'INACTIVE'
    }
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

  // Asset 1: MacBook Pro (Allocated to Alex Johnson in IT)
  const mbp = await prisma.asset.create({
    data: {
      assetTag: 'AF-000001',
      name: 'MacBook Pro 16"',
      categoryId: laptopCat.id,
      status: 'ALLOCATED',
      value: 2400.0,
      expectedReturnDate: tomorrow,
      departmentId: itDept.id,
      serialNumber: 'SN-MBP-9923',
      condition: 'NEW',
      purchaseDate: new Date(now.getTime() - 90*24*60*60*1000),
      purchaseCost: 2400.0,
      bookable: false,
      qrCode: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=AF-000001'
    },
  });

  // Asset 2: Office Chair (Available in Operations)
  const chair = await prisma.asset.create({
    data: {
      assetTag: 'AF-000002',
      name: 'Ergonomic Office Chair',
      categoryId: furnitureCat.id,
      status: 'AVAILABLE',
      value: 350.0,
      departmentId: opsDept.id,
      serialNumber: 'SN-CHR-0044',
      condition: 'GOOD',
      purchaseDate: new Date(now.getTime() - 120*24*60*60*1000),
      purchaseCost: 350.0,
      bookable: false,
      qrCode: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=AF-000002'
    },
  });

  // Asset 3: Dell Monitor (Under Maintenance in IT)
  const monitor = await prisma.asset.create({
    data: {
      assetTag: 'AF-000003',
      name: 'Dell UltraSharp 27" Monitor',
      categoryId: electronicsCat.id,
      status: 'UNDER_MAINTENANCE',
      value: 500.0,
      departmentId: itDept.id,
      serialNumber: 'SN-MON-5152',
      condition: 'FAIR',
      purchaseDate: new Date(now.getTime() - 365*24*60*60*1000),
      purchaseCost: 500.0,
      bookable: false,
      qrCode: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=AF-000003'
    },
  });

  // Asset 4: iPad Pro (Allocated to Alex Johnson in IT, expected return: 3 days ago - OVERDUE!)
  const ipad = await prisma.asset.create({
    data: {
      assetTag: 'AF-000004',
      name: 'iPad Pro 11"',
      categoryId: tabletCat.id,
      status: 'ALLOCATED',
      value: 900.0,
      expectedReturnDate: threeDaysAgo,
      departmentId: itDept.id,
      serialNumber: 'SN-IPD-8812',
      condition: 'GOOD',
      purchaseDate: new Date(now.getTime() - 60*24*60*60*1000),
      purchaseCost: 900.0,
      bookable: false,
      qrCode: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=AF-000004'
    },
  });

  // Asset 5: Projector (Available in Operations)
  const projector = await prisma.asset.create({
    data: {
      assetTag: 'AF-000005',
      name: 'Epson 4K Projector',
      categoryId: electronicsCat.id,
      status: 'AVAILABLE',
      value: 1200.0,
      departmentId: opsDept.id,
      serialNumber: 'SN-PRJ-1152',
      condition: 'GOOD',
      purchaseDate: new Date(now.getTime() - 10*24*60*60*1000),
      purchaseCost: 1200.0,
      bookable: true,
      qrCode: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=AF-000005'
    },
  });

  // Asset 6: Laptop AF-0114 (Allocated to Priya Sharma in HR)
  const hrLaptop = await prisma.asset.create({
    data: {
      assetTag: 'AF-000114', // Using a longer serial tag but compliant with increment formats
      name: 'ThinkPad T14',
      categoryId: laptopCat.id,
      status: 'ALLOCATED',
      value: 1500.0,
      expectedReturnDate: fiveDaysLater,
      departmentId: hrDept.id,
      serialNumber: 'SN-THK-1049',
      condition: 'NEW',
      purchaseDate: new Date(now.getTime() - 5*24*60*60*1000),
      purchaseCost: 1500.0,
      bookable: false,
      qrCode: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=AF-000114'
    },
  });

  console.log('Seeding asset documents...');
  await prisma.assetDocument.createMany({
    data: [
      { name: 'MacBook_Invoice.pdf', url: '/documents/invoice-001.pdf', assetId: mbp.id },
      { name: 'MacBook_Warranty.pdf', url: '/documents/warranty-001.pdf', assetId: mbp.id },
      { name: 'Monitor_User_Manual.pdf', url: '/documents/manual-003.pdf', assetId: monitor.id },
      { name: 'Projector_Specs_Sheet.pdf', url: '/documents/specs-005.pdf', assetId: projector.id }
    ]
  });

  console.log('Seeding allocations...');
  await prisma.allocation.create({
    data: {
      assetId: mbp.id,
      userId: employeeIt.id,
      allocatedAt: threeDaysAgo,
      conditionAtAllocation: 'NEW',
      status: 'ACTIVE',
      allocatedById: admin.id
    }
  });

  await prisma.allocation.create({
    data: {
      assetId: ipad.id,
      userId: employeeIt.id,
      allocatedAt: threeDaysAgo,
      expectedReturnDate: threeDaysAgo,
      conditionAtAllocation: 'GOOD',
      status: 'ACTIVE',
      allocatedById: admin.id
    }
  });

  await prisma.allocation.create({
    data: {
      assetId: hrLaptop.id,
      userId: employeeHr.id,
      allocatedAt: now,
      conditionAtAllocation: 'NEW',
      status: 'ACTIVE',
      allocatedById: admin.id
    }
  });

  console.log('Seeding transfers...');
  await prisma.transfer.create({
    data: {
      assetId: chair.id,
      fromDepartmentId: opsDept.id,
      toDepartmentId: itDept.id,
      status: 'PENDING',
      requestedById: employeeIt.id,
      requestedAt: now,
      fromUserId: employeeHr.id, // Transfer from Priya Sharma (HR)
      toUserId: employeeIt.id,   // To Alex Johnson (IT)
      reason: 'Workstation reorganization requirement'
    },
  });

  console.log('Seeding bookings...');
  const bookingStart = new Date(now.getTime() - 60 * 60 * 1000);
  const bookingEnd = new Date(now.getTime() + 2 * 60 * 60 * 1000);
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
  await prisma.maintenance.create({
    data: {
      assetId: monitor.id,
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      description: 'Screen flickering issue - replacing display panel',
      cost: 150.0,
      scheduledFor: now,
      startedAt: now,
      assignedTechnician: 'R. Varma',
      requestedById: employeeIt.id
    },
  });

  await prisma.maintenance.create({
    data: {
      assetId: projector.id,
      status: 'PENDING',
      priority: 'MEDIUM',
      description: 'Projector bulb dimmed, needs replacement',
      cost: 80.0,
      scheduledFor: now,
      requestedById: employeeIt.id
    }
  });

  await prisma.maintenance.create({
    data: {
      assetId: chair.id,
      status: 'RESOLVED',
      priority: 'LOW',
      description: 'Chair wheel loose',
      cost: 25.0,
      scheduledFor: now,
      startedAt: now,
      resolvedAt: now,
      resolutionNotes: 'Replaced caster wheel with new spare unit.',
      assignedTechnician: 'S. Patel',
      requestedById: employeeHr.id
    }
  });

  console.log('Seeding notifications...');
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
        createdAt: new Date(now.getTime() - 2 * 60 * 1000),
      },
      {
        type: 'TRANSFER_REQUESTED',
        message: 'Alex Johnson requested transfer of Ergonomic Office Chair (AF-0002) to IT',
        userId: employeeIt.id,
        createdAt: new Date(now.getTime() - 15 * 60 * 1000),
      },
      {
        type: 'MAINTENANCE_CREATED',
        message: 'Maintenance ticket raised for Dell UltraSharp 27" Monitor (AF-0003)',
        userId: itHead.id,
        createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      },
      {
        type: 'ASSET_ALLOCATED',
        message: 'MacBook Pro 16" (AF-0001) assigned to Alex Johnson',
        userId: employeeIt.id,
        createdAt: threeDaysAgo,
      },
    ],
  });

  console.log('Seeding audit cycles...');
  const auditCycle = await prisma.auditCycle.create({
    data: {
      title: 'Q3 IT Hardware Compliance Audit',
      departmentId: itDept.id,
      location: 'HQ Floor 2',
      startDate: new Date(now.getTime() - 2*24*60*60*1000),
      endDate: new Date(now.getTime() + 10*24*60*60*1000),
      assignedAuditors: 'admin@assetflow.com,manager@assetflow.com',
      status: 'ACTIVE'
    }
  });

  await prisma.auditRecord.create({
    data: {
      auditCycleId: auditCycle.id,
      assetId: mbp.id,
      expectedLocation: 'Desk IT-04',
      verificationStatus: 'PENDING'
    }
  });

  await prisma.auditRecord.create({
    data: {
      auditCycleId: auditCycle.id,
      assetId: ipad.id,
      expectedLocation: 'IT Storage Lab',
      verificationStatus: 'PENDING'
    }
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
