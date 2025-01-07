import { useState } from 'react'
import { X, Plus, Mail, Link, Copy, Check } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { inviteMember, generateInviteLink } from '@/services/inviteService'
import { useAuth } from '@/contexts/AuthContext'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

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
  const [inviteLink, setInviteLink] = useState<string | null>(null)
  const [linkCopied, setLinkCopied] = useState(false)
  const [activeTab, setActiveTab] = useState<'email' | 'link'>('email')

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

  const handleGenerateLink = async () => {
    if (!user?.organizationId) return

    setLoading(true)
    setError(null)

    try {
      const link = await generateInviteLink(user.organizationId, user.uid)
      setInviteLink(link)
    } catch (err) {
      console.error('Error generating invite link:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate invite link')
    } finally {
      setLoading(false)
    }
  }

  const handleCopyLink = async () => {
    if (!inviteLink) return

    try {
      await navigator.clipboard.writeText(inviteLink)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    } catch (err) {
      console.error('Error copying link:', err)
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

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'email' | 'link')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Via Email
            </TabsTrigger>
            <TabsTrigger value="link" className="flex items-center gap-2">
              <Link className="h-4 w-4" />
              Via Link
            </TabsTrigger>
          </TabsList>

          <TabsContent value="email" className="space-y-4 py-4">
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
          </TabsContent>

          <TabsContent value="link" className="space-y-4 py-4">
            <div className="space-y-4">
              {inviteLink ? (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      value={inviteLink}
                      readOnly
                      className="bg-gray-50"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyLink}
                      className="flex items-center gap-2"
                    >
                      {linkCopied ? (
                        <>
                          <Check className="h-4 w-4" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-sm text-gray-500">
                    This link will expire in 7 days. Anyone with this link can join your workspace.
                  </p>
                </div>
              ) : (
                <Button
                  onClick={handleGenerateLink}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Generating...
                    </div>
                  ) : (
                    <>
                      <Link className="h-4 w-4 mr-2" />
                      Generate Invite Link
                    </>
                  )}
                </Button>
              )}
            </div>
          </TabsContent>
        </Tabs>

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
              setInviteLink(null)
              onOpenChange(false)
            }}
          >
            Cancel
          </Button>
          {activeTab === 'email' && (
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
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
} 