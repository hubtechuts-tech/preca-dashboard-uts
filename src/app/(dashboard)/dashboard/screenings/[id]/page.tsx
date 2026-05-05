/**
 * Screening Detail Page
 *
 * View and manage a single screening request
 */

import { ScreeningDetail } from '@/components/dashboard/screenings/ScreeningDetail'

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default async function ScreeningDetailPage({ params }: PageProps) {
  const { id } = await params
  return <ScreeningDetail screeningId={id} />
}
