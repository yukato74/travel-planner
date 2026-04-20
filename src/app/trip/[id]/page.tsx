import { notFound } from 'next/navigation';
import { TripDetailView } from '@/components/trip/TripDetailView';
import { buildTripShareUrl, findTripById } from '@/lib/trips/service';

type TripDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function TripDetailPage({ params }: TripDetailPageProps) {
  const { id } = await params;
  const trip = findTripById(id);

  if (!trip) {
    notFound();
  }

  return <TripDetailView trip={trip} shareUrl={buildTripShareUrl(trip.id)} />;
}
