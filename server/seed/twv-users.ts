import { storage } from "../storage";

// Deze functie voegt testgebruikers toe met verschillende TWV statussen
export async function seedTWVUsers() {
  // Eerst controleren of er al gebruikers zijn met TWV-gerelateerde statussen
  const existingUsers = await storage.getUsers();
  const twvUsers = existingUsers.filter(user => user.needsTwv);
  
  if (twvUsers.length > 0) {
    console.log(`Er zijn al ${twvUsers.length} gebruikers met TWV gegevens.`);
    return; // Niet opnieuw seeden als er al TWV gebruikers zijn
  }
  
  // Anders nieuwe testgebruikers toevoegen
  const users = [
    // TWV Required status
    {
      email: "ahmed.yilmaz@extra.nl",
      password: "password123",
      firstName: "Ahmed",
      lastName: "Yilmaz",
      birthDate: new Date("1995-03-15"),
      role: "employee",
      status: "active",
      points: 250,
      needsTwv: true,
      twvStatus: "required",
      apiId: "EXT001",
      twvRequestDate: null,
      twvNotes: "Nieuwe medewerker, TWV moet nog worden aangevraagd"
    },
    {
      email: "maria.silva@extra.nl",
      password: "password123",
      firstName: "Maria",
      lastName: "Silva",
      birthDate: new Date("1991-08-22"),
      role: "employee",
      status: "active",
      points: 500,
      needsTwv: true,
      twvStatus: "required",
      apiId: "EXT002",
      twvRequestDate: null,
      twvNotes: "Werkt al 3 maanden zonder geldige TWV, prioriteit!"
    },
    
    // TWV Pending status
    {
      email: "viktor.popov@extra.nl",
      password: "password123",
      firstName: "Viktor",
      lastName: "Popov",
      birthDate: new Date("1988-11-05"),
      role: "employee",
      status: "active",
      points: 750,
      needsTwv: true,
      twvStatus: "pending",
      apiId: "EXT003",
      twvRequestDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 dagen geleden
      twvNotes: "Aanvraag ingediend, wachtend op goedkeuring"
    },
    {
      email: "anita.cheng@extra.nl",
      password: "password123",
      firstName: "Anita",
      lastName: "Cheng",
      birthDate: new Date("1996-05-18"),
      role: "employee",
      status: "active",
      points: 175,
      needsTwv: true,
      twvStatus: "pending",
      apiId: "EXT004",
      twvRequestDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 dagen geleden
      twvNotes: "Aanvullende documenten opgevraagd door IND"
    },
    
    // TWV Approved status
    {
      email: "diego.martinez@extra.nl",
      password: "password123",
      firstName: "Diego",
      lastName: "Martinez",
      birthDate: new Date("1990-02-10"),
      role: "employee",
      status: "active",
      points: 1200,
      needsTwv: true,
      twvStatus: "approved",
      apiId: "EXT005",
      twvRequestDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), // 45 dagen geleden
      twvApprovalDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 dagen geleden
      twvExpiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 jaar vanaf nu
      twvNotes: "TWV geldig voor 1 jaar"
    },
    {
      email: "olga.petrov@extra.nl",
      password: "password123",
      firstName: "Olga",
      lastName: "Petrov",
      birthDate: new Date("1993-09-30"),
      role: "employee",
      status: "active",
      points: 900,
      needsTwv: true,
      twvStatus: "approved",
      apiId: "EXT006",
      twvRequestDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 dagen geleden
      twvApprovalDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // 20 dagen geleden
      twvExpiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 6 maanden vanaf nu
      twvNotes: "TWV geldig voor 6 maanden, arbeidsbeperking: alleen horeca"
    },
    
    // TWV Rejected status
    {
      email: "phuong.nguyen@extra.nl",
      password: "password123",
      firstName: "Phuong",
      lastName: "Nguyen",
      birthDate: new Date("1994-12-12"),
      role: "employee",
      status: "inactive",
      points: 50,
      needsTwv: true,
      twvStatus: "rejected",
      apiId: "EXT007", 
      twvRequestDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 dagen geleden
      twvApprovalDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 dagen geleden
      twvNotes: "Aanvraag afgewezen, ontbrekende documentatie. Nieuwe aanvraag in voorbereiding."
    },
    {
      email: "gabriel.santos@extra.nl",
      password: "password123",
      firstName: "Gabriel",
      lastName: "Santos",
      birthDate: new Date("1997-06-23"),
      role: "employee",
      status: "inactive",
      points: 25,
      needsTwv: true,
      twvStatus: "rejected",
      apiId: "EXT008",
      twvRequestDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 dagen geleden
      twvApprovalDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 dagen geleden
      twvNotes: "Aanvraag definitief afgewezen, kan niet in dienst blijven"
    }
  ];

  // Gebruikers toevoegen aan de database
  for (const userData of users) {
    await storage.createUser(userData);
  }

  console.log(`${users.length} TWV testgebruikers succesvol toegevoegd.`);
}