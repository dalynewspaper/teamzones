import { VideoDetailContent } from '@/components/video/VideoDetailContent'

export const dynamic = 'force-dynamic'

export default function VideoDetailPage({ params }: { params: { id: string } }) {
  return <VideoDetailContent videoId={params.id} />
} 