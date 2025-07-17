# TWV Management System

Een complete webapplicatie voor het beheer van Tewerkstellingsvergunningen (TWV) voor uitzendbureaus en HR-afdelingen.

## Overzicht

Dit systeem is speciaal ontworpen voor Nederlandse uitzendbureaus om het proces van TWV aanvragen en beheer te stroomlijnen. Het biedt een complete oplossing voor:

- **Medewerker beheer**: Registratie en beheer van alle medewerkers
- **TWV aanvragen**: Volledige workflow van aanvraag tot goedkeuring
- **Status tracking**: Real-time updates van alle TWV statussen
- **Rapportages**: Uitgebreide statistieken en rapporten
- **Audit logging**: Volledige geschiedenis van alle acties

## Technische Stack

### Backend
- **Node.js** met **Express.js** framework
- **TypeScript** voor type-safe development
- **PostgreSQL** database met **Drizzle ORM**
- **Express-session** voor authenticatie
- **bcryptjs** voor password hashing

### Frontend
- **React 18** met **TypeScript**
- **Vite** voor snelle development
- **Tailwind CSS** met **shadcn/ui** componenten
- **TanStack Query** voor state management
- **Wouter** voor routing

### Database Schema
Het systeem gebruikt een uitgebreide database schema met:
- **Users**: Admin en HR gebruikers
- **Employees**: Werknemers die een TWV nodig hebben
- **TWV Applications**: Aanvragen met volledige workflow
- **Departments**: Organisatie afdelingen
- **Documents**: Bestandsbeheer voor TWV documenten
- **Audit Log**: Volledige audittrail
- **Reminders**: Automatische herinneringen

## Installatie

### Vereisten
- Node.js 18+ 
- PostgreSQL database
- NPM of Yarn

### Setup
```bash
# Installeer dependencies
npm install

# Setup database
cp .env.example .env
# Voeg DATABASE_URL toe aan .env

# Push database schema
npm run db:push

# Start development server
npm run dev
```

### Environment Variables
```
DATABASE_URL=postgresql://user:password@localhost:5432/twv_system
SESSION_SECRET=your-secret-key-here
NODE_ENV=development
```

## Features

### 🔐 Authenticatie & Autorisatie
- Rol-gebaseerde toegang (Admin, HR, Viewer)
- Veilige sessie management
- Password hashing met bcrypt

### 👥 Medewerker Beheer
- Volledige medewerker profielen
- EU/Non-EU nationaliteit tracking
- Contract en functie informatie
- Status management (Actief/Inactief)

### 📋 TWV Workflow
- **Statussen**: Required → Pending → Approved/Rejected
- **Types**: General, Specific, Seasonal
- **Automatische datums**: Aanvraag, indiening, goedkeuring
- **UWV integratie**: Referentienummers en officiële nummers

### 📊 Dashboard & Rapportages
- Real-time statistieken
- Status overzichten
- Nationaliteit verdeling
- Recente activiteiten
- Exporteerbare rapporten

### 🔍 Audit & Compliance
- Volledige audittrail van alle acties
- Historische data tracking
- Compliance rapportages
- Document management

## API Endpoints

### Authenticatie
- `POST /api/auth/login` - Inloggen
- `GET /api/auth/me` - Huidige gebruiker
- `POST /api/auth/logout` - Uitloggen

### Medewerkers
- `GET /api/employees` - Alle medewerkers
- `POST /api/employees` - Nieuwe medewerker
- `PUT /api/employees/:id` - Update medewerker

### TWV Aanvragen
- `GET /api/twv-applications` - Alle aanvragen
- `POST /api/twv-applications` - Nieuwe aanvraag
- `PUT /api/twv-applications/:id` - Update status

### Dashboard
- `GET /api/dashboard/stats` - Dashboard statistieken
- `GET /api/reports/twv-summary` - TWV rapporten

## Database Schema Details

### TWV Statussen
- **none**: Geen TWV nodig
- **required**: TWV vereist
- **pending**: In behandeling bij UWV
- **approved**: Goedgekeurd
- **rejected**: Afgekeurd
- **expired**: Verlopen

### TWV Types
- **general**: Algemene tewerkstellingsvergunning
- **specific**: Specifieke tewerkstellingsvergunning
- **seasonal**: Seizoensgebonden tewerkstellingsvergunning

### Gebruiker Rollen
- **admin**: Volledige toegang tot alle functies
- **hr**: HR functies en TWV beheer
- **viewer**: Alleen-lezen toegang

## Development

### Database Migrations
```bash
# Push schema changes
npm run db:push

# Open database studio
npm run db:studio
```

### Building
```bash
# Build voor productie
npm run build

# Start productie server
npm start
```

## Deployment

Het systeem is geconfigureerd voor deployment op platforms zoals:
- **Replit** (aanbevolen voor snelle prototype)
- **Vercel** met externe PostgreSQL
- **Railway** met ingebouwde PostgreSQL
- **DigitalOcean App Platform**

### Productie Checklist
- [ ] DATABASE_URL geconfigureerd
- [ ] SESSION_SECRET ingesteld (32+ karakters)
- [ ] NODE_ENV=production
- [ ] Database schema gepusht
- [ ] SSL certificaten geconfigureerd

## Roadmap

### Geplande Features
- [ ] Document upload en beheer
- [ ] Email notificaties voor status wijzigingen
- [ ] Automatische herinnering systeem
- [ ] Export naar Excel/PDF
- [ ] API integratie met externe planningsystemen
- [ ] Multi-tenant ondersteuning
- [ ] Advanced reporting dashboard

### Integraties
- [ ] UWV API koppeling (indien beschikbaar)
- [ ] SendGrid voor email notificaties
- [ ] File storage (AWS S3, CloudFlare R2)
- [ ] Calendar integraties (Outlook, Google)

## Support

Voor vragen of support:
1. Check de documentatie in `/docs`
2. Bekijk de API endpoints in Postman collection
3. Raadpleeg de database schema documentatie

## Licentie

Dit is een proprietary systeem ontwikkeld voor Nederlandse uitzendbureaus.
Neem contact op voor licentie informatie.

---

**TWV Management System v1.0**  
*Gebouwd met ❤️ voor Nederlandse HR teams*