import { useState } from 'react'
import { X, Plus, Mail } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { inviteMember } from '@/services/inviteService'
import { useAuth } from '@/contexts/AuthContext'

interface InviteMembersDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onInvitesSent?: () => void
}

export function InviteMembersDialog({ open, onOpenChange, onInvitesSent }: InviteMembersDialogProps) {
  const { user } = useAuth()
  const [emails, setEmails] = useState<string[]>([''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAddEmail = () => {
    setEmails([...emails, ''])
  }

  const handleRemoveEmail = (index: number) => {
    setEmails(emails.filter((_, i) => i !== index))
  }

  const handleEmailChange = (index: number, value: string) => {
    const newEmails = [...emails]
    newEmails[index] = value
    setEmails(newEmails)
  }

  const handleInvite = async () => {
    if (!user?.organizationId) return

    setLoading(true)
    setError(null)

    try {
      // Filter out empty emails and remove duplicates
      const validEmails = Array.from(new Set(emails.filter(email => email.trim())))
      
      if (validEmails.length === 0) {
        throw new Error('Please enter at least one email address')
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      const invalidEmails = validEmails.filter(email => !emailRegex.test(email))
      if (invalidEmails.length > 0) {
        throw new Error(`Invalid email format: ${invalidEmails.join(', ')}`)
      }

      // Send invites
      await Promise.all(
        validEmails.map(email =>
          inviteMember({
            email,
            organizationId: user.organizationId!,
            invitedBy: user.uid,
            role: 'member'
          })
        )
      )

      // Reset form and close dialog
      setEmails([''])
      onInvitesSent?.()
      onOpenChange(false)
    } catch (err) {
      console.error('Error inviting members:', err)
      setError(err instanceof Error ? err.message : 'Failed to send invites')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Invite Members</DialogTitle>
          <DialogDescription className="text-gray-500">
            Invite people to join your workspace
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 bg-white">
          {emails.map((email, index) => (
            <div key={index} className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  type="email"
                  placeholder="colleague@company.com"
                  value={email}
                  onChange={(e) => handleEmailChange(index, e.target.value)}
                  className="pl-10"
                />
                <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
              {index === emails.length - 1 ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddEmail}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleRemoveEmail(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-100 p-3 rounded-md">
            <div className="flex gap-2 items-center">
              <X className="h-4 w-4" />
              <span>{error}</span>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 mt-6 bg-white">
          <Button
            variant="outline"
            onClick={() => {
              setEmails([''])
              setError(null)
              onOpenChange(false)
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleInvite}
            disabled={loading || emails.every(email => !email.trim())}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Sending...
              </div>
            ) : (
              'Send Invites'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 