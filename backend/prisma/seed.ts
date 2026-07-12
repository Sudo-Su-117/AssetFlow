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

  console.log('Seeding 3 departments...');
  const deptsInfo = [
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

  console.log('Seeding 6 users representing all roles...');
  const usersList = [
    { email: 'admin@assetflow.com', name: 'Sarah Connor', role: 'ADMIN', dept: 'IT' },
    { email: 'manager@assetflow.com', name: 'John Doe', role: 'ASSET_MANAGER', dept: 'Operations' },
    { email: 'ithead@assetflow.com', name: 'James Smith', role: 'DEPARTMENT_HEAD', dept: 'IT' },
    { email: 'employee@assetflow.com', name: 'Alex Johnson', role: 'EMPLOYEE', dept: 'IT' },
    { email: 'priya@assetflow.com', name: 'Priya Sharma', role: 'EMPLOYEE', dept: 'HR' },
    { email: 'employee3@assetflow.com', name: 'David Lee', role: 'EMPLOYEE', dept: 'Operations' },
  ];

  const users: any[] = [];
  for (const u of usersList) {
    const createdUser = await prisma.user.create({
      data: {
        name: u.name,
        email: u.email,
        role: u.role,
        password: passwordHash,
        status: 'ACTIVE',
        departmentId: deptsMap[u.dept].id,
      },
    });
    users.push(createdUser);
  }

  // Update IT Head on IT department
  const itHead = users.find(u => u.email === 'ithead@assetflow.com');
  if (itHead) {
    await prisma.department.update({
      where: { id: deptsMap['IT'].id },
      data: { headEmployeeId: itHead.id },
    });
  }

  console.log('Seeding 4 categories...');
  const catNames = ['LAPTOP', 'MONITOR', 'VEHICLE', 'CONFERENCE_ROOM'];
  const catsMap: Record<string, any> = {};
  for (const c of catNames) {
    const createdCat = await prisma.assetCategory.create({
      data: {
        name: c,
        description: `${c} items`,
        customFields: 'Brand,Model',
      },
    });
    catsMap[c] = createdCat;
  }

  console.log('Seeding 15 assets...');
  const assetsInfo = [
    // 5 Available (including bookable)
    { tag: 'AF-000001', name: 'MacBook Air M2', cat: 'LAPTOP', status: 'AVAILABLE', val: 1200, bookable: false, dept: 'IT' },
    { tag: 'AF-000002', name: 'Dell 27 Monitor', cat: 'MONITOR', status: 'AVAILABLE', val: 350, bookable: false, dept: 'IT' },
    { tag: 'AF-000003', name: 'Company Tesla Model 3', cat: 'VEHICLE', status: 'AVAILABLE', val: 45000, bookable: true, dept: 'Operations' },
    { tag: 'AF-000004', name: 'Main Conference Room', cat: 'CONFERENCE_ROOM', status: 'AVAILABLE', val: 0, bookable: true, dept: 'HR' },
    { tag: 'AF-000005', name: 'ThinkPad T14', cat: 'LAPTOP', status: 'AVAILABLE', val: 1100, bookable: false, dept: 'IT' },
    
    // 4 Allocated
    { tag: 'AF-000006', name: 'MacBook Pro 16', cat: 'LAPTOP', status: 'ALLOCATED', val: 2500, bookable: false, dept: 'IT' },
    { tag: 'AF-000007', name: 'Priya Laptop', cat: 'LAPTOP', status: 'ALLOCATED', val: 1300, bookable: false, dept: 'HR' },
    { tag: 'AF-000008', name: 'Operations Tablet', cat: 'MONITOR', status: 'ALLOCATED', val: 600, bookable: false, dept: 'Operations' },
    { tag: 'AF-000009', name: 'External SSD Disk', cat: 'MONITOR', status: 'ALLOCATED', val: 150, bookable: false, dept: 'IT' },

    // 3 Under Maintenance
    { tag: 'AF-000010', name: 'Office Projector', cat: 'MONITOR', status: 'UNDER_MAINTENANCE', val: 800, bookable: true, dept: 'Operations' },
    { tag: 'AF-000011', name: 'HR Recruiting Laptop', cat: 'LAPTOP', status: 'UNDER_MAINTENANCE', val: 1400, bookable: false, dept: 'HR' },
    { tag: 'AF-000012', name: 'Developer Desktop', cat: 'LAPTOP', status: 'UNDER_MAINTENANCE', val: 3000, bookable: false, dept: 'IT' },

    // 2 Retired, 1 Lost
    { tag: 'AF-000013', name: 'Legacy Server Rack', cat: 'LAPTOP', status: 'RETIRED', val: 5000, bookable: false, dept: 'IT' },
    { tag: 'AF-000014', name: 'Broken Desk Chair', cat: 'MONITOR', status: 'RETIRED', val: 100, bookable: false, dept: 'HR' },
    { tag: 'AF-000015', name: 'Missing iPhone SE', cat: 'LAPTOP', status: 'LOST', val: 400, bookable: false, dept: 'IT' },
  ];

  const assets: any[] = [];
  const now = new Date();

  for (const a of assetsInfo) {
    const asset = await prisma.asset.create({
      data: {
        assetTag: a.tag,
        name: a.name,
        categoryId: catsMap[a.cat].id,
        status: a.status,
        value: a.val,
        serialNumber: `SN-${a.tag}`,
        condition: 'GOOD',
        purchaseDate: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
        purchaseCost: a.val,
        bookable: a.bookable,
        location: 'Main Head Office',
        departmentId: deptsMap[a.dept].id,
        qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${a.tag}`,
      },
    });
    assets.push(asset);
  }

  console.log('Seeding allocations...');
  const alexUser = users.find(u => u.email === 'employee@assetflow.com');
  const priyaUser = users.find(u => u.email === 'priya@assetflow.com');
  const davidUser = users.find(u => u.email === 'employee3@assetflow.com');

  const allocData = [
    { assetTag: 'AF-000006', user: alexUser },
    { assetTag: 'AF-000007', user: priyaUser },
    { assetTag: 'AF-000008', user: davidUser },
    { assetTag: 'AF-000009', user: alexUser },
  ];

  for (const alloc of allocData) {
    const asset = assets.find(a => a.assetTag === alloc.assetTag);
    if (asset && alloc.user) {
      await prisma.allocation.create({
        data: {
          assetId: asset.id,
          userId: alloc.user.id,
          allocatedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
          status: 'ACTIVE',
          conditionAtAllocation: 'GOOD',
          notes: 'Standard development asset allocation',
        },
      });
    }
  }

  console.log('Seeding 5 bookings...');
  const tesla = assets.find(a => a.assetTag === 'AF-000003');
  const confRoom = assets.find(a => a.assetTag === 'AF-000004');

  const bookingsList = [
    { asset: tesla, user: alexUser, status: 'ACTIVE', startOffset: 0, hours: 2 },
    { asset: confRoom, user: priyaUser, status: 'ACTIVE', startOffset: 1, hours: 1 },
    { asset: confRoom, user: alexUser, status: 'COMPLETED', startOffset: -2, hours: 2 },
    { asset: tesla, user: davidUser, status: 'CANCELLED', startOffset: -3, hours: 3 },
    { asset: confRoom, user: davidUser, status: 'COMPLETED', startOffset: -4, hours: 1 },
  ];

  for (const b of bookingsList) {
    if (b.asset && b.user) {
      const start = new Date(now.getTime() + b.startOffset * 24 * 60 * 60 * 1000);
      const end = new Date(start.getTime() + b.hours * 60 * 60 * 1000);
      await prisma.booking.create({
        data: {
          assetId: b.asset.id,
          userId: b.user.id,
          startTime: start,
          endTime: end,
          status: b.status,
          purpose: 'Weekly sync meeting session',
        },
      });
    }
  }

  console.log('Seeding 4 maintenance requests...');
  const maintList = [
    { tag: 'AF-000010', status: 'PENDING', tech: null, cost: 0 },
    { tag: 'AF-000011', status: 'IN_PROGRESS', tech: 'Marcus Lee', cost: 0 },
    { tag: 'AF-000012', status: 'RESOLVED', tech: 'Marcus Lee', cost: 150 },
    { tag: 'AF-000001', status: 'RESOLVED', tech: 'Sarah Connor', cost: 50 },
  ];

  for (const m of maintList) {
    const asset = assets.find(a => a.assetTag === m.tag);
    if (asset) {
      await prisma.maintenance.create({
        data: {
          assetId: asset.id,
          description: 'Diagnostics, repair, and parts verification.',
          priority: 'MEDIUM',
          status: m.status,
          assignedTechnician: m.tech,
          cost: m.cost,
          createdAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
          resolvedAt: m.status === 'RESOLVED' ? new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000) : null,
        },
      });
    }
  }

  console.log('Seeding 4 transfers...');
  const transList = [
    { tag: 'AF-000001', status: 'PENDING', from: 'IT', to: 'Operations', user: alexUser },
    { tag: 'AF-000002', status: 'APPROVED', from: 'IT', to: 'HR', user: alexUser },
    { tag: 'AF-000005', status: 'APPROVED', from: 'Operations', to: 'IT', user: davidUser },
    { tag: 'AF-000008', status: 'APPROVED', from: 'HR', to: 'Operations', user: priyaUser },
  ];

  for (const t of transList) {
    const asset = assets.find(a => a.assetTag === t.tag);
    if (asset && t.user) {
      await prisma.transfer.create({
        data: {
          assetId: asset.id,
          fromDepartmentId: deptsMap[t.from].id,
          toDepartmentId: deptsMap[t.to].id,
          status: t.status,
          requestedById: t.user.id,
          reason: 'Inter-department workload sharing request',
          requestedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
          approvedAt: t.status === 'APPROVED' ? new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000) : null,
        },
      });
    }
  }

  console.log('Seeding audits...');
  // Closed Audit
  const closedAudit = await prisma.auditCycle.create({
    data: {
      title: 'Q2 Asset Reconcile',
      departmentId: deptsMap['IT'].id,
      location: 'HQ Floor 1',
      startDate: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
      endDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
      assignedAuditors: 'admin@assetflow.com',
      status: 'CLOSED',
      closedAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
    },
  });

  const itAsset1 = assets.find(a => a.assetTag === 'AF-000001');
  if (itAsset1) {
    await prisma.auditRecord.create({
      data: {
        auditCycleId: closedAudit.id,
        assetId: itAsset1.id,
        expectedLocation: 'HQ Room 101',
        actualLocation: 'HQ Room 101',
        verificationStatus: 'VERIFIED',
        verifiedBy: 'admin@assetflow.com',
        verifiedAt: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000),
      },
    });
  }

  // Active Audit
  const activeAudit = await prisma.auditCycle.create({
    data: {
      title: 'Q3 Central Review',
      departmentId: deptsMap['HR'].id,
      location: 'HQ Floor 2',
      startDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      endDate: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000),
      assignedAuditors: 'admin@assetflow.com',
      status: 'ACTIVE',
    },
  });

  const hrAsset1 = assets.find(a => a.assetTag === 'AF-000007');
  if (hrAsset1) {
    await prisma.auditRecord.create({
      data: {
        auditCycleId: activeAudit.id,
        assetId: hrAsset1.id,
        expectedLocation: 'HQ Floor 2 Desk 5',
        verificationStatus: 'PENDING',
      },
    });
  }

  console.log('Seeding 10 notifications...');
  const notifTypes = ['OVERDUE_RETURN', 'TRANSFER_REQUEST', 'BOOKING', 'GENERAL'];
  for (let i = 1; i <= 10; i++) {
    const type = notifTypes[i % notifTypes.length];
    await prisma.notification.create({
      data: {
        userId: alexUser!.id,
        message: `Alert context message #${i}: System configuration checks for type ${type}.`,
        type,
        isRead: false,
        createdAt: new Date(now.getTime() - i * 4 * 60 * 60 * 1000),
      },
    });
  }

  console.log('Seeding 15 activity logs...');
  const logsInfo = [
    'User sarah logged in.',
    'Allocated MacBook Pro 16 to Alex Johnson.',
    'Priya Laptop checking checkout limits.',
    'Tesla Model 3 booking requested by Alex Johnson.',
    'Main Conference Room booking approved.',
    'Repair ticket created for Office Projector.',
    'Transfer request initialized for MacBook Air.',
    'Audit Cycle Q2 started.',
    'Verification checklist updated by Sarah Connor.',
    'Audit campaign closed successfully.',
    'Discrepancies reports generated.',
    'Department allocation details adjusted.',
    'User alex logged in.',
    'Technician Marcus Lee assigned to laptop repair.',
    'Maintenance resolved for Developer Desktop.',
  ];

  for (let i = 0; i < logsInfo.length; i++) {
    await prisma.activityLog.create({
      data: {
        type: 'ASSET_CREATED',
        message: logsInfo[i],
        userId: alexUser!.id,
        createdAt: new Date(now.getTime() - i * 2 * 60 * 60 * 1000),
      },
    });
  }

  console.log('Database seeded successfully with minimalistic, focused records!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
