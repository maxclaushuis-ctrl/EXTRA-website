# TWV Management System

## Overzicht

Dit is een volledig losstaand TWV (Tewerkstellingsvergunning) management systeem, speciaal ontwikkeld voor Nederlandse uitzendbureaus. Het systeem is volledig gescheiden van het EXTRAATJE rewards platform en heeft een eigen database, authenticatie en functionaliteit.

## Technische Architectuur

### Tech Stack
- **Frontend**: React 18 met TypeScript, Vite build system
- **UI Components**: Radix UI met shadcn/ui design system, Tailwind CSS
- **Backend**: Express.js met TypeScript
- **Database**: PostgreSQL met Drizzle ORM
- **Authenticatie**: Express-session met bcrypt password hashing
- **Development**: tsx voor TypeScript execution

### Project Structuur
- `client/` - React frontend applicatie met moderne UI
- `server/` - Express backend API met TypeScript
- `shared/` - Gedeelde schema's en types tussen client/server
- `docs/` - Documentatie en API specificaties

## Hoofdfunctionaliteiten

### 🔐 Authenticatie & Autorisatie
- **Rollen**: Admin, HR, Viewer
- **Veilige login**: bcrypt password hashing
- **Sessie management**: Express-session met PostgreSQL storage

### 👥 Medewerker Beheer
- **Volledige profielen**: Naam, email, nationaliteit, functie
- **EU/Non-EU tracking**: Automatische TWV detectie
- **Status management**: Actief/Inactief werknemers
- **Contract informatie**: Startdatum, functie, afdeling

### 📋 TWV Workflow Systeem
- **Statussen**: Required → Pending → Approved/Rejected → Expired
- **TWV Types**: General, Specific, Seasonal
- **Automatische tracking**: Aanvraag-, indiening-, goedkeuringsdatums
- **UWV integratie**: Referentienummers en officiële nummers
- **Document management**: Upload en tracking van TWV documenten

### 📊 Dashboard & Rapportages
- **Real-time statistieken**: Totaal aanvragen, goedkeuringen, afwijzingen
- **Status overzichten**: Visuele weergave van alle TWV statussen
- **Activiteiten feed**: Recente acties en wijzigingen
- **Exporteerbare rapporten**: Excel/PDF export functionaliteit

### 🔍 Audit & Compliance
- **Volledige audittrail**: Alle acties worden gelogd
- **Historische tracking**: Wie, wat, wanneer van elke wijziging
- **Compliance rapportages**: Voor UWV en inspectie doeleinden

## Database Schema

### Kernentiteiten
- **Users**: Admin/HR gebruikers met rol-gebaseerde toegang
- **Employees**: Werknemers met EU/Non-EU nationaliteit
- **TWV Applications**: Aanvragen met volledige workflow
- **Departments**: Organisatie afdelingen en structuur
- **TWV Documents**: Bestandsbeheer voor TWV documenten
- **TWV Reminders**: Automatische herinneringen voor deadlines
- **Audit Log**: Volledige geschiedenis van alle acties

### TWV Workflow
1. **Required**: Non-EU medewerker heeft TWV nodig
2. **Pending**: Aanvraag ingediend bij UWV
3. **Approved**: TWV goedgekeurd door UWV
4. **Rejected**: TWV afgekeurd door UWV
5. **Expired**: TWV verlopen en moet vernieuwd

## API Endpoints

### Authenticatie
- `POST /api/auth/login` - Veilige login met email/password
- `GET /api/auth/me` - Huidige gebruiker informatie
- `POST /api/auth/logout` - Uitloggen en sessie beëindigen

### Medewerkers
- `GET /api/employees` - Alle medewerkers ophalen
- `POST /api/employees` - Nieuwe medewerker aanmaken
- `PUT /api/employees/:id` - Medewerker gegevens bijwerken

### TWV Aanvragen
- `GET /api/twv-applications` - Alle TWV aanvragen
- `POST /api/twv-applications` - Nieuwe TWV aanvraag
- `PUT /api/twv-applications/:id` - TWV status bijwerken

### Dashboard & Rapportages
- `GET /api/dashboard/stats` - Dashboard statistieken
- `GET /api/reports/twv-summary` - TWV overzichtsrapporten

## Demo Accounts

Het systeem wordt geleverd met demo accounts voor directe testing:

- **Admin**: admin@twv.nl / admin123
- **HR Manager**: hr@twv.nl / hr123

## Development Setup

### Vereisten
- Node.js 18+
- PostgreSQL database
- Environment variables geconfigureerd

### Installatie
```bash
cd twv-system
npm install
npm run db:push
npm run dev
```

### Environment Variables
```
DATABASE_URL=postgresql://user:password@localhost:5432/twv_system
SESSION_SECRET=your-secret-key-here
NODE_ENV=development
```

## Deployment

Het systeem is geconfigureerd voor deployment op:
- **Replit** (aanbevolen voor prototyping)
- **Vercel** met externe PostgreSQL
- **Railway** met ingebouwde PostgreSQL
- **DigitalOcean App Platform**

## Roadmap

### Geplande Features (V2.0)
- [ ] Document upload systeem met file storage
- [ ] Email notificaties voor status wijzigingen
- [ ] Automatische deadline herinneringen
- [ ] Excel/PDF export functionaliteit
- [ ] API integratie met externe planningsystemen
- [ ] Multi-tenant ondersteuning voor meerdere bedrijven
- [ ] Advanced reporting dashboard met grafieken

### Mogelijke Integraties
- [ ] UWV API koppeling (indien beschikbaar)
- [ ] SendGrid voor email notificaties
- [ ] AWS S3 of CloudFlare R2 voor file storage
- [ ] Calendar integraties (Outlook, Google)

## Onderscheid met EXTRAATJE

Dit TWV systeem is **volledig losstaand** van het EXTRAATJE rewards platform:

| Aspect | TWV System | EXTRAATJE |
|--------|------------|-----------|
| **Doel** | TWV beheer | Employee rewards |
| **Database** | Eigen PostgreSQL | Eigen PostgreSQL |
| **Authenticatie** | Eigen users tabel | Eigen users tabel |
| **Port** | 3000 | 5000 |
| **Gebruikers** | Admin/HR/Viewer | Admin/Employee |
| **Functionaliteit** | Tewerkstellingsvergunningen | Punten & beloningen |

## Gebruiker Voorkeuren

- **Communicatie**: Nederlandse taal, eenvoudige uitleg
- **Interface**: Moderne, professionele UI geschikt voor HR teams
- **Workflow**: Intuïtief en volgend op bestaande HR processen

## Recente Wijzigingen

- **17 Juli 2025**: Volledig nieuw TWV Management System opgezet
  - Complete applicatie structuur gebouwd met React + Express
  - PostgreSQL database schema ontworpen voor TWV workflow
  - Authenticatie systeem met rol-gebaseerde toegang
  - Dashboard met real-time statistieken
  - Demo data seeding voor directe testing
  - Moderne UI met shadcn/ui componenten
  - Volledig gescheiden van EXTRAATJE systeem