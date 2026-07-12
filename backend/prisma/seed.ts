import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10);
  console.log('Clearing database...');
  await prisma.activityLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.maintenance.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.transfer.deleteMany();
  await prisma.allocation.deleteMany();
  await prisma.discrepancyReport.deleteMany();
  await prisma.auditRecord.deleteMany();
  await prisma.auditCycle.deleteMany();
  await prisma.assetDocument.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.assetCategory.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();

  console.log('Seeding 5 departments...');
  const deptsInfo = [
    { name: 'Engineering', code: 'ENG-DEPT' },
    { name: 'Facilities', code: 'FAC-DEPT' },
    { name: 'IT', code: 'IT-DEPT' },
    { name: 'HR', code: 'HR-DEPT' },
    { name: 'Operations', code: 'OPS-DEPT' },
  ];

  const deptsMap: Record<string, any> = {};
  for (const dept of deptsInfo) {
    const d = await prisma.department.create({
      data: {
        name: dept.name,
        departmentCode: dept.code,
        status: 'ACTIVE',
      },
    });
    deptsMap[dept.name] = d;
  }

  console.log('Seeding 30 users...');
  const usersList = [
    // 2 Admins
    { email: 'admin@assetflow.com', name: 'Sarah Connor', role: 'ADMIN', dept: 'IT' },
    { email: 'admin2@assetflow.com', name: 'John Connor', role: 'ADMIN', dept: 'IT' },
    // 3 Asset Managers
    { email: 'manager@assetflow.com', name: 'John Doe', role: 'ASSET_MANAGER', dept: 'Operations' },
    { email: 'manager2@assetflow.com', name: 'Jane Doe', role: 'ASSET_MANAGER', dept: 'Operations' },
    { email: 'manager3@assetflow.com', name: 'Bob Smith', role: 'ASSET_MANAGER', dept: 'Facilities' },
    // 5 Department Heads
    { email: 'ithead@assetflow.com', name: 'James Smith', role: 'DEPARTMENT_HEAD', dept: 'IT' },
    { email: 'hrhead@assetflow.com', name: 'Emily Davis', role: 'DEPARTMENT_HEAD', dept: 'HR' },
    { email: 'opshead@assetflow.com', name: 'Marcus Wright', role: 'DEPARTMENT_HEAD', dept: 'Operations' },
    { email: 'enghead@assetflow.com', name: 'Alice Johnson', role: 'DEPARTMENT_HEAD', dept: 'Engineering' },
    { email: 'fachead@assetflow.com', name: 'Charlie Brown', role: 'DEPARTMENT_HEAD', dept: 'Facilities' },
    // 20 Employees
    { email: 'employee@assetflow.com', name: 'Alex Johnson', role: 'EMPLOYEE', dept: 'IT' },
    { email: 'priya@assetflow.com', name: 'Priya Sharma', role: 'EMPLOYEE', dept: 'HR' },
    { email: 'employee3@assetflow.com', name: 'David Lee', role: 'EMPLOYEE', dept: 'Engineering' },
    { email: 'employee4@assetflow.com', name: 'Sophia Martinez', role: 'EMPLOYEE', dept: 'Engineering' },
    { email: 'employee5@assetflow.com', name: 'Michael Chen', role: 'EMPLOYEE', dept: 'IT' },
    { email: 'employee6@assetflow.com', name: 'Emma Wilson', role: 'EMPLOYEE', dept: 'HR' },
    { email: 'employee7@assetflow.com', name: 'Daniel Taylor', role: 'EMPLOYEE', dept: 'Operations' },
    { email: 'employee8@assetflow.com', name: 'Olivia Thomas', role: 'EMPLOYEE', dept: 'Operations' },
    { email: 'employee9@assetflow.com', name: 'James Anderson', role: 'EMPLOYEE', dept: 'Facilities' },
    { email: 'employee10@assetflow.com', name: 'Isabella Jackson', role: 'EMPLOYEE', dept: 'Facilities' },
    { email: 'employee11@assetflow.com', name: 'William White', role: 'EMPLOYEE', dept: 'Engineering' },
    { email: 'employee12@assetflow.com', name: 'Mia Harris', role: 'EMPLOYEE', dept: 'HR' },
    { email: 'employee13@assetflow.com', name: 'Lucas Martin', role: 'EMPLOYEE', dept: 'IT' },
    { email: 'employee14@assetflow.com', name: 'Charlotte Thompson', role: 'EMPLOYEE', dept: 'Operations' },
    { email: 'employee15@assetflow.com', name: 'Henry Garcia', role: 'EMPLOYEE', dept: 'Engineering' },
    { email: 'employee16@assetflow.com', name: 'Amelia Martinez', role: 'EMPLOYEE', dept: 'IT' },
    { email: 'employee17@assetflow.com', name: 'Alexander Robinson', role: 'EMPLOYEE', dept: 'Facilities' },
    { email: 'employee18@assetflow.com', name: 'Harper Clark', role: 'EMPLOYEE', dept: 'HR' },
    { email: 'employee19@assetflow.com', name: 'Evelyn Rodriguez', role: 'EMPLOYEE', dept: 'Operations' },
    { email: 'inactive@assetflow.com', name: 'Former Colleague', role: 'EMPLOYEE', dept: 'IT', status: 'INACTIVE' },
  ];

  const users: any[] = [];
  for (const u of usersList) {
    const createdUser = await prisma.user.create({
      data: {
        name: u.name,
        email: u.email,
        role: u.role,
        password: passwordHash,
        status: u.status || 'ACTIVE',
        departmentId: deptsMap[u.dept].id,
      },
    });
    users.push(createdUser);
  }

  // Update Heads on Departments
  for (const deptName of Object.keys(deptsMap)) {
    const headUser = users.find(u => u.role === 'DEPARTMENT_HEAD' && usersList.find(ul => ul.email === u.email)?.dept === deptName);
    if (headUser) {
      await prisma.department.update({
        where: { id: deptsMap[deptName].id },
        data: { headEmployeeId: headUser.id },
      });
    }
  }

  console.log('Seeding categories...');
  const catNames = ['LAPTOP', 'MONITOR', 'ELECTRONICS', 'FURNITURE', 'VEHICLE', 'CONFERENCE_ROOM'];
  const catsMap: Record<string, any> = {};
  for (const c of catNames) {
    const createdCat = await prisma.assetCategory.create({
      data: {
        name: c,
        description: `${c} items for the organization`,
        customFields: 'AssetTag,Brand,Model',
      },
    });
    catsMap[c] = createdCat;
  }

  console.log('Seeding 105 assets...');
  const assets: any[] = [];
  const conditions = ['NEW', 'GOOD', 'FAIR', 'POOR'];
  const locations = ['HQ Desk 10', 'Server Lab', 'Conf Room A', 'HQ Floor 2', 'Facilities Bay 4', 'Storage Yard'];

  for (let i = 1; i <= 105; i++) {
    const tag = `AF-${i.toString().padStart(6, '0')}`;
    let categoryName = 'LAPTOP';
    let isBookable = false;
    
    if (i > 95) {
      categoryName = 'CONFERENCE_ROOM';
      isBookable = true;
    } else if (i > 80) {
      categoryName = 'VEHICLE';
      isBookable = true;
    } else if (i > 60) {
      categoryName = 'ELECTRONICS';
      isBookable = i % 2 === 0;
    } else if (i > 40) {
      categoryName = 'FURNITURE';
    } else if (i > 25) {
      categoryName = 'MONITOR';
    }

    // Determine state
    let status = 'AVAILABLE';
    if (i <= 30) status = 'ALLOCATED';
    else if (i <= 45) status = 'UNDER_MAINTENANCE';
    else if (i <= 50) status = 'LOST';
    else if (i <= 55) status = 'RETIRED';

    // Distribute across departments
    const deptKeys = Object.keys(deptsMap);
    const assignedDept = deptsMap[deptKeys[i % deptKeys.length]];

    const asset = await prisma.asset.create({
      data: {
        assetTag: tag,
        name: `${categoryName.toLowerCase().replace('_', ' ')} #${i}`,
        categoryId: catsMap[categoryName].id,
        status,
        value: 100 + (i * 25),
        serialNumber: `SN-DEV-${i.toString().padStart(4, '0')}`,
        condition: conditions[i % conditions.length],
        purchaseDate: new Date(new Date().getTime() - (i * 5 * 24 * 60 * 60 * 1000)),
        purchaseCost: 100 + (i * 25),
        bookable: isBookable,
        location: locations[i % locations.length],
        departmentId: assignedDept.id,
        qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${tag}`,
      },
    });
    assets.push(asset);
  }

  console.log('Seeding allocations...');
  const allocatedAssets = assets.filter(a => a.status === 'ALLOCATED');
  const employees = users.filter(u => u.role === 'EMPLOYEE');
  
  for (let idx = 0; idx < allocatedAssets.length; idx++) {
    const asset = allocatedAssets[idx];
    const employee = employees[idx % employees.length];
    
    await prisma.allocation.create({
      data: {
        assetId: asset.id,
        userId: employee.id,
        allocatedAt: new Date(new Date().getTime() - 10 * 24 * 60 * 60 * 1000),
        status: 'ACTIVE',
        conditionAtAllocation: 'GOOD',
        notes: 'Assigned for daily operations',
      },
    });
  }

  // Also seed some past closed allocations
  for (let idx = 0; idx < 15; idx++) {
    const asset = assets[idx % assets.length];
    const employee = employees[idx % employees.length];
    await prisma.allocation.create({
      data: {
        assetId: asset.id,
        userId: employee.id,
        allocatedAt: new Date(new Date().getTime() - 30 * 24 * 60 * 60 * 1000),
        returnedAt: new Date(new Date().getTime() - 20 * 24 * 60 * 60 * 1000),
        status: 'CLOSED',
        conditionAtAllocation: 'GOOD',
        conditionAtReturn: 'GOOD',
        notes: 'Temporary project loan',
      },
    });
  }

  console.log('Seeding 40 bookings...');
  const bookableAssets = assets.filter(a => a.bookable);
  const now = new Date();
  
  for (let i = 0; i < 40; i++) {
    const asset = bookableAssets[i % bookableAssets.length];
    const employee = employees[i % employees.length];
    
    let status = 'COMPLETED';
    let start = new Date(now.getTime() - (i + 1) * 24 * 60 * 60 * 1000);
    let end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
    
    if (i < 5) {
      status = 'ACTIVE';
      start = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
      end = new Date(start.getTime() + 3 * 60 * 60 * 1000);
    } else if (i < 10) {
      status = 'CANCELLED';
      start = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      end = new Date(start.getTime() + 1 * 60 * 60 * 1000);
    }

    await prisma.booking.create({
      data: {
        assetId: asset.id,
        userId: employee.id,
        startTime: start,
        endTime: end,
        status,
        purpose: `Project Meeting session ${i}`,
      },
    });
  }

  console.log('Seeding 15 maintenance requests...');
  const maintenanceStatuses = ['PENDING', 'APPROVED', 'TECHNICIAN_ASSIGNED', 'IN_PROGRESS', 'RESOLVED'];
  for (let i = 0; i < 15; i++) {
    const asset = assets[(i * 3) % assets.length];
    const requester = employees[i % employees.length];
    const status = maintenanceStatuses[i % maintenanceStatuses.length];

    await prisma.maintenance.create({
      data: {
        assetId: asset.id,
        description: `Keyboard replacement and system cleaning request #${i}`,
        priority: i % 3 === 0 ? 'HIGH' : i % 2 === 0 ? 'MEDIUM' : 'LOW',
        status,
        assignedTechnician: status !== 'PENDING' ? 'Marcus Lee' : null,
        requestedById: requester.id,
        cost: status === 'RESOLVED' ? 120.0 + i * 10 : 0,
        createdAt: new Date(now.getTime() - (15 - i) * 24 * 60 * 60 * 1000),
        approvedAt: status !== 'PENDING' ? new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000) : null,
        resolvedAt: status === 'RESOLVED' ? new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000) : null,
      },
    });
  }

  console.log('Seeding 23 transfers...');
  for (let i = 0; i < 23; i++) {
    const asset = assets[(i * 2 + 10) % assets.length];
    const targetDeptKeys = Object.keys(deptsMap);
    const toDept = deptsMap[targetDeptKeys[i % targetDeptKeys.length]];
    const fromDept = deptsMap[targetDeptKeys[(i + 1) % targetDeptKeys.length]];
    const status = i < 8 ? 'PENDING' : 'APPROVED';

    await prisma.transfer.create({
      data: {
        assetId: asset.id,
        fromDepartmentId: fromDept.id,
        toDepartmentId: toDept.id,
        status,
        requestedById: employees[i % employees.length].id,
        reason: `Inter-department project transfer request #${i}`,
        requestedAt: new Date(now.getTime() - (25 - i) * 24 * 60 * 60 * 1000),
        approvedAt: status === 'APPROVED' ? new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000) : null,
      },
    });
  }

  console.log('Seeding audits: 1 active, 2 closed cycles...');
  // Closed Cycle 1
  const closedAudit1 = await prisma.auditCycle.create({
    data: {
      title: 'Q1 Compliance Audit',
      departmentId: deptsMap['IT'].id,
      location: 'HQ floor 1',
      startDate: new Date(now.getTime() - 90*24*60*60*1000),
      endDate: new Date(now.getTime() - 85*24*60*60*1000),
      assignedAuditors: 'admin@assetflow.com',
      status: 'CLOSED',
      closedAt: new Date(now.getTime() - 85*24*60*60*1000)
    }
  });

  // Closed Cycle 2
  const closedAudit2 = await prisma.auditCycle.create({
    data: {
      title: 'Q2 Compliance Audit',
      departmentId: deptsMap['Operations'].id,
      location: 'Warehouse Floor',
      startDate: new Date(now.getTime() - 45*24*60*60*1000),
      endDate: new Date(now.getTime() - 40*24*60*60*1000),
      assignedAuditors: 'manager@assetflow.com',
      status: 'CLOSED',
      closedAt: new Date(now.getTime() - 40*24*60*60*1000)
    }
  });

  // Active Cycle
  const activeAudit = await prisma.auditCycle.create({
    data: {
      title: 'Q3 Central Floor Audit',
      departmentId: deptsMap['HR'].id,
      location: 'HQ Floor 2',
      startDate: new Date(now.getTime() - 2*24*60*60*1000),
      endDate: new Date(now.getTime() + 5*24*60*60*1000),
      assignedAuditors: 'admin@assetflow.com',
      status: 'ACTIVE'
    }
  });

  // Seed records and discrepancies for closed audits
  const itAssets = assets.filter(a => a.departmentId === deptsMap['IT'].id);
  const opsAssets = assets.filter(a => a.departmentId === deptsMap['Operations'].id);
  const hrAssets = assets.filter(a => a.departmentId === deptsMap['HR'].id);

  // Closed Audit 1 Records
  for (const a of itAssets.slice(0, 5)) {
    await prisma.auditRecord.create({
      data: {
        auditCycleId: closedAudit1.id,
        assetId: a.id,
        expectedLocation: 'Server Room',
        verificationStatus: 'VERIFIED',
        remarks: 'Item matches specifications',
        verifiedBy: 'admin@assetflow.com',
        verifiedAt: new Date(now.getTime() - 87*24*60*60*1000)
      }
    });
  }

  // Closed Audit 2 Records (Including one missing discrepancy!)
  const opsSelection = opsAssets.slice(0, 5);
  for (let idx = 0; idx < opsSelection.length; idx++) {
    const a = opsSelection[idx];
    const isMissing = idx === 0;
    
    await prisma.auditRecord.create({
      data: {
        auditCycleId: closedAudit2.id,
        assetId: a.id,
        expectedLocation: 'Operations Floor',
        verificationStatus: isMissing ? 'MISSING' : 'VERIFIED',
        remarks: isMissing ? 'Flagged missing' : 'Verified OK',
        verifiedBy: 'manager@assetflow.com',
        verifiedAt: new Date(now.getTime() - 42*24*60*60*1000)
      }
    });

    if (isMissing) {
      await prisma.discrepancyReport.create({
        data: {
          auditCycleId: closedAudit2.id,
          assetId: a.id,
          issueType: 'MISSING',
          severity: 'HIGH',
          resolutionStatus: 'RESOLVED',
          generatedAt: new Date(now.getTime() - 42*24*60*60*1000)
        }
      });
    }
  }

  // Active Audit Records (Pending checklists)
  for (const a of hrAssets.slice(0, 10)) {
    await prisma.auditRecord.create({
      data: {
        auditCycleId: activeAudit.id,
        assetId: a.id,
        expectedLocation: 'HQ Room 204',
        verificationStatus: 'PENDING'
      }
    });
  }

  console.log('Seeding 100+ notifications...');
  const notifTypes = ['OVERDUE_RETURN', 'MAINTENANCE_DUE', 'TRANSFER_REQUEST', 'GENERAL'];
  for (let i = 0; i < 110; i++) {
    const targetUser = users[i % users.length];
    await prisma.notification.create({
      data: {
        userId: targetUser.id,
        message: `Alert Notification message context item #${i}: Compliance check updates`,
        type: notifTypes[i % notifTypes.length],
        isRead: i % 3 === 0,
        createdAt: new Date(now.getTime() - i * 2 * 60 * 60 * 1000),
      },
    });
  }

  console.log('Seeding 300+ activity logs...');
  const logTypes = ['ASSET_CREATED', 'ASSET_ALLOCATED', 'MAINTENANCE_CREATED', 'TRANSFER_REQUESTED'];
  for (let i = 0; i < 305; i++) {
    const actor = users[i % users.length];
    await prisma.activityLog.create({
      data: {
        type: logTypes[i % logTypes.length],
        message: `Activity record log tracking index #${i}: system parameters updated.`,
        userId: actor.id,
        createdAt: new Date(now.getTime() - i * 30 * 60 * 1000),
      },
    });
  }

  console.log('Database fully seeded with realistic, interconnected dataset!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
