import { PageLoading } from '@/components/ui/loading-spinner'

export default function ClubLoading() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 grid-pattern flex items-center justify-center">
      <PageLoading 
        title="Loading Club" 
        description="Fetching club data..."
      />
    </div>
  )
}

