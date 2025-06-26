# EXTRAATJE Test Environment - Start Instructies

## Hoe EXTRAATJE test environment te starten:

### Methode 1: Via Terminal
```bash
cd /home/runner/EXTRAATJE
npm run dev
```

### Methode 2: Nieuw Replit Project
1. Maak een nieuw Replit project aan
2. Upload alle bestanden uit `/home/runner/EXTRAATJE/`
3. Run `npm run dev`

## Verwachte output:
- Server start op poort 5001 (aangepast om conflicten te voorkomen)
- Challenges systeem geïnitialiseerd
- WebSocket server actief op /ws
- Mail service in mock-modus

## Test URL:
- Lokaal: `http://localhost:5001`
- Replit: Wordt automatisch toegewezen

## Test Accounts:
- **Medewerker**: medewerker@extra.nl / medewerker123  
- **Admin**: admin@extra.nl / admin123

## Wat te testen:
✅ Inloggen met test accounts
✅ Alle 4 tabbladen: Beloningen, Deals, Ranglijst, Challenges
✅ Challenges voortgang en punten systeem
✅ Leaderboard realtime updates
✅ Admin panel functionaliteit

Het systeem is identiek aan het hoofdsysteem maar draait onafhankelijk voor veilig testen.