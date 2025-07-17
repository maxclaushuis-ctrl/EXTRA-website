import { Router, Request, Response } from 'express';
import { db } from './db.js';
import { users, employees, twvApplications, departments, twvAuditLog } from '../shared/schema.js';
import { eq, desc, count, and, gte, lte, sql } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

const router = Router();

// Middleware voor authenticatie
const requireAuth = (req: Request, res: Response, next: any) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: 'Niet ingelogd' });
  }
  next();
};

// Middleware voor admin/HR rol
const requireAdminOrHR = (req: Request, res: Response, next: any) => {
  if (!req.session.userId || !req.session.userRole || !['admin', 'hr'].includes(req.session.userRole)) {
    return res.status(403).json({ message: 'Onvoldoende rechten' });
  }
  next();
};

// === AUTHENTICATION ROUTES ===

// Login
router.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    const user = await db.select().from(users).where(eq(users.email, email)).limit(1);
    
    if (user.length === 0) {
      return res.status(401).json({ message: 'Ongeldige inloggegevens' });
    }
    
    const isValidPassword = await bcrypt.compare(password, user[0].password);
    
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Ongeldige inloggegevens' });
    }
    
    // Update last login
    await db.update(users)
      .set({ lastLogin: new Date() })
      .where(eq(users.id, user[0].id));
    
    req.session.userId = user[0].id;
    req.session.userRole = user[0].role;
    
    const { password: _, ...userWithoutPassword } = user[0];
    
    res.json({
      message: 'Login succesvol',
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current user
router.get('/auth/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = await db.select().from(users).where(eq(users.id, req.session.userId!)).limit(1);
    
    if (user.length === 0) {
      return res.status(404).json({ message: 'Gebruiker niet gevonden' });
    }
    
    const { password: _, ...userWithoutPassword } = user[0];
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Auth check error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Logout
router.post('/auth/logout', (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: 'Logout failed' });
    }
    res.json({ message: 'Logout succesvol' });
  });
});

// === DASHBOARD & STATISTICS ===

