/**
 * Seed data for Planworks-based challenges
 * Creates default challenges with proper categorization
 */

import { storage } from './storage';

interface ChallengeDefinition {
  title: string;
  description: string;
  category: string;
  type: 'eenmalig' | 'doorlopend';
  status: 'active' | 'inactive';
  steps?: {
    stepNumber: number;
    title: string;
    description: string;
    targetValue: number;
    pointsReward: number;
    badgeTitle?: string;
  }[];
}

const planworksChallenges: ChallengeDefinition[] = [
  {
    title: "Diensten Draaier",
    description: "Draai verschillende diensten en verdien punten voor je inzet",
    category: "shifts",
    type: "doorlopend",
    status: "active",
    steps: [
      {
        stepNumber: 1,
        title: "Eerste diensten",
        description: "Draai je eerste 5 diensten",
        targetValue: 5,
        pointsReward: 100,
        badgeTitle: "Starter"
      },
      {
        stepNumber: 2,
        title: "Ervaren werker",
        description: "Draai 15 diensten in totaal",
        targetValue: 15,
        pointsReward: 250,
        badgeTitle: "Ervaren"
      },
      {
        stepNumber: 3,
        title: "Diensten expert",
        description: "Draai 30 diensten in totaal",
        targetValue: 30,
        pointsReward: 500,
        badgeTitle: "Expert"
      },
      {
        stepNumber: 4,
        title: "Diensten professional",
        description: "Draai 50 diensten in totaal",
        targetValue: 50,
        pointsReward: 750,
        badgeTitle: "Professional"
      }
    ]
  },
  {
    title: "Overwerk Held",
    description: "Maak extra uren en word beloond voor je toewijding",
    category: "overtime",
    type: "doorlopend",
    status: "active",
    steps: [
      {
        stepNumber: 1,
        title: "Extra mijl",
        description: "Werk 5 overuren",
        targetValue: 5,
        pointsReward: 150,
        badgeTitle: "Extra mijl"
      },
      {
        stepNumber: 2,
        title: "Toegewijd werker",
        description: "Werk 15 overuren in totaal",
        targetValue: 15,
        pointsReward: 300,
        badgeTitle: "Toegewijd"
      },
      {
        stepNumber: 3,
        title: "Overwerk kampioen",
        description: "Werk 30 overuren in totaal",
        targetValue: 30,
        pointsReward: 600,
        badgeTitle: "Kampioen"
      }
    ]
  },
  {
    title: "Last-minute Held",
    description: "Spring bij wanneer het nodig is en red de dag",
    category: "lastminute",
    type: "doorlopend",
    status: "active",
    steps: [
      {
        stepNumber: 1,
        title: "Snelle reactie",
        description: "Val 3 keer last-minute in",
        targetValue: 3,
        pointsReward: 200,
        badgeTitle: "Redder"
      },
      {
        stepNumber: 2,
        title: "Betrouwbare vervanger",
        description: "Val 8 keer last-minute in",
        targetValue: 8,
        pointsReward: 400,
        badgeTitle: "Betrouwbaar"
      },
      {
        stepNumber: 3,
        title: "Last-minute expert",
        description: "Val 15 keer last-minute in",
        targetValue: 15,
        pointsReward: 750,
        badgeTitle: "Expert"
      }
    ]
  },
  {
    title: "Stiptheids Specialist",
    description: "Kom altijd op tijd en behoud een hoge stiptheidsscore",
    category: "punctuality",
    type: "doorlopend",
    status: "active",
    steps: [
      {
        stepNumber: 1,
        title: "Punctueel",
        description: "Behaal 85% stiptheidsscore",
        targetValue: 85,
        pointsReward: 100,
        badgeTitle: "Punctueel"
      },
      {
        stepNumber: 2,
        title: "Zeer stipt",
        description: "Behaal 90% stiptheidsscore",
        targetValue: 90,
        pointsReward: 200,
        badgeTitle: "Zeer stipt"
      },
      {
        stepNumber: 3,
        title: "Stiptheidskampioen",
        description: "Behaal 95% stiptheidsscore",
        targetValue: 95,
        pointsReward: 400,
        badgeTitle: "Kampioen"
      }
    ]
  },
  {
    title: "Beschikbaarheids Pro",
    description: "Houd je beschikbaarheid hoog en wees altijd inzetbaar",
    category: "availability",
    type: "doorlopend",
    status: "active",
    steps: [
      {
        stepNumber: 1,
        title: "Beschikbaar",
        description: "Behaal 80% beschikbaarheid",
        targetValue: 80,
        pointsReward: 150,
        badgeTitle: "Beschikbaar"
      },
      {
        stepNumber: 2,
        title: "Zeer beschikbaar",
        description: "Behaal 90% beschikbaarheid",
        targetValue: 90,
        pointsReward: 300,
        badgeTitle: "Zeer beschikbaar"
      }
    ]
  },
  {
    title: "Klantfavoriet",
    description: "Krijg excellente beoordelingen van klanten",
    category: "client_rating",
    type: "doorlopend",
    status: "active",
    steps: [
      {
        stepNumber: 1,
        title: "Goede service",
        description: "Behaal 4.0 gemiddelde beoordeling",
        targetValue: 4,
        pointsReward: 200,
        badgeTitle: "Goede service"
      },
      {
        stepNumber: 2,
        title: "Excellente service",
        description: "Behaal 4.5 gemiddelde beoordeling",
        targetValue: 4.5,
        pointsReward: 400,
        badgeTitle: "Excellent"
      }
    ]
  },
  {
    title: "Leer Champion",
    description: "Voltooi trainingen en ontwikkel je vaardigheden",
    category: "training_completion",
    type: "doorlopend",
    status: "active",
    steps: [
      {
        stepNumber: 1,
        title: "Eerste training",
        description: "Voltooi je eerste training",
        targetValue: 1,
        pointsReward: 100,
        badgeTitle: "Leerling"
      },
      {
        stepNumber: 2,
        title: "Getraind werker",
        description: "Voltooi 3 trainingen",
        targetValue: 3,
        pointsReward: 250,
        badgeTitle: "Getraind"
      },
      {
        stepNumber: 3,
        title: "Training expert",
        description: "Voltooi 5 trainingen",
        targetValue: 5,
        pointsReward: 500,
        badgeTitle: "Expert"
      }
    ]
  },
  // Handmatig beheerde challenges
  {
    title: "Talent Scout",
    description: "Breng nieuwe medewerkers naar EXTRA en ontvang bonuspunten",
    category: "referrals",
    type: "doorlopend",
    status: "active",
    steps: [
      {
        stepNumber: 1,
        title: "Eerste referral",
        description: "Breng je eerste nieuwe medewerker aan",
        targetValue: 1,
        pointsReward: 300,
        badgeTitle: "Scout"
      },
      {
        stepNumber: 2,
        title: "Talent hunter",
        description: "Breng 3 nieuwe medewerkers aan",
        targetValue: 3,
        pointsReward: 600,
        badgeTitle: "Hunter"
      },
      {
        stepNumber: 3,
        title: "Recruitment specialist",
        description: "Breng 5 nieuwe medewerkers aan",
        targetValue: 5,
        pointsReward: 1000,
        badgeTitle: "Specialist"
      }
    ]
  },
  {
    title: "Social Media Ambassador",
    description: "Deel EXTRA content en vergroot onze online aanwezigheid",
    category: "social_media",
    type: "doorlopend",
    status: "active",
    steps: [
      {
        stepNumber: 1,
        title: "Eerste post",
        description: "Deel je eerste EXTRA story",
        targetValue: 1,
        pointsReward: 50,
        badgeTitle: "Poster"
      },
      {
        stepNumber: 2,
        title: "Actieve deler",
        description: "Deel 5 EXTRA stories",
        targetValue: 5,
        pointsReward: 200,
        badgeTitle: "Actief"
      },
      {
        stepNumber: 3,
        title: "Brand ambassador",
        description: "Deel 10 EXTRA stories",
        targetValue: 10,
        pointsReward: 400,
        badgeTitle: "Ambassador"
      }
    ]
  }
];

