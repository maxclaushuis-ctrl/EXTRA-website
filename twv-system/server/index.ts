import express from "express";
import session from "express-session";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import fs from "fs";
import routes from "./routes.js";
import { seedDatabase } from "./seed.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware setup
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'twv-system-secret-key-development',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// API routes
app.use('/api', routes);

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  const distPath = join(__dirname, '../dist');
  app.use(express.static(distPath));
  
  app.get('*', (req, res) => {
    res.sendFile(join(distPath, 'index.html'));
  });
} else {
  // Development mode - serve a simple message
  app.get('/', (req, res) => {
    res.json({ 
      message: 'TWV Management System API Server',
      status: 'running',
      environment: 'development'
    });
  });
}

app.listen(PORT, '0.0.0.0', async () => {
  console.log(`TWV Management System server gestart op http://0.0.0.0:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Seed database in development
  if (process.env.NODE_ENV === 'development') {
    console.log('Seeding database with demo data...');
    await seedDatabase();
  }
});