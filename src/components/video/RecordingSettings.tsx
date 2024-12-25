import { Sheet, SheetContent, SheetHeader, SheetTitle } from "../ui/sheet";
import { Switch } from "../ui/switch";

interface RecordingSettingsProps {
  resolution: '720p' | '1080p'
  setResolution: (resolution: '720p' | '1080p') => void
  layout: 'camera' | 'screen' | 'pip'
  setLayout: (layout: 'camera' | 'screen' | 'pip') => void
  backgroundBlur: boolean
  setBackgroundBlur: (enabled: boolean) => void
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RecordingSettings({
  resolution,
  setResolution,
  layout,
  setLayout,
  backgroundBlur,
  setBackgroundBlur,
  open,
  onOpenChange
}: RecordingSettingsProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Recording Settings</SheetTitle>
        </SheetHeader>
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Resolution</label>
            <select 
              value={resolution} 
              onChange={(e) => setResolution(e.target.value as '720p' | '1080p')}
              className="w-full p-2 rounded border bg-white"
            >
              <option value="720p">720p</option>
              <option value="1080p">1080p</option>
            </select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Layout</label>
            <select 
              value={layout} 
              onChange={(e) => setLayout(e.target.value as 'camera' | 'screen' | 'pip')}
              className="w-full p-2 rounded border bg-white"
            >
              <option value="camera">Camera Only</option>
              <option value="screen">Screen Only</option>
              <option value="pip">Picture in Picture</option>
            </select>
          </div>
          
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Background Blur</label>
            <Switch 
              checked={backgroundBlur} 
              onCheckedChange={setBackgroundBlur}
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
} 