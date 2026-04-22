import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Travel Planner',
    short_name: 'Travel Planner',
    description: 'Travel Planner built with Next.js App Router and MUI',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#F5F7FA',
    icons: [
      {
        src: '/icons/icon-192.svg',
        sizes: '192x192',
        type: 'image/svg+xml',
      },
      {
        src: '/icons/icon-512.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
      },
    ],
  };
}
