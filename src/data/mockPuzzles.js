// src/data/mockPuzzles.js
import { INITIAL_USERS } from './mockUsers';

const userById = Object.fromEntries(INITIAL_USERS.map((u) => [u.id, u]));

const RAW_PUZZLES = [
  {
    id: 'p1',
    userId: 'u1',
    distanceKm: 0,
    title: 'Bosque de Otoño 1000p',
    pieces: 1000,
    status: 'Completo (100% garantizado)',
    image: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=600&q=80',
    images: [
      'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80'
    ],
    description: 'Armado una sola vez y guardado por bolsas. Caja sana y sin golpes.'
  },
  {
    id: 'p2',
    userId: 'u1',
    distanceKm: 0,
    title: 'Librería Vintage 500p',
    pieces: 500,
    status: 'Completo (100% garantizado)',
    image: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=600&q=80',
    images: [
      'https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80'
    ],
    description: 'Ideal para un fin de semana tranquilo. Piezas firmes y bien encastradas.'
  },
  {
    id: 'p3',
    userId: 'u2',
    distanceKm: 2,
    title: 'Atardecer en la Montaña 1000p',
    pieces: 1000,
    status: 'Completo (100% garantizado)',
    image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80',
    images: [
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1439066615861-d1af74d74000?auto=format&fit=crop&w=600&q=80'
    ],
    description: 'Paisaje de alta montaña armado la semana pasada. Todas las piezas contadas.'
  },
  {
    id: 'p4',
    userId: 'u3',
    distanceKm: 13,
    title: 'Mapa Antiguo del Mundo 2000p',
    pieces: 2000,
    status: 'Completo (2000/2000)',
    image: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=600&q=80',
    images: [
      'https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=600&q=80'
    ],
    description: 'Buen desafío de 2000 piezas. Cartón grueso y caja en excelente estado.'
  },
  {
    id: 'p5',
    userId: 'u4',
    distanceKm: 28,
    title: 'Noche Estrellada - Arte Clásico 1000p',
    pieces: 1000,
    status: 'Completo (1000/1000)',
    image: 'https://encrypted-tbn3.gstatic.com/shopping?q=tbn:ANd9GcS1CRCim_X9HdXzbHuHU4MHjwEg_ugPDQFavsC1pfTxsus2vc-sJKNyKkTdWqR9sy6VtpSyHj-42IGnc4CrxNW9ao2tE6k-N-aVVEVlmQwBNbA0JZ5N7OgSfJG0tP4aCdDW2XSe4A&usqp=CAc',
    images: [
      'https://encrypted-tbn3.gstatic.com/shopping?q=tbn:ANd9GcS1CRCim_X9HdXzbHuHU4MHjwEg_ugPDQFavsC1pfTxsus2vc-sJKNyKkTdWqR9sy6VtpSyHj-42IGnc4CrxNW9ao2tE6k-N-aVVEVlmQwBNbA0JZ5N7OgSfJG0tP4aCdDW2XSe4A&usqp=CAc',
      'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=600&q=80'
    ],
    description: 'Clásico exigente por los tonos azules y amarillos. Piezas embolsadas.'
  },
  {
    id: 'p6',
    userId: 'u5',
    distanceKm: 14,
    title: 'Jardín Botánico en Flor 1000p',
    pieces: 1000,
    status: 'Completo (100% garantizado)',
    image: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=600&q=80',
    images: [
      'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80'
    ],
    description: 'Colores muy vivos, sin rayones en la superficie. Ideal para cambiar.'
  },
  {
    id: 'p7',
    userId: 'u6',
    distanceKm: 16,
    title: 'Faro en la Costa Norte 500p',
    pieces: 500,
    status: 'Completo (500/500)',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
    images: [
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1439066615861-d1af74d74000?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80'
    ],
    description: 'Aire marino y cielo despejado. Caja sin roturas.'
  },
  {
    id: 'p8',
    userId: 'u7',
    distanceKm: 29,
    title: 'Callejón Europeo al Atardecer 2000p',
    pieces: 2000,
    status: 'Completo (2000/2000)',
    image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=600&q=80',
    images: [
      'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=600&q=80'
    ],
    description: 'Bastante detalle arquitectónico. Listo para otro armador paciente.'
  },
  {
    id: 'p9',
    userId: 'u8',
    distanceKm: 1.5,
    title: 'Cabaña en el Valle Nevado 1000p',
    pieces: 1000,
    status: 'Completo (100% garantizado)',
    image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80',
    images: [
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=600&q=80'
    ],
    description: 'Lo armamos en familia el mes pasado. Todo completo y en orden.'
  },
  {
    id: 'p10',
    userId: 'u9',
    distanceKm: 12,
    title: 'Tren en las Tierras Altas 1000p',
    pieces: 1000,
    status: 'Completo (1000/1000)',
    image: 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?auto=format&fit=crop&w=600&q=80',
    images: [
      'https://images.unsplash.com/photo-1474487548417-781cb71495f3?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80'
    ],
    description: 'Viaducto y paisaje verde muy entretenido de armar.'
  },
  {
    id: 'p11',
    userId: 'u10',
    distanceKm: 22,
    title: 'Ciudad de Noche con Luces 3000p',
    pieces: 3000,
    status: 'Completo (3000/3000)',
    image: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=600&q=80',
    images: [
      'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?auto=format&fit=crop&w=600&q=80'
    ],
    description: 'Para quienes buscan un proyecto largo. Caja grande en buen estado.'
  },
  {
    id: 'p12',
    userId: 'u3',
    distanceKm: 13,
    title: 'Café de Barrio y Flores 500p',
    pieces: 500,
    status: 'Completo (500/500)',
    image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80',
    images: [
      'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=600&q=80'
    ],
    description: 'Rápido y agradable de armar. Sin piezas dobladas.'
  },
  {
    id: 'p13',
    userId: 'u5',
    distanceKm: 14,
    title: 'Lago Alpino al Amanecer 1000p',
    pieces: 1000,
    status: 'Completo (1000/1000)',
    image: 'https://images.unsplash.com/photo-1439066615861-d1af74d74000?auto=format&fit=crop&w=600&q=80',
    images: [
      'https://images.unsplash.com/photo-1439066615861-d1af74d74000?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80'
    ],
    description: 'Reflejos en el agua y pinos. Muy buen encastre.'
  },
  {
    id: 'p14',
    userId: 'u7',
    distanceKm: 29,
    title: 'Sendero de Bosques y Niebla 500p',
    pieces: 500,
    status: 'Falta 1 pieza (avisado)',
    image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=600&q=80',
    images: [
      'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=600&q=80'
    ],
    description: 'Lo aclaro antes de cambiar: le falta una pieza del borde superior, el resto está impecable.'
  },
  {
    id: 'p15',
    userId: 'u9',
    distanceKm: 12,
    title: 'Observatorio Bajo las Estrellas 1000p',
    pieces: 1000,
    status: 'Completo (1000/1000)',
    image: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?auto=format&fit=crop&w=600&q=80',
    images: [
      'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=600&q=80'
    ],
    description: 'Cielo nocturno y vía láctea. Armado una sola vez y guardado con cuidado.'
  }
];

export const INITIAL_PUZZLES = RAW_PUZZLES.map((p) => {
  const owner = userById[p.userId];
  return {
    ...p,
    userName: owner?.name ?? 'Usuario',
    city: owner?.city ?? '',
    lat: owner?.lat,
    lon: owner?.lon,
    images: (p.images ?? [p.image]).filter(Boolean).slice(0, 3)
  };
});