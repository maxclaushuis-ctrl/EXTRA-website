async function addExtraUser() {
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

    const cookies = loginResponse.headers.get('set-cookie');

    // Maak een nieuwe gebruiker
    const createUserResponse = await fetch('http://localhost:5000/api/admin/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies
      },
      body: JSON.stringify({
        email: 'jan.buitenlands@extra.nl',
        firstName: 'Jan',
        lastName: 'Buitenlands',
        password: 'password123',
        role: 'employee',
        birthDate: '1990-06-15'
      })
    });

    if (createUserResponse.ok) {
      const userData = await createUserResponse.json();
      console.log('Nieuwe gebruiker aangemaakt:', userData.user.id);

      // Ken punten toe aan de nieuwe gebruiker
      const awardResponse = await fetch('http://localhost:5000/api/admin/award-points', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': cookies
        },
        body: JSON.stringify({
          userId: userData.user.id,
          points: 600,
          description: 'Test punten voor Jan Buitenlands'
        })
      });

      if (awardResponse.ok) {
        console.log('✓ 600 punten toegekend aan Jan Buitenlands');
      }
    } else {
      console.log('Fout bij aanmaken gebruiker:', createUserResponse.status);
    }

  } catch (error) {
    console.error('Fout:', error);
  }
}

addExtraUser();