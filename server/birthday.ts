import { storage } from './storage';
import { User, PointTransaction } from '@shared/schema';
import { sendBirthdayEmail } from './mail';

// Constante voor verjaardag punten (standaard waarde, kan worden overschreven door instellingen)
export const BIRTHDAY_POINTS = 100;
// Constante voor punten waarde in Euro
export const POINTS_TO_EURO_RATIO = 20; // 20 punten = €1

/**
 * Haalt alle gebruikers op die vandaag jarig zijn.
 * Vergelijkt alleen maand en dag, niet het jaar.
 */
export async function getUsersWithBirthdayToday(): Promise<User[]> {
  // Haal alle gebruikers op
  const allUsers = await storage.getUsers();
  
  // Huidige datum (lokale tijd)
  const now = new Date();
  const currentMonth = now.getMonth() + 1; // getMonth() is 0-based
  const currentDay = now.getDate();
  
  // Filter gebruikers die vandaag jarig zijn
  return allUsers.filter(user => {
    // Sla over als geen geboortedatum bekend is
    if (!user.birthDate) return false;
    
    // Parse geboortedatum
    const birthDate = new Date(user.birthDate);
    const birthMonth = birthDate.getMonth() + 1;
    const birthDay = birthDate.getDate();
    
    // Check of maand en dag overeen komen met vandaag
    return birthMonth === currentMonth && birthDay === currentDay;
  });
}

/**
 * Haalt de verjaardagspunten waarde op uit de instellingen of gebruikt de standaardwaarde
 */
export async function getBirthdayPointsValue(): Promise<number> {
  try {
    const setting = await storage.getSetting('birthday_points');
    if (setting && setting.value) {
      const value = parseInt(setting.value, 10);
      if (!isNaN(value) && value > 0) {
        return value;
      }
    }
    return BIRTHDAY_POINTS; // Standaardwaarde als geen instelling gevonden
  } catch (error) {
    console.error('Fout bij ophalen van verjaardagspunten instelling:', error);
    return BIRTHDAY_POINTS;
  }
}

/**
 * Controleert of op dit moment verjaardagsmails verzonden mogen worden
 * op basis van de ingestelde tijdslots in de instellingen
 */
export async function shouldSendBirthdayEmails(): Promise<boolean> {
  try {
    // Haal ingestelde tijdstip op uit instellingen
    const setting = await storage.getSetting('birthday_email_time');
    
    if (!setting || !setting.value) {
      // Als geen instelling gevonden, stuur altijd
      return true;
    }
    
    // Haal uren en minuten uit de instelling (formaat: "HH:MM")
    const timeParts = setting.value.split(':');
    if (timeParts.length !== 2) {
      return true; // Bij ongeldig formaat, stuur altijd
    }
    
    const targetHour = parseInt(timeParts[0], 10);
    const targetMinute = parseInt(timeParts[1], 10);
    
    if (isNaN(targetHour) || isNaN(targetMinute)) {
      return true; // Bij ongeldige waarden, stuur altijd
    }
    
    // Controleer of het nu binnen het toegestane tijdvenster is
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    // Check of we binnen 5 minuten van het doeltijdstip zitten
    if (currentHour === targetHour && 
        currentMinute >= targetMinute && 
        currentMinute <= targetMinute + 5) {
      return true;
    }
    
    // Sta toe om verjaardagspunten toe te kennen rond middernacht voor de automatische controle
    // maar verstuur dan geen e-mails
    const isAroundMidnight = currentHour === 0 && currentMinute <= 10;
    
    return !isAroundMidnight;
  } catch (error) {
    console.error('Fout bij controleren van verjaardags-email tijdstip:', error);
    return true; // Bij fouten, failsafe: stuur altijd
  }
}

/**
 * Ken punten toe aan jarige gebruikers.
 * Returnt het aantal gebruikers dat punten heeft ontvangen.
 */
