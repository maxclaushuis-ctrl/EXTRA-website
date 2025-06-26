# EXTRA Rewards System - Restore Instructies

## Backup Locatie
Er is een volledige backup gemaakt van het huidige EXTRA Rewards systeem.

### Backup Details
- **Locatie**: `/home/runner/extra-rewards-backup/`
- **Compressed**: `extra-rewards-backup-YYYYMMDD_HHMM.tar.gz`
- **Datum**: 26 juni 2025, 10:57 AM
- **Status**: Volledig werkend systeem met alle 4 tabbladen

### Om de backup te herstellen:

1. **Extract de backup**:
   ```bash
   cd /home/runner
   tar -xzf extra-rewards-backup-YYYYMMDD_HHMM.tar.gz
   ```

2. **Kopieer naar nieuwe project**:
   ```bash
   cp -r extra-rewards-backup/ /path/to/new/project/
   ```

3. **Start de applicatie**:
   ```bash
   cd /path/to/new/project/
   npm run dev
   ```

### Wat zit er in de backup:
- ✅ Volledige codebase (client/, server/, shared/)
- ✅ Package.json met alle dependencies
- ✅ Database schema en initiële data
- ✅ Challenges systeem met voortgangsbalken
- ✅ Leaderboard functionaliteit
- ✅ Admin panel configuratie
- ✅ WebSocket real-time updates
- ✅ Alle UI componenten en styling

### Test Accounts:
- **Medewerker**: medewerker@extra.nl / medewerker123
- **Admin**: admin@extra.nl / admin123

Het systeem draait direct na restore op poort 5000 en is volledig functioneel.