// Dashboard statistics
router.get('/dashboard/stats', requireAuth, async (req: Request, res: Response) => {
  try {
    const totalEmployees = await db.select({ count: count() }).from(employees);
    const totalApplications = await db.select({ count: count() }).from(twvApplications);
    const pendingApplications = await db.select({ count: count() })
      .from(twvApplications)
      .where(eq(twvApplications.status, 'pending'));
    const approvedApplications = await db.select({ count: count() })
      .from(twvApplications)
      .where(eq(twvApplications.status, 'approved'));
    const rejectedApplications = await db.select({ count: count() })
      .from(twvApplications)
      .where(eq(twvApplications.status, 'rejected'));
    
    // Recent activities
    const recentActivities = await db.select({
      id: twvAuditLog.id,
      action: twvAuditLog.action,
      timestamp: twvAuditLog.timestamp,
      notes: twvAuditLog.notes,
      employeeName: sql<string>`CONCAT(${employees.firstName}, ' ', ${employees.lastName})`,
      userName: sql<string>`CONCAT(${users.firstName}, ' ', ${users.lastName})`
    })
    .from(twvAuditLog)
    .leftJoin(employees, eq(twvAuditLog.employeeId, employees.id))
    .leftJoin(users, eq(twvAuditLog.userId, users.id))
    .orderBy(desc(twvAuditLog.timestamp))
    .limit(10);
    
    res.json({
      totalEmployees: totalEmployees[0].count,
      totalApplications: totalApplications[0].count,
      pendingApplications: pendingApplications[0].count,
      approvedApplications: approvedApplications[0].count,
      rejectedApplications: rejectedApplications[0].count,
      recentActivities
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// === EMPLOYEE ROUTES ===

// Get all employees
router.get('/employees', requireAuth, async (req: Request, res: Response) => {
  try {
    const allEmployees = await db.select({
      id: employees.id,
      firstName: employees.firstName,
      lastName: employees.lastName,
      email: employees.email,
      nationality: employees.nationality,
      employmentStartDate: employees.employmentStartDate,
      positionTitle: employees.positionTitle,
      status: employees.status,
      createdAt: employees.createdAt
    }).from(employees).orderBy(desc(employees.createdAt));
    
    res.json(allEmployees);
  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create employee
router.post('/employees', requireAdminOrHR, async (req: Request, res: Response) => {
  try {
    const newEmployee = await db.insert(employees).values(req.body).returning();
    
    // Log the action
    await db.insert(twvAuditLog).values({
      employeeId: newEmployee[0].id,
      userId: req.session.userId!,
      action: 'employee_created',
      newValue: req.body,
      notes: `Nieuwe medewerker aangemaakt: ${req.body.firstName} ${req.body.lastName}`
    });
    
    res.status(201).json(newEmployee[0]);
  } catch (error) {
    console.error('Create employee error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update employee
router.put('/employees/:id', requireAdminOrHR, async (req: Request, res: Response) => {
  try {
    const employeeId = parseInt(req.params.id);
    
    // Get original employee data for audit log
    const originalEmployee = await db.select().from(employees).where(eq(employees.id, employeeId)).limit(1);
    
    const updatedEmployee = await db.update(employees)
      .set({ ...req.body, updatedAt: new Date() })
      .where(eq(employees.id, employeeId))
      .returning();
    
    if (updatedEmployee.length === 0) {
      return res.status(404).json({ message: 'Medewerker niet gevonden' });
    }
    
    // Log the action
    await db.insert(twvAuditLog).values({
      employeeId: employeeId,
      userId: req.session.userId!,
      action: 'employee_updated',
      previousValue: originalEmployee[0],
      newValue: req.body,
      notes: `Medewerker gegevens bijgewerkt`
    });
    
    res.json(updatedEmployee[0]);
  } catch (error) {
    console.error('Update employee error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// === TWV APPLICATION ROUTES ===

// Get all TWV applications
router.get('/twv-applications', requireAuth, async (req: Request, res: Response) => {
  try {
    const { status, employee_id } = req.query;
    
    let query = db.select({
      id: twvApplications.id,
      employeeId: twvApplications.employeeId,
      twvType: twvApplications.twvType,
      status: twvApplications.status,
      applicationDate: twvApplications.applicationDate,
      submissionDate: twvApplications.submissionDate,
      responseDate: twvApplications.responseDate,
      expiryDate: twvApplications.expiryDate,
      twvNumber: twvApplications.twvNumber,
      uwvReference: twvApplications.uwvReference,
      rejectionReason: twvApplications.rejectionReason,
      createdAt: twvApplications.createdAt,
      employeeName: sql<string>`CONCAT(${employees.firstName}, ' ', ${employees.lastName})`,
      employeeEmail: employees.email,
      employeeNationality: employees.nationality
    })
    .from(twvApplications)
    .leftJoin(employees, eq(twvApplications.employeeId, employees.id))
    .orderBy(desc(twvApplications.createdAt));
    
    if (status) {
      query = query.where(eq(twvApplications.status, status as any));
    }
    
    if (employee_id) {
      query = query.where(eq(twvApplications.employeeId, parseInt(employee_id as string)));
    }
    
    const applications = await query;
    res.json(applications);
  } catch (error) {
    console.error('Get TWV applications error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create TWV application
router.post('/twv-applications', requireAdminOrHR, async (req: Request, res: Response) => {
  try {
    const applicationData = {
      ...req.body,
      createdBy: req.session.userId,
      applicationDate: new Date()
    };
    
    const newApplication = await db.insert(twvApplications).values(applicationData).returning();
    
    // Log the action
    await db.insert(twvAuditLog).values({
      applicationId: newApplication[0].id,
      employeeId: newApplication[0].employeeId,
      userId: req.session.userId!,
      action: 'application_created',
      newValue: applicationData,
      notes: `TWV aanvraag aangemaakt`
    });
    
    res.status(201).json(newApplication[0]);
  } catch (error) {
    console.error('Create TWV application error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update TWV application status
router.put('/twv-applications/:id', requireAdminOrHR, async (req: Request, res: Response) => {
  try {
    const applicationId = parseInt(req.params.id);
    
    // Get original application data
    const originalApplication = await db.select().from(twvApplications).where(eq(twvApplications.id, applicationId)).limit(1);
    
    if (originalApplication.length === 0) {
      return res.status(404).json({ message: 'TWV aanvraag niet gevonden' });
    }
    
    const updateData = {
      ...req.body,
      updatedBy: req.session.userId,
      updatedAt: new Date()
    };
    
    // Set specific dates based on status changes
    if (req.body.status === 'pending' && !originalApplication[0].submissionDate) {
      updateData.submissionDate = new Date();
    }
    
    if (req.body.status === 'approved' && !originalApplication[0].approvalDate) {
      updateData.approvalDate = new Date();
      updateData.responseDate = new Date();
    }
    
    if (req.body.status === 'rejected' && !originalApplication[0].rejectionDate) {
      updateData.rejectionDate = new Date();
      updateData.responseDate = new Date();
    }
    
    const updatedApplication = await db.update(twvApplications)
      .set(updateData)
      .where(eq(twvApplications.id, applicationId))
      .returning();
    
    // Log the action
    await db.insert(twvAuditLog).values({
      applicationId: applicationId,
      employeeId: originalApplication[0].employeeId,
      userId: req.session.userId!,
      action: 'application_updated',
      previousValue: originalApplication[0],
      newValue: updateData,
      notes: `TWV aanvraag status gewijzigd naar ${req.body.status}`
    });
    
    res.json(updatedApplication[0]);
  } catch (error) {
    console.error('Update TWV application error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// === DEPARTMENT ROUTES ===

// Get all departments
router.get('/departments', requireAuth, async (req: Request, res: Response) => {
  try {
    const allDepartments = await db.select().from(departments).orderBy(departments.name);
    res.json(allDepartments);
  } catch (error) {
    console.error('Get departments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create department
router.post('/departments', requireAdminOrHR, async (req: Request, res: Response) => {
  try {
    const newDepartment = await db.insert(departments).values(req.body).returning();
    res.status(201).json(newDepartment[0]);
  } catch (error) {
    console.error('Create department error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// === REPORTS ===

// Generate TWV report
router.get('/reports/twv-summary', requireAuth, async (req: Request, res: Response) => {
  try {
    const { start_date, end_date } = req.query;
    
    let baseQuery = db.select({
      status: twvApplications.status,
      count: count()
    }).from(twvApplications);
    
    if (start_date && end_date) {
      baseQuery = baseQuery.where(
        and(
          gte(twvApplications.createdAt, new Date(start_date as string)),
          lte(twvApplications.createdAt, new Date(end_date as string))
        )
      );
    }
    
    const statusCounts = await baseQuery.groupBy(twvApplications.status);
    
    // Get nationality breakdown
    const nationalityBreakdown = await db.select({
      nationality: employees.nationality,
      count: count()
    })
    .from(twvApplications)
    .leftJoin(employees, eq(twvApplications.employeeId, employees.id))
    .groupBy(employees.nationality);
    
    res.json({
      statusCounts,
      nationalityBreakdown
    });
  } catch (error) {
    console.error('Generate report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;