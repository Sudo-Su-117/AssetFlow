import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import dashboardRouter from './modules/dashboard/dashboard.routes';
import departmentRouter from './modules/organization/department/department.routes';
import categoryRouter from './modules/organization/category/category.routes';
import employeeRouter from './modules/organization/employee/employee.routes';
import assetRouter from './modules/assets/asset.routes';
import allocationRouter from './modules/allocation/allocation.routes';
import bookingRouter from './modules/booking/booking.routes';
import maintenanceRouter from './modules/maintenance/maintenance.routes';
import auditRouter from './modules/audit/audit.routes';
import reportsRouter from './modules/reports/reports.routes';
import notificationRouter from './modules/notifications/notifications.routes';
import authRouter from './modules/auth/auth.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend requests
app.use(cors({
  origin: '*', // Adjust this to specific origins in production
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Register API Routes
app.use('/api/dashboard', dashboardRouter);
app.use('/api/departments', departmentRouter);
app.use('/api/categories', categoryRouter);
app.use('/api/employees', employeeRouter);
app.use('/api/assets', assetRouter);
app.use('/api', allocationRouter);
app.use('/api', bookingRouter);
app.use('/api', maintenanceRouter);
app.use('/api', auditRouter);
app.use('/api', reportsRouter);
app.use('/api', notificationRouter);
app.use('/api', authRouter);

// Fallback for unmatched routes
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`AssetFlow backend is running on http://localhost:${PORT}`);
});

export default app;
