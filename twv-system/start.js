// Simple Node.js server to serve the TWV system
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

// Serve static files if they exist
app.use(express.static(join(__dirname, 'dist')));

// Simple API endpoint for health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'TWV Management System',
    timestamp: new Date().toISOString() 
  });
});

// Serve the frontend for all other routes
app.get('*', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="nl">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>TWV Management System</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          max-width: 800px; 
          margin: 50px auto; 
          padding: 20px;
          background: #f5f5f5;
        }
        .container { 
          background: white; 
          padding: 40px; 
          border-radius: 8px; 
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .icon { 
          width: 64px; 
          height: 64px; 
          background: #3b82f6; 
          border-radius: 8px; 
          margin: 0 auto 20px; 
          display: flex; 
          align-items: center; 
          justify-content: center;
          color: white;
          font-size: 24px;
        }
        h1 { color: #1f2937; margin-bottom: 10px; }
        .subtitle { color: #6b7280; margin-bottom: 30px; }
        .status { 
          padding: 10px 20px; 
          background: #10b981; 
          color: white; 
          border-radius: 4px; 
          display: inline-block;
          margin: 20px 0;
        }
        .info { 
          background: #f3f4f6; 
          padding: 20px; 
          border-radius: 6px; 
          margin: 20px 0;
        }
        .accounts { 
          background: #eff6ff; 
          border: 1px solid #dbeafe;
          padding: 15px; 
          border-radius: 6px; 
          margin: 20px 0;
        }
        .account { 
          font-family: monospace; 
          background: white; 
          padding: 8px; 
          margin: 5px 0; 
          border-radius: 4px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon">📋</div>
        <h1>TWV Management System</h1>
        <p class="subtitle">Tewerkstellingsvergunning Beheersysteem</p>
        
        <div class="status">✅ Systeem is actief</div>
        
        <div class="info">
          <h3>Over dit systeem</h3>
          <p>Dit is een volledig losstaand TWV management systeem voor het beheer van tewerkstellingsvergunningen. Het systeem is gescheiden van het EXTRAATJE rewards platform en heeft eigen functionaliteit voor:</p>
          <ul>
            <li>Medewerker registratie en beheer</li>
            <li>TWV aanvraag workflow</li>
            <li>Status tracking en rapportages</li>
            <li>Audit logging en compliance</li>
          </ul>
        </div>
        
        <div class="accounts">
          <h3>Demo Accounts</h3>
          <div class="account">Admin: admin@twv.nl / admin123</div>
          <div class="account">HR: hr@twv.nl / hr123</div>
        </div>
        
        <div class="info">
          <h3>Ontwikkeling Status</h3>
          <p>Het systeem is klaar voor verdere ontwikkeling via Upwork. De huidige implementatie bevat:</p>
          <ul>
            <li>✅ Database schema ontwerp</li>
            <li>✅ Authenticatie systeem</li>
            <li>✅ Basis dashboard</li>
            <li>🔄 Frontend interface (in ontwikkeling)</li>
            <li>🔄 TWV workflow implementatie</li>
            <li>🔄 Rapportage functionaliteit</li>
          </ul>
        </div>
        
        <p style="text-align: center; color: #6b7280; margin-top: 40px;">
          TWV Management System v1.0 - Ontwikkeld voor Nederlandse uitzendbureaus
        </p>
      </div>
    </body>
    </html>
  `);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`TWV Management System draait op http://0.0.0.0:${PORT}`);
  console.log('Systeem is toegankelijk via de Replit web interface');
});