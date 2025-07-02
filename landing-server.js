
const express = require('express');
const path = require('path');
const app = express();

// Serve static files (CSS, JS, images)
app.use(express.static(path.join(__dirname, 'client/src/pages')));

// Serve de landingspagina op root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/src/pages/HotelLanding.html'));
});

// Catch-all route voor andere paden - redirect naar landingspagina
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/src/pages/HotelLanding.html'));
});

const PORT = 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Landing pagina draait op poort ${PORT}`);
  console.log(`📱 Bekijk op: http://localhost:${PORT}`);
});
