import { storage } from './storage';
import { User, PointTransaction } from '@shared/schema';

// Constante voor verjaardag punten
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
 * Ken punten toe aan jarige gebruikers.
 * Returnt het aantal gebruikers dat punten heeft ontvangen.
 */
export async function awardBirthdayPoints(): Promise<number> {
  try {
    const birthdayUsers = await getUsersWithBirthdayToday();
    console.log(`${birthdayUsers.length} gebruikers zijn vandaag jarig`);
    
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
            amount: BIRTHDAY_POINTS,
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
            const newPoints = updatedUser.points + BIRTHDAY_POINTS;
            
            // Gebruiker bijwerken met nieuwe punten
            storage['users'].set(user.id, {
              ...updatedUser,
              points: newPoints
            });
            
            usersAwarded++;
            console.log(`${BIRTHDAY_POINTS} punten toegekend aan ${user.email} voor verjaardag, nieuw saldo: ${newPoints} punten`);
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