import { Sheet, SheetContent, SheetHeader, SheetTitle } from "../ui/sheet";
import { Switch } from "../ui/switch";

interface RecordingSettingsProps {
  resolution: '720p' | '1080p' | '4k'
  setResolution: (resolution: '720p' | '1080p' | '4k') => void
  layout: 'camera' | 'screen' | 'pip'
  setLayout: (layout: 'camera' | 'screen' | 'pip') => void
  backgroundBlur: boolean
  setBackgroundBlur: (enabled: boolean) => void
  devices: Array<{ deviceId: string; label: string }>
  selectedDeviceId: string
  setSelectedDeviceId: (deviceId: string) => void
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
  devices,
  selectedDeviceId,
  setSelectedDeviceId,
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
            <label className="text-sm font-medium">Camera</label>
            <select 
              value={selectedDeviceId} 
              onChange={(e) => setSelectedDeviceId(e.target.value)}
              className="w-full p-2 rounded border bg-white"
            >
              {devices.map((device) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Resolution</label>
            <select 
              value={resolution} 
              onChange={(e) => setResolution(e.target.value as '720p' | '1080p' | '4k')}
              className="w-full p-2 rounded border bg-white"
            >
              <option value="720p">720p (HD)</option>
              <option value="1080p">1080p (Full HD)</option>
              <option value="4k">4K (Ultra HD)</option>
            </select>
            <p className="text-xs text-gray-500">
              Higher resolutions require more processing power and storage space
            </p>
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
            <p className="text-xs text-gray-500">
              PiP mode shows both your camera and screen recording
            </p>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Background Blur</label>
              <Switch 
                checked={backgroundBlur} 
                onCheckedChange={setBackgroundBlur}
              />
            </div>
            <p className="text-xs text-gray-500">
              Blur your background for a more professional look
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
} 