import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env from monorepo root
config({ path: resolve(__dirname, '../../../.env') });

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clean existing seed data (order matters due to foreign keys)
  await prisma.lease.deleteMany({});
  await prisma.document.deleteMany({});
  await prisma.availabilitySlot.deleteMany({});
  await prisma.appointment.deleteMany({});
  await prisma.application.deleteMany({});
  await prisma.propertyView.deleteMany({});
  await prisma.rating.deleteMany({});
  await prisma.message.deleteMany({});
  await prisma.conversation.deleteMany({});
  await prisma.match.deleteMany({});
  await prisma.swipe.deleteMany({});
  await prisma.roommateProfile.deleteMany({});
  await prisma.propertyImage.deleteMany({});
  await prisma.property.deleteMany({});
  await prisma.user.deleteMany({});
  console.log('  Cleaned existing data');

  // Hash default password for all test users
  const defaultPassword = await bcrypt.hash('password123', 12);

  // ============================================================
  // USERS — 16 total with diverse profiles
  // ============================================================
  const user1 = await prisma.user.create({
    data: {
      cognitoSub: 'cognito-sub-001',
      email: 'julian@test.com',
      firstName: 'Julian',
      lastName: 'Salamanca',
      password: defaultPassword,
      bio: 'Desarrollador buscando apartamento en Bogota',
      seekingMode: 'ROOMMATE',
      age: 28,
      occupation: 'Desarrollador de software',
      nationality: 'Colombiana',
      gender: 'MALE',
      preferences: {
        lookingFor: ['ROOMMATE', 'APARTMENT'],
        myTraits: { worksOutside: false, schedule: 'MORNING', hasPets: false, hasChildren: false, smokes: false, drinks: 'SOCIALLY', hasFrequentVisitors: false, cleanliness: 'CLEAN', personality: ['CALM', 'INTROVERT'] },
        idealRoommate: { schedulePreference: 'ANY', petsOk: true, childrenOk: false, smokingOk: false, drinkingOk: true, visitorsOk: true, cleanlinessPreference: 'CLEAN', personalityPreference: ['CALM', 'SOCIAL'], ageRange: { min: 20, max: 35 }, genderPreference: ['ANY'] },
      },
    },
  });

  const user2 = await prisma.user.create({
    data: {
      cognitoSub: 'cognito-sub-002',
      email: 'maria@test.com',
      firstName: 'Maria',
      lastName: 'Garcia',
      password: defaultPassword,
      bio: 'Arrendadora con propiedades en Chapinero y Usaquen',
      seekingMode: 'NONE',
      age: 35,
      occupation: 'Empresaria',
      nationality: 'Colombiana',
      gender: 'FEMALE',
      preferences: {
        lookingFor: [],
        myTraits: { worksOutside: true, schedule: 'MORNING', hasPets: false, hasChildren: true, smokes: false, drinks: 'SOCIALLY', hasFrequentVisitors: false, cleanliness: 'VERY_CLEAN', personality: ['EXTROVERT', 'ACTIVE'] },
      },
    },
  });

  const user3 = await prisma.user.create({
    data: {
      cognitoSub: 'cognito-sub-003',
      email: 'carlos@test.com',
      firstName: 'Carlos',
      lastName: 'Lopez',
      password: defaultPassword,
      bio: 'Estudiante universitario buscando compañero de cuarto',
      seekingMode: 'ROOMMATE',
      age: 22,
      occupation: 'Estudiante de ingenieria',
      nationality: 'Colombiana',
      gender: 'MALE',
      preferences: {
        lookingFor: ['ROOMMATE', 'ROOM'],
        myTraits: { worksOutside: true, schedule: 'NIGHT', hasPets: false, hasChildren: false, smokes: false, drinks: 'SOCIALLY', hasFrequentVisitors: true, cleanliness: 'MODERATE', personality: ['SOCIAL', 'STUDIOUS'] },
        idealRoommate: { schedulePreference: 'ANY', petsOk: false, childrenOk: false, smokingOk: false, drinkingOk: true, visitorsOk: true, cleanlinessPreference: 'ANY', personalityPreference: ['SOCIAL', 'CALM'], ageRange: { min: 18, max: 30 }, genderPreference: ['ANY'] },
      },
    },
  });

  const user4 = await prisma.user.create({
    data: {
      cognitoSub: 'cognito-sub-004',
      email: 'ana@test.com',
      firstName: 'Ana',
      lastName: 'Rodriguez',
      password: defaultPassword,
      bio: 'Profesional joven buscando compartir apartamento',
      seekingMode: 'ROOMMATE',
      age: 26,
      occupation: 'Diseñadora grafica',
      nationality: 'Colombiana',
      gender: 'FEMALE',
      preferences: {
        lookingFor: ['ROOMMATE', 'SHARE_EXPENSES'],
        myTraits: { worksOutside: false, schedule: 'MORNING', hasPets: true, hasChildren: false, smokes: false, drinks: 'NEVER', hasFrequentVisitors: false, cleanliness: 'VERY_CLEAN', personality: ['CALM', 'ACTIVE'] },
        idealRoommate: { schedulePreference: 'MORNING', petsOk: true, childrenOk: false, smokingOk: false, drinkingOk: false, visitorsOk: false, cleanlinessPreference: 'VERY_CLEAN', personalityPreference: ['CALM', 'INTROVERT'], ageRange: { min: 22, max: 35 }, genderPreference: ['FEMALE'] },
      },
    },
  });

  const user5 = await prisma.user.create({
    data: {
      cognitoSub: 'cognito-sub-005',
      email: 'santiago@test.com',
      firstName: 'Santiago',
      lastName: 'Herrera',
      password: defaultPassword,
      bio: 'Chef profesional, me encanta cocinar para todos. Busco gente chill y social.',
      seekingMode: 'ROOMMATE',
      age: 25,
      occupation: 'Chef',
      nationality: 'Colombiana',
      gender: 'MALE',
      preferences: {
        lookingFor: ['ROOMMATE'],
        myTraits: { worksOutside: true, schedule: 'NIGHT', hasPets: false, hasChildren: false, smokes: false, drinks: 'FREQUENTLY', hasFrequentVisitors: true, cleanliness: 'MODERATE', personality: ['EXTROVERT', 'SOCIAL'] },
        idealRoommate: { schedulePreference: 'ANY', petsOk: true, childrenOk: false, smokingOk: true, drinkingOk: true, visitorsOk: true, cleanlinessPreference: 'ANY', personalityPreference: ['SOCIAL', 'EXTROVERT'], ageRange: { min: 20, max: 35 }, genderPreference: ['ANY'] },
      },
    },
  });

  const user6 = await prisma.user.create({
    data: {
      cognitoSub: 'cognito-sub-006',
      email: 'valentina@test.com',
      firstName: 'Valentina',
      lastName: 'Moreno',
      password: defaultPassword,
      bio: 'Estudiante de medicina en ultimo semestre. Responsable, ordenada y tranquila.',
      seekingMode: 'ROOMMATE',
      age: 24,
      occupation: 'Estudiante de medicina',
      nationality: 'Colombiana',
      gender: 'FEMALE',
      preferences: {
        lookingFor: ['ROOM', 'SHARE_EXPENSES'],
        myTraits: { worksOutside: true, schedule: 'MORNING', hasPets: false, hasChildren: false, smokes: false, drinks: 'NEVER', hasFrequentVisitors: false, cleanliness: 'VERY_CLEAN', personality: ['INTROVERT', 'STUDIOUS'] },
        idealRoommate: { schedulePreference: 'ANY', petsOk: false, childrenOk: false, smokingOk: false, drinkingOk: false, visitorsOk: false, cleanlinessPreference: 'VERY_CLEAN', personalityPreference: ['CALM', 'STUDIOUS'], ageRange: { min: 20, max: 30 }, genderPreference: ['FEMALE'] },
      },
    },
  });

  const user7 = await prisma.user.create({
    data: {
      cognitoSub: 'cognito-sub-007',
      email: 'andres@test.com',
      firstName: 'Andres',
      lastName: 'Castillo',
      password: defaultPassword,
      bio: 'Trabajo remoto en fintech. Gamer los fines de semana, buen compañero de piso.',
      seekingMode: 'ROOMMATE',
      age: 27,
      occupation: 'Analista financiero',
      nationality: 'Colombiana',
      gender: 'MALE',
      preferences: {
        lookingFor: ['ROOMMATE', 'APARTMENT'],
        myTraits: { worksOutside: false, schedule: 'AFTERNOON', hasPets: false, hasChildren: false, smokes: false, drinks: 'SOCIALLY', hasFrequentVisitors: false, cleanliness: 'CLEAN', personality: ['INTROVERT', 'CALM'] },
        idealRoommate: { schedulePreference: 'ANY', petsOk: false, childrenOk: false, smokingOk: false, drinkingOk: true, visitorsOk: false, cleanlinessPreference: 'CLEAN', personalityPreference: ['CALM', 'INTROVERT'], ageRange: { min: 22, max: 35 }, genderPreference: ['ANY'] },
      },
    },
  });

  const user8 = await prisma.user.create({
    data: {
      cognitoSub: 'cognito-sub-008',
      email: 'camila@test.com',
      firstName: 'Camila',
      lastName: 'Restrepo',
      password: defaultPassword,
      bio: 'Artista y musica. Busco un espacio creativo y compañeros con buena energia.',
      seekingMode: 'ROOMMATE',
      age: 23,
      occupation: 'Musica freelance',
      nationality: 'Colombiana',
      gender: 'FEMALE',
      preferences: {
        lookingFor: ['ROOMMATE', 'ROOM'],
        myTraits: { worksOutside: false, schedule: 'NIGHT', hasPets: true, hasChildren: false, smokes: false, drinks: 'SOCIALLY', hasFrequentVisitors: true, cleanliness: 'MODERATE', personality: ['EXTROVERT', 'SOCIAL'] },
        idealRoommate: { schedulePreference: 'ANY', petsOk: true, childrenOk: false, smokingOk: true, drinkingOk: true, visitorsOk: true, cleanlinessPreference: 'ANY', personalityPreference: ['SOCIAL', 'EXTROVERT', 'ACTIVE'], ageRange: { min: 20, max: 35 }, genderPreference: ['ANY'] },
      },
    },
  });

  const user9 = await prisma.user.create({
    data: {
      cognitoSub: 'cognito-sub-009',
      email: 'diego@test.com',
      firstName: 'Diego',
      lastName: 'Vargas',
      password: defaultPassword,
      bio: 'Abogado junior, me gusta el futbol y las series. Busco alguien tranquilo.',
      seekingMode: 'ROOMMATE',
      age: 29,
      occupation: 'Abogado',
      nationality: 'Colombiana',
      gender: 'MALE',
      preferences: {
        lookingFor: ['ROOMMATE', 'APARTMENT'],
        myTraits: { worksOutside: true, schedule: 'MORNING', hasPets: false, hasChildren: false, smokes: false, drinks: 'SOCIALLY', hasFrequentVisitors: false, cleanliness: 'CLEAN', personality: ['CALM', 'SOCIAL'] },
        idealRoommate: { schedulePreference: 'MORNING', petsOk: false, childrenOk: false, smokingOk: false, drinkingOk: true, visitorsOk: true, cleanlinessPreference: 'CLEAN', personalityPreference: ['CALM', 'SOCIAL'], ageRange: { min: 24, max: 35 }, genderPreference: ['MALE'] },
      },
    },
  });

  const user10 = await prisma.user.create({
    data: {
      cognitoSub: 'cognito-sub-010',
      email: 'laura@test.com',
      firstName: 'Laura',
      lastName: 'Mejia',
      password: defaultPassword,
      bio: 'Trabajo en marketing digital, me encanta viajar y el cafe. Soy super social.',
      seekingMode: 'ROOMMATE',
      age: 26,
      occupation: 'Marketing digital',
      nationality: 'Colombiana',
      gender: 'FEMALE',
      preferences: {
        lookingFor: ['ROOMMATE', 'SHARE_EXPENSES'],
        myTraits: { worksOutside: false, schedule: 'AFTERNOON', hasPets: false, hasChildren: false, smokes: false, drinks: 'SOCIALLY', hasFrequentVisitors: true, cleanliness: 'CLEAN', personality: ['EXTROVERT', 'SOCIAL', 'ACTIVE'] },
        idealRoommate: { schedulePreference: 'ANY', petsOk: true, childrenOk: false, smokingOk: false, drinkingOk: true, visitorsOk: true, cleanlinessPreference: 'MODERATE', personalityPreference: ['SOCIAL', 'EXTROVERT'], ageRange: { min: 22, max: 32 }, genderPreference: ['ANY'] },
      },
    },
  });

  const user11 = await prisma.user.create({
    data: {
      cognitoSub: 'cognito-sub-011',
      email: 'felipe@test.com',
      firstName: 'Felipe',
      lastName: 'Gutierrez',
      password: defaultPassword,
      bio: 'Fotografo profesional, viajo mucho pero necesito un lugar fijo. Tengo un gato llamado Pixel.',
      seekingMode: 'ROOMMATE',
      age: 30,
      occupation: 'Fotografo',
      nationality: 'Colombiana',
      gender: 'MALE',
      preferences: {
        lookingFor: ['ROOMMATE', 'APARTMENT'],
        myTraits: { worksOutside: true, schedule: 'AFTERNOON', hasPets: true, hasChildren: false, smokes: false, drinks: 'SOCIALLY', hasFrequentVisitors: false, cleanliness: 'CLEAN', personality: ['INTROVERT', 'CALM'] },
        idealRoommate: { schedulePreference: 'ANY', petsOk: true, childrenOk: false, smokingOk: false, drinkingOk: true, visitorsOk: false, cleanlinessPreference: 'CLEAN', personalityPreference: ['CALM', 'INTROVERT'], ageRange: { min: 24, max: 38 }, genderPreference: ['ANY'] },
      },
    },
  });

  const user12 = await prisma.user.create({
    data: {
      cognitoSub: 'cognito-sub-012',
      email: 'isabella@test.com',
      firstName: 'Isabella',
      lastName: 'Torres',
      password: defaultPassword,
      bio: 'Nutricionista deportiva, me levanto temprano a entrenar. Busco alguien fitness.',
      seekingMode: 'ROOMMATE',
      age: 25,
      occupation: 'Nutricionista',
      nationality: 'Colombiana',
      gender: 'FEMALE',
      preferences: {
        lookingFor: ['ROOMMATE'],
        myTraits: { worksOutside: true, schedule: 'MORNING', hasPets: false, hasChildren: false, smokes: false, drinks: 'NEVER', hasFrequentVisitors: false, cleanliness: 'VERY_CLEAN', personality: ['ACTIVE', 'EXTROVERT'] },
        idealRoommate: { schedulePreference: 'MORNING', petsOk: false, childrenOk: false, smokingOk: false, drinkingOk: false, visitorsOk: false, cleanlinessPreference: 'VERY_CLEAN', personalityPreference: ['ACTIVE', 'CALM'], ageRange: { min: 20, max: 32 }, genderPreference: ['ANY'] },
      },
    },
  });

  const user13 = await prisma.user.create({
    data: {
      cognitoSub: 'cognito-sub-013',
      email: 'mateo@test.com',
      firstName: 'Mateo',
      lastName: 'Rios',
      password: defaultPassword,
      bio: 'Emprendedor tech con startup de delivery. Siempre en movimiento, busco flexibilidad.',
      seekingMode: 'ROOMMATE',
      age: 31,
      occupation: 'CEO / Emprendedor',
      nationality: 'Colombiana',
      gender: 'MALE',
      preferences: {
        lookingFor: ['ROOMMATE', 'APARTMENT'],
        myTraits: { worksOutside: false, schedule: 'NIGHT', hasPets: false, hasChildren: false, smokes: false, drinks: 'SOCIALLY', hasFrequentVisitors: true, cleanliness: 'MODERATE', personality: ['EXTROVERT', 'ACTIVE', 'SOCIAL'] },
        idealRoommate: { schedulePreference: 'ANY', petsOk: false, childrenOk: false, smokingOk: false, drinkingOk: true, visitorsOk: true, cleanlinessPreference: 'ANY', personalityPreference: ['ACTIVE', 'SOCIAL'], ageRange: { min: 24, max: 38 }, genderPreference: ['ANY'] },
      },
    },
  });

  const user14 = await prisma.user.create({
    data: {
      cognitoSub: 'cognito-sub-014',
      email: 'daniela@test.com',
      firstName: 'Daniela',
      lastName: 'Peña',
      password: defaultPassword,
      bio: 'Profesora de yoga y meditacion. Necesito un espacio zen y tranquilo.',
      seekingMode: 'ROOMMATE',
      age: 28,
      occupation: 'Instructora de yoga',
      nationality: 'Argentina',
      gender: 'FEMALE',
      preferences: {
        lookingFor: ['ROOMMATE', 'ROOM'],
        myTraits: { worksOutside: true, schedule: 'MORNING', hasPets: false, hasChildren: false, smokes: false, drinks: 'NEVER', hasFrequentVisitors: false, cleanliness: 'VERY_CLEAN', personality: ['INTROVERT', 'CALM'] },
        idealRoommate: { schedulePreference: 'MORNING', petsOk: false, childrenOk: false, smokingOk: false, drinkingOk: false, visitorsOk: false, cleanlinessPreference: 'VERY_CLEAN', personalityPreference: ['CALM', 'INTROVERT'], ageRange: { min: 22, max: 35 }, genderPreference: ['FEMALE'] },
      },
    },
  });

  const user15 = await prisma.user.create({
    data: {
      cognitoSub: 'cognito-sub-015',
      email: 'nicolas@test.com',
      firstName: 'Nicolas',
      lastName: 'Cardenas',
      password: defaultPassword,
      bio: 'Ingeniero de sistemas, trabajo hibrido. Me gusta el rock en español y las plantas.',
      seekingMode: 'ROOMMATE',
      age: 27,
      occupation: 'Ingeniero de sistemas',
      nationality: 'Colombiana',
      gender: 'MALE',
      preferences: {
        lookingFor: ['ROOMMATE', 'SHARE_EXPENSES'],
        myTraits: { worksOutside: true, schedule: 'AFTERNOON', hasPets: false, hasChildren: false, smokes: false, drinks: 'SOCIALLY', hasFrequentVisitors: false, cleanliness: 'CLEAN', personality: ['CALM', 'SOCIAL'] },
        idealRoommate: { schedulePreference: 'ANY', petsOk: true, childrenOk: false, smokingOk: false, drinkingOk: true, visitorsOk: true, cleanlinessPreference: 'CLEAN', personalityPreference: ['CALM', 'SOCIAL'], ageRange: { min: 22, max: 35 }, genderPreference: ['ANY'] },
      },
    },
  });

  const user16 = await prisma.user.create({
    data: {
      cognitoSub: 'cognito-sub-016',
      email: 'mariana@test.com',
      firstName: 'Mariana',
      lastName: 'Duque',
      password: defaultPassword,
      bio: 'Venezolana recien llegada, trabajo en consultoria. Busco gente amable y buen ambiente.',
      seekingMode: 'ROOMMATE',
      age: 24,
      occupation: 'Consultora',
      nationality: 'Venezolana',
      gender: 'FEMALE',
      preferences: {
        lookingFor: ['ROOMMATE', 'ROOM', 'SHARE_EXPENSES'],
        myTraits: { worksOutside: true, schedule: 'MORNING', hasPets: false, hasChildren: false, smokes: false, drinks: 'SOCIALLY', hasFrequentVisitors: false, cleanliness: 'CLEAN', personality: ['SOCIAL', 'EXTROVERT'] },
        idealRoommate: { schedulePreference: 'ANY', petsOk: true, childrenOk: false, smokingOk: false, drinkingOk: true, visitorsOk: true, cleanlinessPreference: 'ANY', personalityPreference: ['SOCIAL', 'CALM'], ageRange: { min: 20, max: 32 }, genderPreference: ['ANY'] },
      },
    },
  });

  console.log('  Users: 16 created');

  // ============================================================
  // ROOMMATE PROFILES — 14 users seeking roommates
  // (user2 = Maria is NONE / landlord only, no profile needed)
  // ============================================================

  // Julian (user1) — the main test user
  await prisma.roommateProfile.create({
    data: {
      userId: user1.id,
      budget: 1500000,
      preferredCity: 'Bogota',
      preferredNeighborhoods: ['Chapinero', 'Teusaquillo', 'La Soledad'],
      moveInDate: new Date('2026-04-01'),
      bio: 'Desarrollador remoto, tranquilo y ordenado. Me gusta cocinar y ver series. Busco alguien responsable con quien compartir gastos y buena convivencia.',
      occupation: 'Desarrollador de software',
      age: 28,
      lifestyle: {
        smoking: false,
        pets: false,
        schedule: 'flexible',
        cleanliness: 'clean',
        guests: 'sometimes',
      },
    },
  });

  // Carlos (user3)
  await prisma.roommateProfile.create({
    data: {
      userId: user3.id,
      budget: 800000,
      preferredCity: 'Bogota',
      preferredNeighborhoods: ['Chapinero', 'Teusaquillo', 'La Candelaria'],
      moveInDate: new Date('2026-03-15'),
      bio: 'Estudiante de ingenieria, tranquilo y ordenado. Me gustan los videojuegos y cocinar. Busco un roomie chill.',
      occupation: 'Estudiante de ingenieria',
      age: 22,
      lifestyle: {
        smoking: false,
        pets: false,
        schedule: 'night_owl',
        cleanliness: 'clean',
        guests: 'sometimes',
      },
    },
  });

  // Ana (user4)
  await prisma.roommateProfile.create({
    data: {
      userId: user4.id,
      budget: 1200000,
      preferredCity: 'Bogota',
      preferredNeighborhoods: ['Chapinero', 'Usaquen', 'Cedritos'],
      moveInDate: new Date('2026-03-01'),
      bio: 'Diseñadora grafica, me gusta el yoga y salir a correr los fines de semana. Tengo un perrito pequeño.',
      occupation: 'Diseñadora grafica',
      age: 26,
      lifestyle: {
        smoking: false,
        pets: true,
        schedule: 'early_bird',
        cleanliness: 'very_clean',
        guests: 'rarely',
      },
    },
  });

  // Santiago (user5)
  await prisma.roommateProfile.create({
    data: {
      userId: user5.id,
      budget: 1000000,
      preferredCity: 'Bogota',
      preferredNeighborhoods: ['Chapinero', 'La Macarena', 'Teusaquillo'],
      moveInDate: new Date('2026-04-15'),
      bio: 'Chef profesional, horarios rotativos. Mi fortaleza: siempre hay comida buena en la nevera. Busco gente social y buena onda.',
      occupation: 'Chef',
      age: 25,
      lifestyle: {
        smoking: false,
        pets: false,
        schedule: 'night_owl',
        cleanliness: 'moderate',
        guests: 'often',
      },
    },
  });

  // Valentina (user6)
  await prisma.roommateProfile.create({
    data: {
      userId: user6.id,
      budget: 900000,
      preferredCity: 'Bogota',
      preferredNeighborhoods: ['Teusaquillo', 'Chapinero', 'La Candelaria'],
      moveInDate: new Date('2026-03-01'),
      bio: 'Ultimo semestre de medicina, paso mucho tiempo en el hospital. Necesito un lugar tranquilo para descansar. Soy super limpia y responsable.',
      occupation: 'Estudiante de medicina',
      age: 24,
      lifestyle: {
        smoking: false,
        pets: false,
        schedule: 'early_bird',
        cleanliness: 'very_clean',
        guests: 'rarely',
      },
    },
  });

  // Andres (user7)
  await prisma.roommateProfile.create({
    data: {
      userId: user7.id,
      budget: 1400000,
      preferredCity: 'Bogota',
      preferredNeighborhoods: ['Usaquen', 'Chapinero', 'Cedritos'],
      moveInDate: new Date('2026-05-01'),
      bio: 'Trabajo remoto en fintech desde casa. Necesito buena conexion a internet y un espacio tranquilo entre semana. Fines de semana soy gamer y me gusta el cine.',
      occupation: 'Analista financiero',
      age: 27,
      lifestyle: {
        smoking: false,
        pets: false,
        schedule: 'flexible',
        cleanliness: 'clean',
        guests: 'sometimes',
      },
    },
  });

  // Camila (user8)
  await prisma.roommateProfile.create({
    data: {
      userId: user8.id,
      budget: 850000,
      preferredCity: 'Bogota',
      preferredNeighborhoods: ['La Candelaria', 'La Macarena', 'Chapinero'],
      moveInDate: new Date('2026-03-15'),
      bio: 'Musica y artista visual. A veces ensayo en casa (con audifonos!). Busco compañeros creativos y de mente abierta.',
      occupation: 'Musica freelance',
      age: 23,
      lifestyle: {
        smoking: false,
        pets: true,
        schedule: 'night_owl',
        cleanliness: 'moderate',
        guests: 'often',
      },
    },
  });

  // Diego (user9)
  await prisma.roommateProfile.create({
    data: {
      userId: user9.id,
      budget: 1300000,
      preferredCity: 'Bogota',
      preferredNeighborhoods: ['Chapinero', 'Usaquen', 'Rosales'],
      moveInDate: new Date('2026-04-01'),
      bio: 'Abogado en firma de consultoria. Horario de oficina normal. Me gusta el futbol (hincha de Millonarios) y cocinar los domingos.',
      occupation: 'Abogado',
      age: 29,
      lifestyle: {
        smoking: false,
        pets: false,
        schedule: 'early_bird',
        cleanliness: 'clean',
        guests: 'sometimes',
      },
    },
  });

  // Laura (user10)
  await prisma.roommateProfile.create({
    data: {
      userId: user10.id,
      budget: 1100000,
      preferredCity: 'Bogota',
      preferredNeighborhoods: ['Chapinero', 'Usaquen', 'La Soledad'],
      moveInDate: new Date('2026-03-20'),
      bio: 'Trabajo en marketing digital, siempre en reuniones virtuales. Me encanta el cafe especial y los mercados de pulgas. Busco buena energia.',
      occupation: 'Marketing digital',
      age: 26,
      lifestyle: {
        smoking: false,
        pets: false,
        schedule: 'flexible',
        cleanliness: 'clean',
        guests: 'often',
      },
    },
  });

  // Felipe (user11)
  await prisma.roommateProfile.create({
    data: {
      userId: user11.id,
      budget: 1600000,
      preferredCity: 'Bogota',
      preferredNeighborhoods: ['Usaquen', 'Chapinero', 'La Macarena'],
      moveInDate: new Date('2026-05-15'),
      bio: 'Fotografo profesional, viajo bastante por trabajo. Tengo un gato llamado Pixel que es super tranquilo. Busco alguien que le gusten los animales.',
      occupation: 'Fotografo',
      age: 30,
      lifestyle: {
        smoking: false,
        pets: true,
        schedule: 'flexible',
        cleanliness: 'clean',
        guests: 'rarely',
      },
    },
  });

  // Isabella (user12)
  await prisma.roommateProfile.create({
    data: {
      userId: user12.id,
      budget: 1200000,
      preferredCity: 'Bogota',
      preferredNeighborhoods: ['Usaquen', 'Cedritos', 'Santa Barbara'],
      moveInDate: new Date('2026-04-01'),
      bio: 'Nutricionista deportiva, me levanto a las 5am a entrenar. Cocino meal preps los domingos. Busco alguien con estilo de vida saludable.',
      occupation: 'Nutricionista',
      age: 25,
      lifestyle: {
        smoking: false,
        pets: false,
        schedule: 'early_bird',
        cleanliness: 'very_clean',
        guests: 'sometimes',
      },
    },
  });

  // Mateo (user13)
  await prisma.roommateProfile.create({
    data: {
      userId: user13.id,
      budget: 2000000,
      preferredCity: 'Bogota',
      preferredNeighborhoods: ['Usaquen', 'Rosales', 'Chapinero Alto'],
      moveInDate: new Date('2026-03-01'),
      bio: 'Emprendedor tech, mi startup acaba de recibir inversion. Necesito un lugar comodo para trabajar y vivir. Horarios locos pero respetuoso.',
      occupation: 'CEO / Emprendedor',
      age: 31,
      lifestyle: {
        smoking: false,
        pets: false,
        schedule: 'night_owl',
        cleanliness: 'moderate',
        guests: 'sometimes',
      },
    },
  });

  // Daniela (user14)
  await prisma.roommateProfile.create({
    data: {
      userId: user14.id,
      budget: 1100000,
      preferredCity: 'Bogota',
      preferredNeighborhoods: ['Chapinero', 'La Macarena', 'Teusaquillo'],
      moveInDate: new Date('2026-04-15'),
      bio: 'Instructora de yoga argentina viviendo en Colombia. Busco un espacio zen, luminoso y con buena energia. Me encanta cocinar comida vegetariana.',
      occupation: 'Instructora de yoga',
      age: 28,
      lifestyle: {
        smoking: false,
        pets: false,
        schedule: 'early_bird',
        cleanliness: 'very_clean',
        guests: 'rarely',
      },
    },
  });

  // Nicolas (user15)
  await prisma.roommateProfile.create({
    data: {
      userId: user15.id,
      budget: 1300000,
      preferredCity: 'Bogota',
      preferredNeighborhoods: ['Chapinero', 'Teusaquillo', 'Cedritos'],
      moveInDate: new Date('2026-04-01'),
      bio: 'Ingeniero de sistemas, trabajo hibrido (3 dias en oficina, 2 en casa). Me gustan las plantas, el rock en español y las cervezas artesanales.',
      occupation: 'Ingeniero de sistemas',
      age: 27,
      lifestyle: {
        smoking: false,
        pets: false,
        schedule: 'flexible',
        cleanliness: 'clean',
        guests: 'sometimes',
      },
    },
  });

  // Mariana (user16)
  await prisma.roommateProfile.create({
    data: {
      userId: user16.id,
      budget: 950000,
      preferredCity: 'Bogota',
      preferredNeighborhoods: ['Chapinero', 'Teusaquillo', 'La Soledad'],
      moveInDate: new Date('2026-03-10'),
      bio: 'Venezolana recien llegada a Bogota, trabajo en consultoria de RRHH. Busco gente amable, paciente y que me enseñe los mejores lugares de la ciudad.',
      occupation: 'Consultora de RRHH',
      age: 24,
      lifestyle: {
        smoking: false,
        pets: false,
        schedule: 'early_bird',
        cleanliness: 'clean',
        guests: 'sometimes',
      },
    },
  });

  console.log('  Roommate profiles: 14 created');

  // ============================================================
  // PROPERTIES — 12 total across multiple owners
  // ============================================================

  // Maria's properties (she's a landlord — user2)
  const property1 = await prisma.property.create({
    data: {
      ownerId: user2.id,
      title: 'Hermoso apartamento en Chapinero Alto',
      description: 'Amplio apartamento de 3 habitaciones con vista a los cerros orientales. Incluye parqueadero y deposito. Zona tranquila cerca a centros comerciales y transporte publico.',
      propertyType: 'APARTMENT',
      listingType: 'RENT',
      price: 2500000,
      currency: 'COP',
      bedrooms: 3,
      bathrooms: 2,
      area: 85,
      address: 'Calle 63 #7-20',
      city: 'Bogota',
      neighborhood: 'Chapinero Alto',
      department: 'Bogota D.C.',
      latitude: 4.6486,
      longitude: -74.0628,
      amenities: ['wifi', 'parking', 'security', 'elevator', 'hot_water'],
    },
  });

  const property2 = await prisma.property.create({
    data: {
      ownerId: user2.id,
      title: 'Estudio moderno en Usaquen',
      description: 'Estudio completamente amoblado y equipado en la mejor zona de Usaquen. Perfecto para profesionales independientes. A dos cuadras del parque de Usaquen.',
      propertyType: 'STUDIO',
      listingType: 'RENT',
      price: 1800000,
      currency: 'COP',
      bedrooms: 1,
      bathrooms: 1,
      area: 45,
      address: 'Carrera 6 #119-12',
      city: 'Bogota',
      neighborhood: 'Usaquen',
      department: 'Bogota D.C.',
      latitude: 4.6952,
      longitude: -74.0308,
      amenities: ['wifi', 'furnished', 'security', 'hot_water', 'laundry'],
    },
  });

  const property3 = await prisma.property.create({
    data: {
      ownerId: user2.id,
      title: 'Habitacion privada en Teusaquillo',
      description: 'Habitacion amoblada en apartamento compartido. Zona universitaria, excelente transporte. Servicios incluidos. Ideal para estudiantes o profesionales jovenes.',
      propertyType: 'ROOM',
      listingType: 'RENT',
      price: 900000,
      currency: 'COP',
      bedrooms: 1,
      bathrooms: 1,
      area: 18,
      address: 'Calle 39 #17-45',
      city: 'Bogota',
      neighborhood: 'Teusaquillo',
      department: 'Bogota D.C.',
      latitude: 4.6280,
      longitude: -74.0760,
      amenities: ['wifi', 'furnished', 'laundry', 'hot_water'],
    },
  });

  // Julian's property (user1)
  await prisma.property.create({
    data: {
      ownerId: user1.id,
      title: 'Casa familiar en Envigado',
      description: 'Hermosa casa de dos pisos con jardin y terraza. Barrio tranquilo y familiar. Cerca a colegios y supermercados. Ideal para familias.',
      propertyType: 'HOUSE',
      listingType: 'SALE',
      price: 450000000,
      currency: 'COP',
      bedrooms: 4,
      bathrooms: 3,
      area: 180,
      address: 'Calle 38 Sur #27-15',
      city: 'Medellin',
      neighborhood: 'Envigado',
      department: 'Antioquia',
      latitude: 6.1673,
      longitude: -75.5843,
      amenities: ['parking', 'pets_allowed', 'balcony', 'hot_water'],
    },
  });

  // Carlos's properties (user3)
  const property5 = await prisma.property.create({
    data: {
      ownerId: user3.id,
      title: 'Apartamento acogedor en La Candelaria',
      description: 'Apartamento restaurado en el centro historico de Bogota. Techos altos, pisos en madera. Cerca a museos, universidades y vida cultural.',
      propertyType: 'APARTMENT',
      listingType: 'RENT',
      price: 1400000,
      currency: 'COP',
      bedrooms: 2,
      bathrooms: 1,
      area: 60,
      address: 'Carrera 2 #12-50',
      city: 'Bogota',
      neighborhood: 'La Candelaria',
      department: 'Bogota D.C.',
      latitude: 4.5964,
      longitude: -74.0703,
      amenities: ['wifi', 'hot_water', 'security'],
    },
  });

  await prisma.property.create({
    data: {
      ownerId: user3.id,
      title: 'Estudio en el Poblado',
      description: 'Estudio moderno y luminoso en el corazon del Poblado. Zona rosa a pocas cuadras. Edificio con piscina, gimnasio y seguridad 24 horas.',
      propertyType: 'STUDIO',
      listingType: 'RENT',
      price: 2200000,
      currency: 'COP',
      bedrooms: 1,
      bathrooms: 1,
      area: 40,
      address: 'Carrera 43A #6-50',
      city: 'Medellin',
      neighborhood: 'El Poblado',
      department: 'Antioquia',
      latitude: 6.2086,
      longitude: -75.5695,
      amenities: ['wifi', 'gym', 'pool', 'security', 'elevator', 'air_conditioning', 'furnished'],
    },
  });

  // Ana's properties (user4)
  const property7 = await prisma.property.create({
    data: {
      ownerId: user4.id,
      title: 'Apartamento con vista al mar en Bocagrande',
      description: 'Espectacular apartamento frente al mar en Bocagrande. Vista panoramica, brisa marina, acabados de lujo.',
      propertyType: 'APARTMENT',
      listingType: 'RENT',
      price: 3500000,
      currency: 'COP',
      bedrooms: 2,
      bathrooms: 2,
      area: 75,
      address: 'Avenida San Martin #5-120',
      city: 'Cartagena',
      neighborhood: 'Bocagrande',
      department: 'Bolivar',
      latitude: 10.3978,
      longitude: -75.5553,
      amenities: ['wifi', 'pool', 'security', 'elevator', 'air_conditioning', 'balcony', 'gym'],
    },
  });

  await prisma.property.create({
    data: {
      ownerId: user4.id,
      title: 'Casa campestre en Chia',
      description: 'Casa campestre con amplio jardin y zona BBQ. Ambiente tranquilo a las afueras de Bogota.',
      propertyType: 'HOUSE',
      listingType: 'RENT',
      price: 3200000,
      currency: 'COP',
      bedrooms: 3,
      bathrooms: 3,
      area: 200,
      address: 'Vereda Fonqueta Km 2',
      city: 'Chia',
      neighborhood: 'Fonqueta',
      department: 'Cundinamarca',
      latitude: 4.8627,
      longitude: -74.0540,
      amenities: ['parking', 'pets_allowed', 'hot_water', 'laundry', 'balcony'],
    },
  });

  await prisma.property.create({
    data: {
      ownerId: user4.id,
      title: 'Habitacion en apartamento compartido en Cedritos',
      description: 'Habitacion amplia y luminosa en apartamento compartido. Cerca a estacion de TransMilenio.',
      propertyType: 'ROOM',
      listingType: 'RENT',
      price: 750000,
      currency: 'COP',
      bedrooms: 1,
      bathrooms: 1,
      area: 15,
      address: 'Calle 140 #13-50',
      city: 'Bogota',
      neighborhood: 'Cedritos',
      department: 'Bogota D.C.',
      latitude: 4.7215,
      longitude: -74.0425,
      amenities: ['wifi', 'laundry', 'hot_water', 'security'],
    },
  });

  // Mateo's properties (user13 — entrepreneur, also rents)
  await prisma.property.create({
    data: {
      ownerId: user13.id,
      title: 'Loft industrial en el Parkway',
      description: 'Loft con diseño industrial, doble altura y terraza privada. Zona bohemia con cafes y restaurantes. Ideal para creativos.',
      propertyType: 'APARTMENT',
      listingType: 'RENT',
      price: 2800000,
      currency: 'COP',
      bedrooms: 1,
      bathrooms: 1,
      area: 70,
      address: 'Calle 36 #24-10',
      city: 'Bogota',
      neighborhood: 'La Soledad',
      department: 'Bogota D.C.',
      latitude: 4.6245,
      longitude: -74.0735,
      amenities: ['wifi', 'furnished', 'hot_water', 'balcony'],
    },
  });

  // Felipe's property (user11)
  await prisma.property.create({
    data: {
      ownerId: user11.id,
      title: 'Apartaestudio en Santa Barbara',
      description: 'Apartaestudio luminoso con excelente ubicacion en Santa Barbara. Cerca a centro comercial Unicentro y estacion de TransMilenio.',
      propertyType: 'STUDIO',
      listingType: 'RENT',
      price: 1600000,
      currency: 'COP',
      bedrooms: 1,
      bathrooms: 1,
      area: 35,
      address: 'Carrera 15 #116-05',
      city: 'Bogota',
      neighborhood: 'Santa Barbara',
      department: 'Bogota D.C.',
      latitude: 4.6950,
      longitude: -74.0430,
      amenities: ['wifi', 'security', 'elevator', 'laundry', 'hot_water'],
    },
  });

  // Santiago's property (user5)
  await prisma.property.create({
    data: {
      ownerId: user5.id,
      title: 'Habitacion con baño privado en La Macarena',
      description: 'Habitacion con baño privado en casa compartida. Zona cultural, cerca al Museo Nacional y la Carrera Septima. Cocina compartida equipada.',
      propertyType: 'ROOM',
      listingType: 'RENT',
      price: 1050000,
      currency: 'COP',
      bedrooms: 1,
      bathrooms: 1,
      area: 20,
      address: 'Carrera 5 #26-35',
      city: 'Bogota',
      neighborhood: 'La Macarena',
      department: 'Bogota D.C.',
      latitude: 4.6115,
      longitude: -74.0635,
      amenities: ['wifi', 'furnished', 'hot_water', 'laundry'],
    },
  });

  console.log('  Properties: 12 created');

  // ============================================================
  // SWIPES — Julian (user1) has already swiped some people
  // ============================================================

  // Julian LIKED Ana (user4) — she also liked him → MATCH!
  await prisma.swipe.create({
    data: { senderId: user1.id, receiverId: user4.id, action: 'LIKE' },
  });
  await prisma.swipe.create({
    data: { senderId: user4.id, receiverId: user1.id, action: 'LIKE' },
  });

  // Julian LIKED Andres (user7) — no reciprocal yet
  await prisma.swipe.create({
    data: { senderId: user1.id, receiverId: user7.id, action: 'LIKE' },
  });

  // Julian PASSED on Camila (user8)
  await prisma.swipe.create({
    data: { senderId: user1.id, receiverId: user8.id, action: 'PASS' },
  });

  // Carlos LIKED Valentina (user6) — she also liked him → MATCH!
  await prisma.swipe.create({
    data: { senderId: user3.id, receiverId: user6.id, action: 'LIKE' },
  });
  await prisma.swipe.create({
    data: { senderId: user6.id, receiverId: user3.id, action: 'LIKE' },
  });

  // Santiago LIKED Laura (user10) — she also liked him → MATCH!
  await prisma.swipe.create({
    data: { senderId: user5.id, receiverId: user10.id, action: 'LIKE' },
  });
  await prisma.swipe.create({
    data: { senderId: user10.id, receiverId: user5.id, action: 'LIKE' },
  });

  // Andres LIKED Julian (user1) — Julian already liked Andres → MATCH!
  await prisma.swipe.create({
    data: { senderId: user7.id, receiverId: user1.id, action: 'LIKE' },
  });

  // Some one-way likes (pending, no match yet)
  await prisma.swipe.create({
    data: { senderId: user9.id, receiverId: user1.id, action: 'LIKE' },
  });
  await prisma.swipe.create({
    data: { senderId: user14.id, receiverId: user1.id, action: 'LIKE' },
  });
  await prisma.swipe.create({
    data: { senderId: user10.id, receiverId: user1.id, action: 'LIKE' },
  });
  await prisma.swipe.create({
    data: { senderId: user12.id, receiverId: user15.id, action: 'LIKE' },
  });
  await prisma.swipe.create({
    data: { senderId: user16.id, receiverId: user14.id, action: 'LIKE' },
  });

  console.log('  Swipes: 14 created');

  // ============================================================
  // MATCHES — created from reciprocal likes above
  // ============================================================

  // Julian ↔ Ana match
  const [matchUser1a, matchUser2a] = [user1.id, user4.id].sort();
  const match1 = await prisma.match.create({
    data: { user1Id: matchUser1a, user2Id: matchUser2a },
  });

  // Julian ↔ Andres match
  const [matchUser1b, matchUser2b] = [user1.id, user7.id].sort();
  const match2 = await prisma.match.create({
    data: { user1Id: matchUser1b, user2Id: matchUser2b },
  });

  // Carlos ↔ Valentina match
  const [matchUser1c, matchUser2c] = [user3.id, user6.id].sort();
  const match3 = await prisma.match.create({
    data: { user1Id: matchUser1c, user2Id: matchUser2c },
  });

  // Santiago ↔ Laura match
  const [matchUser1d, matchUser2d] = [user5.id, user10.id].sort();
  await prisma.match.create({
    data: { user1Id: matchUser1d, user2Id: matchUser2d },
  });

  console.log('  Matches: 4 created');

  // Suppress unused-variable warnings for matches used only in logging
  void match3;

  // ============================================================
  // CONVERSATIONS — auto-created for each match
  // ============================================================

  const convo1 = await prisma.conversation.create({
    data: { participant1Id: matchUser1a, participant2Id: matchUser2a },
  });

  const convo2 = await prisma.conversation.create({
    data: { participant1Id: matchUser1b, participant2Id: matchUser2b },
  });

  await prisma.conversation.create({
    data: { participant1Id: matchUser1c, participant2Id: matchUser2c },
  });

  await prisma.conversation.create({
    data: { participant1Id: matchUser1d, participant2Id: matchUser2d },
  });

  console.log('  Conversations: 4 created');

  // ============================================================
  // MESSAGES — some initial chat messages
  // ============================================================

  // Julian ↔ Ana conversation
  await prisma.message.create({
    data: {
      conversationId: convo1.id,
      senderId: user4.id,
      content: '¡Hola Julian! Vi que tambien buscas en Chapinero, que chevere!',
    },
  });
  await prisma.message.create({
    data: {
      conversationId: convo1.id,
      senderId: user1.id,
      content: '¡Hola Ana! Si, me encanta la zona. Tienes algun lugar en mente?',
    },
  });
  await prisma.message.create({
    data: {
      conversationId: convo1.id,
      senderId: user4.id,
      content: 'Estoy viendo unos apartamentos en Chapinero Alto, cerca al Parque de la 93. Te interesaria ir a ver alguno juntos?',
    },
  });

  // Julian ↔ Andres conversation
  await prisma.message.create({
    data: {
      conversationId: convo2.id,
      senderId: user1.id,
      content: 'Hey Andres! Vi que tambien trabajas remoto, podriamos buscar algo con buen internet.',
    },
  });
  await prisma.message.create({
    data: {
      conversationId: convo2.id,
      senderId: user7.id,
      content: 'Parcero! Si, eso es clave. Estoy viendo opciones en Usaquen, te parece?',
    },
  });

  // Update last message timestamps
  await prisma.conversation.update({
    where: { id: convo1.id },
    data: { lastMessageAt: new Date() },
  });
  await prisma.conversation.update({
    where: { id: convo2.id },
    data: { lastMessageAt: new Date() },
  });

  console.log('  Messages: 5 created');

  // ============================================================
  // RATINGS
  // ============================================================

  await prisma.rating.create({
    data: {
      raterId: user1.id,
      ratedUserId: user2.id,
      context: 'LANDLORD',
      score: 5,
      comment: 'Excelente arrendadora, muy responsable y atenta con el mantenimiento.',
    },
  });

  await prisma.rating.create({
    data: {
      raterId: user2.id,
      ratedUserId: user1.id,
      context: 'TENANT',
      score: 4,
      comment: 'Buen inquilino, siempre paga a tiempo.',
    },
  });

  await prisma.rating.create({
    data: {
      raterId: user3.id,
      ratedUserId: user4.id,
      context: 'ROOMMATE',
      score: 5,
      comment: 'Ana es la mejor roomie, super ordenada y buena onda.',
    },
  });

  console.log('  Ratings: 3 created');

  // ============================================================
  // PROPERTY VIEWS
  // ============================================================

  await prisma.propertyView.create({ data: { userId: user1.id, propertyId: property1.id } });
  await prisma.propertyView.create({ data: { userId: user1.id, propertyId: property2.id } });
  await prisma.propertyView.create({ data: { userId: user1.id, propertyId: property7.id } });
  await prisma.propertyView.create({ data: { userId: user3.id, propertyId: property1.id } });
  await prisma.propertyView.create({ data: { userId: user3.id, propertyId: property7.id } });
  await prisma.propertyView.create({ data: { userId: user4.id, propertyId: property5.id } });
  await prisma.propertyView.create({ data: { userId: user7.id, propertyId: property2.id } });
  await prisma.propertyView.create({ data: { userId: user10.id, propertyId: property3.id } });

  console.log('  Property views: 8 created');

  // ============================================================
  // APPLICATIONS + WORKFLOW STAGES
  // ============================================================

  // 1. Pending application (Julian → Maria's studio in Usaquen)
  await prisma.application.create({
    data: {
      propertyId: property2.id,
      applicantId: user1.id,
      message: 'Hola, me interesa mucho el estudio. Soy profesional y tengo referencias.',
      status: 'PENDING',
    },
  });

  // 2. Accepted + SCHEDULING stage (Ana → Carlos' apt in La Candelaria)
  const appScheduling = await prisma.application.create({
    data: {
      propertyId: property5.id,
      applicantId: user4.id,
      message: 'Me encanta la ubicacion, quisiera agendar una visita.',
      status: 'ACCEPTED',
    },
  });

  // Create appointment in SCHEDULING status with slots from both parties
  const aptScheduling = await prisma.appointment.create({
    data: { applicationId: appScheduling.id, status: 'SCHEDULING' },
  });
  // Landlord slots (Carlos - user3)
  await prisma.availabilitySlot.create({
    data: {
      appointmentId: aptScheduling.id,
      userId: user3.id,
      startTime: new Date('2026-03-10T10:00:00'),
      endTime: new Date('2026-03-10T12:00:00'),
    },
  });
  await prisma.availabilitySlot.create({
    data: {
      appointmentId: aptScheduling.id,
      userId: user3.id,
      startTime: new Date('2026-03-11T14:00:00'),
      endTime: new Date('2026-03-11T17:00:00'),
    },
  });
  // Tenant slots (Ana - user4)
  await prisma.availabilitySlot.create({
    data: {
      appointmentId: aptScheduling.id,
      userId: user4.id,
      startTime: new Date('2026-03-10T11:00:00'),
      endTime: new Date('2026-03-10T13:00:00'),
    },
  });

  // 3. Accepted + COMPLETED visit + documents (Valentina → Maria's room in Teusaquillo)
  const appDocuments = await prisma.application.create({
    data: {
      propertyId: property3.id,
      applicantId: user6.id,
      message: 'Soy estudiante de medicina, responsable y ordenada. Me interesa la habitacion.',
      status: 'ACCEPTED',
    },
  });

  // Appointment completed
  await prisma.appointment.create({
    data: {
      applicationId: appDocuments.id,
      status: 'COMPLETED',
      confirmedStart: new Date('2026-02-20T10:00:00'),
      confirmedEnd: new Date('2026-02-20T11:00:00'),
      confirmedById: user2.id,
    },
  });
  // Documents: CC approved, WORK_CERT pending
  await prisma.document.create({
    data: {
      applicationId: appDocuments.id,
      uploadedById: user6.id,
      type: 'CC',
      status: 'APPROVED',
      fileKey: 'documents/seed/cc-valentina.jpg',
      fileName: 'cedula_valentina.jpg',
      fileSize: 245000,
      mimeType: 'image/jpeg',
    },
  });
  await prisma.document.create({
    data: {
      applicationId: appDocuments.id,
      uploadedById: user6.id,
      type: 'WORK_CERT',
      status: 'PENDING',
      fileKey: 'documents/seed/work-cert-valentina.pdf',
      fileName: 'certificado_laboral.pdf',
      fileSize: 180000,
      mimeType: 'application/pdf',
    },
  });

  // 4. Full workflow complete — Lease ACTIVE (Diego → Ana's apt in Bocagrande)
  const appLease = await prisma.application.create({
    data: {
      propertyId: property7.id,
      applicantId: user9.id,
      message: 'Me interesa el apartamento en Bocagrande para una temporada larga.',
      status: 'ACCEPTED',
    },
  });

  await prisma.appointment.create({
    data: {
      applicationId: appLease.id,
      status: 'COMPLETED',
      confirmedStart: new Date('2026-02-01T15:00:00'),
      confirmedEnd: new Date('2026-02-01T16:00:00'),
      confirmedById: user4.id,
    },
  });
  await prisma.document.create({
    data: {
      applicationId: appLease.id,
      uploadedById: user9.id,
      type: 'CC',
      status: 'APPROVED',
      fileKey: 'documents/seed/cc-diego.jpg',
      fileName: 'cedula_diego.jpg',
      fileSize: 230000,
      mimeType: 'image/jpeg',
    },
  });
  await prisma.document.create({
    data: {
      applicationId: appLease.id,
      uploadedById: user9.id,
      type: 'WORK_CERT',
      status: 'APPROVED',
      fileKey: 'documents/seed/work-cert-diego.pdf',
      fileName: 'certificado_laboral_diego.pdf',
      fileSize: 195000,
      mimeType: 'application/pdf',
    },
  });
  await prisma.lease.create({
    data: {
      applicationId: appLease.id,
      tenantId: user9.id,
      propertyId: property7.id,
      startDate: new Date('2026-03-01'),
      endDate: new Date('2027-03-01'),
      monthlyRent: 3500000,
      status: 'ACTIVE',
      signedAt: new Date('2026-02-15'),
    },
  });

  console.log('  Applications: 4 created (1 pending, 1 scheduling, 1 documents, 1 lease)');
  console.log('  Appointments: 3 created');
  console.log('  Availability slots: 3 created');
  console.log('  Documents: 4 created');
  console.log('  Leases: 1 created');

  // ============================================================
  // SUMMARY
  // ============================================================
  console.log('\nSeed data created successfully!');
  console.log('  Users: 16 (login with any email + password123)');
  console.log('    julian@test.com  — ROOMMATE seeker (main test user)');
  console.log('    maria@test.com   — Landlord (NONE)');
  console.log('    carlos@test.com  — ROOMMATE seeker');
  console.log('    ana@test.com     — ROOMMATE seeker');
  console.log('    santiago@test.com — ROOMMATE seeker');
  console.log('    valentina@test.com — ROOMMATE seeker');
  console.log('    andres@test.com  — ROOMMATE seeker');
  console.log('    camila@test.com  — ROOMMATE seeker');
  console.log('    diego@test.com   — ROOMMATE seeker');
  console.log('    laura@test.com   — ROOMMATE seeker');
  console.log('    felipe@test.com  — ROOMMATE seeker');
  console.log('    isabella@test.com — ROOMMATE seeker');
  console.log('    mateo@test.com   — ROOMMATE seeker');
  console.log('    daniela@test.com — ROOMMATE seeker');
  console.log('    nicolas@test.com — ROOMMATE seeker');
  console.log('    mariana@test.com — ROOMMATE seeker');
  console.log('  Properties: 12');
  console.log('  Roommate profiles: 14');
  console.log('  Swipes: 14');
  console.log('  Matches: 4');
  console.log('  Conversations: 4 (with messages)');
  console.log('  Messages: 5');
  console.log('  Ratings: 3');
  console.log('  Property views: 8');
  console.log('  Workflow:');
  console.log('    App 1: julian→maria (PENDING)');
  console.log('    App 2: ana→carlos (ACCEPTED, scheduling with slots)');
  console.log('    App 3: valentina→maria (ACCEPTED, visit done, uploading docs)');
  console.log('    App 4: diego→ana (ACCEPTED, full workflow, lease ACTIVE)');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
