import { BrainDumpForm } from '@/components/capture/brain-dump-form'

export default function CapturePage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Brain Dump</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Suelta lo que tienes en la cabeza. La IA lo clasifica automáticamente.
        </p>
      </div>

      <BrainDumpForm />
    </div>
  )
}
