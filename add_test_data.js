import fetch from 'node-fetch';

async function addTestData() {
  try {
    // Login als admin
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@extra.nl',
        password: 'password123'
      })
    });

    if (!loginResponse.ok) {
      throw new Error('Login failed');
    }

    const cookies = loginResponse.headers.get('set-cookie');
    console.log('Admin ingelogd');

    // Voeg punten toe aan verschillende gebruikers
    const users = [
      { userId: 2, points: 850, name: 'Medewerker 1' },
      { userId: 1, points: 750, name: 'Admin (voor test)' }
    ];

    for (const user of users) {
      console.log(`Punten toekennen aan ${user.name}...`);
      
      const response = await fetch('http://localhost:5000/api/admin/award-points', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': cookies
        },
        body: JSON.stringify({
          userId: user.userId,
          points: user.points,
          description: 'Test punten voor ranglijst demo'
        })
      });

      if (response.ok) {
        console.log(`✓ ${user.points} punten toegekend aan ${user.name}`);
      } else {
        console.log(`✗ Fout bij toekennen punten aan ${user.name}: ${response.status}`);
      }
    }

    console.log('Test data toegevoegd!');
    
  } catch (error) {
    console.error('Fout:', error);
  }
}

addTestData();