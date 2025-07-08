# Push Notification Systeem - Gebruikershandleiding

## Waar vind je de push notification instellingen?

### Voor medewerkers:
1. **Log in** op de website met je medewerker account
2. **Klik rechtsboven** op je profiel icoon (cirkel met je initialen)
3. **Kies "Mijn Profiel"** uit het dropdown menu
4. **Klik op het "Voorkeuren" tabblad**
5. **Hier vind je "Push Notificaties"** met een aan/uit schakelaar

### Wat kun je doen:
- **Notificaties aan/uit zetten** met de schakelaar
- **Test notificaties versturen** met verschillende types:
  - Algemene Test
  - Achievement notificatie
  - Challenge Update
  - Leaderboard notificatie

## Wanneer krijg je push notificaties?

Het systeem stuurt automatisch notificaties wanneer:
- 🎉 **Je punten verdient** (achievement berichten)
- 🎯 **Je een challenge voltooit** (challenge completion)
- 🏆 **Je leaderboard positie verandert**
- 🎁 **Nieuwe beloningen beschikbaar** komen
- 💪 **Dagelijkse motivatie berichten**

## Systeemvereisten:
- Modern browser (Chrome, Firefox, Safari, Edge)
- JavaScript ingeschakeld
- Notificatie permissies toegestaan

## Technische details:
- VAPID keys automatisch gegenereerd
- Service Worker geregistreerd voor background notificaties
- Veilige communicatie via web-push protocol
- Notificaties werken ook als de app gesloten is

## Problemen oplossen:
1. **Geen notificaties ontvangen?**
   - Check of notificaties zijn ingeschakeld in je browser
   - Controleer de push notification instellingen in je profiel
   - Test met een test notificatie

2. **Kan instellingen niet vinden?**
   - Zorg dat je ingelogd bent als medewerker
   - Ga naar Profiel → Voorkeuren tabblad
   - Scroll naar beneden naar "Push Notificaties"

3. **Browser ondersteunt het niet?**
   - Gebruik een moderne browser
   - Check of je de nieuwste versie hebt