async function seedPlanworksChallenges() {
  console.log('🌱 Seeding Planworks challenges...');
  
  try {
    // Check if challenges already exist
    const existingChallenges = await storage.getChallenges();
    
    if (existingChallenges.length > 0) {
      console.log(`ℹ️  ${existingChallenges.length} challenges already exist, skipping seed`);
      return;
    }

    let challengesCreated = 0;
    let stepsCreated = 0;

    for (const challengeDef of planworksChallenges) {
      // Create the challenge
      const challenge = await storage.createChallenge({
        title: challengeDef.title,
        description: challengeDef.description,
        category: challengeDef.category,
        type: challengeDef.type,
        status: challengeDef.status,
        points: challengeDef.type === 'eenmalig' ? 100 : null
      });

      challengesCreated++;
      console.log(`✅ Created challenge: ${challenge.title}`);

      // Create steps if it's a progressive challenge
      if (challengeDef.steps && challengeDef.type === 'doorlopend') {
        for (const stepDef of challengeDef.steps) {
          const step = await storage.createChallengeStep({
            challengeId: challenge.id,
            stepNumber: stepDef.stepNumber,
            title: stepDef.title,
            description: stepDef.description,
            targetValue: stepDef.targetValue,
            pointsReward: stepDef.pointsReward,
            badgeTitle: stepDef.badgeTitle || null
          });

          stepsCreated++;
          console.log(`  ➡️  Created step ${step.stepNumber}: ${step.title}`);
        }
      }
    }

    console.log(`🎉 Successfully seeded ${challengesCreated} challenges with ${stepsCreated} steps`);
    console.log('💡 Planworks categories: shifts, overtime, lastminute, punctuality, availability, client_rating, training_completion');
    console.log('✋ Manual categories: referrals, social_media');

  } catch (error) {
    console.error('❌ Error seeding Planworks challenges:', error);
    throw error;
  }
}

// Export the seeding function
export { seedPlanworksChallenges };