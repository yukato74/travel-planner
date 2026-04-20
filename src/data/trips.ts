import { Trip } from '@/lib/types/trip';

export const trips: Trip[] = [
  {
    id: 'tokyo-weekend',
    title: 'Tokyo Weekend Trip',
    startDate: '2026-05-15',
    endDate: '2026-05-17',
    summary: '渋谷・浅草・上野を中心に回る2泊3日の旅行。',
    share: {
      enabled: true,
      requiresPassword: true,
      password: 'A7K2Q9',
    },
    itinerary: [
      {
        id: 'it-1',
        date: '2026-05-15',
        title: '渋谷周辺',
        description: '午前は渋谷スクランブル周辺、午後は表参道へ。',
      },
      {
        id: 'it-2',
        date: '2026-05-16',
        title: '浅草と上野',
        description: '浅草寺を訪問後、上野公園と美術館へ。',
      },
    ],
    flights: [
      {
        id: 'fl-1',
        direction: 'outbound',
        airline: 'ANA',
        flightNumber: 'NH412',
        departure: '2026-05-15 08:10 KIX',
        arrival: '2026-05-15 09:20 HND',
      },
      {
        id: 'fl-2',
        direction: 'return',
        airline: 'ANA',
        flightNumber: 'NH421',
        departure: '2026-05-17 19:10 HND',
        arrival: '2026-05-17 20:25 KIX',
      },
    ],
    hotels: [
      {
        id: 'ho-1',
        name: 'Shibuya Urban Hotel',
        checkIn: '2026-05-15',
        checkOut: '2026-05-17',
        address: '東京都渋谷区桜丘町1-2-3',
      },
    ],
    places: [
      {
        id: 'pl-1',
        name: '浅草寺',
        area: '台東区',
        memo: '朝早めに行くと比較的空いている。',
      },
      {
        id: 'pl-2',
        name: '東京国立博物館',
        area: '上野',
        memo: '特別展の事前チケット確認。',
      },
      {
        id: 'pl-3',
        name: '渋谷スカイ',
        area: '渋谷',
      },
    ],
    notes: [
      {
        id: 'no-1',
        content: '交通系ICの残高を事前にチャージしておく。',
      },
      {
        id: 'no-2',
        content: '雨天時は室内プランに切り替える。',
      },
    ],
  },
  {
    id: 'fukuoka-food-tour',
    title: 'Fukuoka Food Tour',
    startDate: '2026-06-10',
    endDate: '2026-06-13',
    summary: '博多・天神エリアのグルメ中心プラン。',
    share: {
      enabled: true,
      requiresPassword: false,
    },
    itinerary: [
      {
        id: 'it-3',
        date: '2026-06-10',
        title: '博多ラーメン巡り',
        description: '中洲周辺の人気店を中心に回る。',
      },
    ],
    flights: [
      {
        id: 'fl-3',
        direction: 'outbound',
        airline: 'JAL',
        flightNumber: 'JL2051',
        departure: '2026-06-10 09:00 ITM',
        arrival: '2026-06-10 10:20 FUK',
      },
    ],
    hotels: [
      {
        id: 'ho-2',
        name: 'Hakata Riverside Inn',
        checkIn: '2026-06-10',
        checkOut: '2026-06-13',
        address: '福岡県福岡市博多区住吉2-3-4',
      },
    ],
    places: [
      {
        id: 'pl-4',
        name: '太宰府天満宮',
        area: '太宰府',
      },
      {
        id: 'pl-5',
        name: 'キャナルシティ博多',
        area: '博多',
      },
    ],
    notes: [
      {
        id: 'no-3',
        content: '夜は屋台エリアを優先。',
      },
    ],
  },
];