export async function awardBirthdayPoints(): Promise<number> {
  try {
    const birthdayUsers = await getUsersWithBirthdayToday();
    console.log(`${birthdayUsers.length} gebruikers zijn vandaag jarig`);
    
    // Haal de puntenwaarde op uit instellingen
    const birthdayPoints = await getBirthdayPointsValue();
    
    // Controleer of we e-mails mogen verzenden op dit tijdstip
    const shouldSendEmails = await shouldSendBirthdayEmails();
    
    console.log(`Verjaardagspunten: ${birthdayPoints} punten, e-mails versturen: ${shouldSendEmails ? 'Ja' : 'Nee'}`);
    
    // Teller voor aantal gebruikers aan wie punten zijn toegekend
    let usersAwarded = 0;
    
    // Kent punten toe aan elke jarige gebruiker
    for (const user of birthdayUsers) {
      try {
        // Controleer of gebruiker actief is
        if (user.status !== 'active') {
          console.log(`Gebruiker ${user.id} (${user.email}) is inactief, geen punten toegekend`);
          continue;
        }
        
        // Controleer of er al verjaardagspunten zijn toegekend vandaag
        // Dit voorkomt dubbele toekenningen als de functie meerdere keren per dag wordt uitgevoerd
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const transactions = await storage.getPointTransactionsByUserId(user.id);
        const alreadyAwarded = transactions.some(t => 
          t.source === 'verjaardag' && 
          new Date(t.createdAt) >= today && 
          t.type === 'earned'
        );
        
        if (alreadyAwarded) {
          console.log(`Gebruiker ${user.id} (${user.email}) heeft vandaag al verjaardagspunten ontvangen`);
          continue;
        }
        
        // Maak een speciale private transactie functie om te voorkomen dat er dubbele punten worden toegekend
        // Deze functie handelt alles af in één keer, zonder de gebruiker dubbel bij te werken
        try {
          // Maak eerst de transactie aan zonder automatische punten-update
          const transactionData = {
            userId: user.id,
            amount: birthdayPoints,
            type: 'earned' as const,
            description: 'Verjaardagsbonus',
            source: 'verjaardag',
            sourceId: null,
            metadata: {
              birthday: [new Date().toISOString()],
              automaticallyAwarded: [true]
            }
          };
          
          // Transactie direct aanmaken via storage zonder updateUserPoints
          const id = storage['currentIds'].pointTransactions++;
          const now = new Date();
          
          const transaction: PointTransaction = {
            id,
            ...transactionData,
            createdAt: now
          };
          
          // Transactie opslaan
          storage['pointTransactions'].set(id, transaction);
          
          // Punten handmatig updaten
          const updatedUser = await storage.getUser(user.id);
          if (updatedUser) {
            const newPoints = updatedUser.points + birthdayPoints;
            
            // Gebruiker bijwerken met nieuwe punten
            storage['users'].set(user.id, {
              ...updatedUser,
              points: newPoints
            });
            
            usersAwarded++;
            console.log(`${birthdayPoints} punten toegekend aan ${user.email} voor verjaardag, nieuw saldo: ${newPoints} punten`);
            
            // Verzend een verjaardags e-mail als dat ingesteld is
            if (shouldSendEmails) {
              try {
                // Import de sendBirthdayEmail functie hier om circulaire imports te voorkomen
                const { sendBirthdayEmail } = await import('./mail');
                const emailSent = await sendBirthdayEmail(updatedUser, birthdayPoints);
                
                if (emailSent) {
                  console.log(`Verjaardags e-mail succesvol verzonden naar ${user.email}`);
                } else {
                  console.warn(`Kon geen verjaardags e-mail verzenden naar ${user.email}`);
                }
              } catch (emailError) {
                console.error(`Fout bij verzenden van verjaardags e-mail naar ${user.email}:`, emailError);
              }
            } else {
              console.log(`Geen verjaardags e-mail verzonden naar ${user.email} (buiten ingestelde verzendtijd)`);
            }
          }
        } catch (error) {
          console.error(`Fout bij het aanmaken van verjaardagstransactie voor gebruiker ${user.id}:`, error);
        }
      } catch (error) {
        console.error(`Fout bij toekennen van punten aan gebruiker ${user.id}:`, error);
      }
    }
    
    return usersAwarded;
  } catch (error) {
    console.error('Fout bij verjaardagspunten toekenning:', error);
    return 0;
  }
}

/**
 * Berekent de euro waarde van een bepaald aantal punten
 */
export function pointsToEuro(points: number): number {
  return Math.floor(points / POINTS_TO_EURO_RATIO);
}

/**
 * Berekent het aantal punten voor een bepaald bedrag in euro
 */
export function euroToPoints(euro: number): number {
  return euro * POINTS_TO_EURO_RATIO;
}