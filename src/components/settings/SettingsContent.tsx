'use client'

import { useState, useEffect } from 'react'
import { Camera, Bell, Globe, Building2, User, Upload, CreditCard, Users, BarChart, Palette, Link as LinkIcon, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import Image from 'next/image'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { db } from '@/lib/firebase'
import { doc, collection, addDoc, updateDoc, getDoc } from 'firebase/firestore'
import { getOrganizationSettings } from '@/services/settingsService'

interface Tab {
  id: string
  label: string
  icon: any
  content?: React.ReactNode
}

export function SettingsContent() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('my-account')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [personalSettings, setPersonalSettings] = useState({
    firstName: user?.displayName?.split(' ')[0] || '',
    lastName: user?.displayName?.split(' ').slice(1).join(' ') || '',
    email: user?.email || '',
    photoURL: user?.photoURL || '',
    notifications: {
      email: true,
      desktop: true,
      mobile: true
    },
    recordingQuality: '720p',
    theme: 'light' as 'light' | 'dark' | 'system'
  })

  const [orgSettings, setOrgSettings] = useState({
    name: '',
    domain: '',
    logo: '',
    weekStartDay: '1'
  })

  // Load personal settings
  useEffect(() => {
    async function loadSettings() {
      if (!user?.uid) return

      try {
        const userRef = doc(db, 'users', user.uid)
        const userDoc = await getDoc(userRef)
        
        if (userDoc.exists()) {
          const data = userDoc.data()
          setPersonalSettings(prev => ({
            ...prev,
            firstName: data.firstName || user.displayName?.split(' ')[0] || '',
            lastName: data.lastName || user.displayName?.split(' ').slice(1).join(' ') || '',
            photoURL: data.photoURL || user.photoURL || '',
            notifications: data.settings?.notifications || prev.notifications,
            recordingQuality: data.settings?.recordingQuality || prev.recordingQuality,
            theme: data.settings?.theme || prev.theme
          }))
        }
      } catch (err) {
        console.error('Error loading personal settings:', err)
        setError('Failed to load personal settings')
      }
    }

    loadSettings()
  }, [user])

  // Load organization settings
  useEffect(() => {
    async function loadSettings() {
      if (!user?.organizationId) return

      try {
        const settings = await getOrganizationSettings(user.organizationId)
        if (settings) {
          const companyName = settings.domain.split('.')[0].charAt(0).toUpperCase() + settings.domain.split('.')[0].slice(1)
          setOrgSettings({
            ...settings,
            name: settings.name || companyName
          })
        }
      } catch (err) {
        console.error('Error loading organization settings:', err)
        setError('Failed to load organization settings')
      }
    }

    loadSettings()
  }, [user?.organizationId])

  const handleSaveWorkspaceSettings = async () => {
    if (!user?.organizationId) return
    
    setLoading(true)
    try {
      // Update organization document in Firestore
      const orgRef = doc(db, 'organizations', user.organizationId)
      await updateDoc(orgRef, {
        name: orgSettings.name,
        domain: orgSettings.domain,
        settings: {
          weekStartDay: orgSettings.weekStartDay
        },
        updatedAt: new Date().toISOString()
      })

      // Update local state
      setError(null)
      
      // In development/emulator, refresh to see changes
      if (window.location.hostname === 'localhost') {
        window.location.reload()
      }
    } catch (err) {
      console.error('Failed to update workspace settings:', err)
      setError('Failed to save workspace settings. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false)
  const [workspaceLoading, setWorkspaceLoading] = useState(false)

  const handlePersonalSettingsSave = async () => {
    if (!user?.uid) return
    
    setLoading(true)
    try {
      // Update user document in Firestore
      const userRef = doc(db, 'users', user.uid)
      await updateDoc(userRef, {
        firstName: personalSettings.firstName,
        lastName: personalSettings.lastName,
        displayName: `${personalSettings.firstName} ${personalSettings.lastName}`.trim(),
        photoURL: personalSettings.photoURL,
        settings: {
          notifications: personalSettings.notifications,
          recordingQuality: personalSettings.recordingQuality,
          theme: personalSettings.theme
        }
      })

      // Update local state
      setError(null)
      
      // Refresh the page to update the user context
      // In production, you might want to update the context directly instead
      if (window.location.hostname === 'localhost') {
        window.location.reload()
      }
    } catch (err) {
      console.error('Failed to update personal settings:', err)
      setError('Failed to update settings. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateWorkspace = async () => {
    if (!user?.uid) return
    
    setWorkspaceLoading(true)
    try {
      // Create new workspace
      const workspaceRef = await addDoc(collection(db, 'organizations'), {
        name: orgSettings.name,
        domain: orgSettings.domain,
        ownerId: user.uid,
        createdAt: new Date().toISOString(),
        members: [user.uid]
      })

      // Update user with organization ID
      const userRef = doc(db, 'users', user.uid)
      await updateDoc(userRef, {
        organizationId: workspaceRef.id
      })

      // Refresh user context or page
      window.location.reload()
    } catch (err) {
      console.error('Failed to create workspace:', err)
      setError('Failed to create workspace. Please try again.')
    } finally {
      setWorkspaceLoading(false)
    }
  }

  const tabs: Tab[] = [
    {
      id: 'my-account',
      label: 'My Account',
      icon: User,
      content: (
        <div className="space-y-8">
          <section>
            <h2 className="text-lg font-semibold mb-4">Name and photos</h2>
            <div className="flex items-start gap-8">
              <div className="relative">
                {personalSettings.photoURL ? (
                  <Image
                    src={personalSettings.photoURL}
                    alt="Profile"
                    width={96}
                    height={96}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center">
                    <User className="w-12 h-12 text-gray-400" />
                  </div>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute bottom-0 right-0 rounded-full w-8 h-8 p-0"
                >
                  <Camera className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex-1 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">First name</label>
                    <Input
                      value={personalSettings.firstName}
                      onChange={(e) => setPersonalSettings(s => ({ ...s, firstName: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Last name</label>
                    <Input
                      value={personalSettings.lastName}
                      onChange={(e) => setPersonalSettings(s => ({ ...s, lastName: e.target.value }))}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    value={personalSettings.email}
                    disabled
                    className="bg-gray-50"
                  />
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-4">Push notifications</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Email notifications</p>
                  <p className="text-sm text-gray-500">Get notified about team updates via email</p>
                </div>
                <Switch
                  checked={personalSettings.notifications.email}
                  onCheckedChange={(checked) => 
                    setPersonalSettings(s => ({
                      ...s,
                      notifications: { ...s.notifications, email: checked }
                    }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Desktop notifications</p>
                  <p className="text-sm text-gray-500">Get notified about team updates on your desktop</p>
                </div>
                <Switch
                  checked={personalSettings.notifications.desktop}
                  onCheckedChange={(checked) => 
                    setPersonalSettings(s => ({
                      ...s,
                      notifications: { ...s.notifications, desktop: checked }
                    }))
                  }
                />
              </div>
            </div>
          </section>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
              {error}
            </div>
          )}

          <div className="flex justify-end">
            <Button 
              onClick={handlePersonalSettingsSave}
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      )
    },
    {
      id: 'recording',
      label: 'Recording',
      icon: Camera,
      content: (
        <div className="space-y-8">
          <section>
            <h2 className="text-lg font-semibold mb-4">Recording Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Default Recording Quality</label>
                <select 
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  value={personalSettings.recordingQuality}
                  onChange={(e) => setPersonalSettings(s => ({ ...s, recordingQuality: e.target.value }))}
                >
                  <option value="720p">720p</option>
                  <option value="1080p">1080p</option>
                </select>
              </div>
            </div>
          </section>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
              {error}
            </div>
          )}

          <div className="flex justify-end">
            <Button 
              onClick={handlePersonalSettingsSave}
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      )
    },
    {
      id: 'workspace',
      label: 'Workspace',
      icon: Building2,
      content: (
        <div className="space-y-8">
          {!user?.organizationId ? (
            <div className="max-w-md mx-auto py-8">
              <div className="text-center mb-8">
                <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Workspace</h3>
                <p className="text-sm text-gray-500 mb-6">
                  Create a new workspace or join an existing one.
                </p>
                <Button
                  onClick={() => setIsCreatingWorkspace(true)}
                  className="w-full justify-center"
                >
                  Create New Workspace
                </Button>
              </div>

              {isCreatingWorkspace && (
                <div className="space-y-6 border rounded-lg p-6">
                  <h4 className="font-medium">Create Workspace</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Workspace Name</label>
                      <Input
                        value={orgSettings.name}
                        onChange={(e) => setOrgSettings(s => ({ ...s, name: e.target.value }))}
                        placeholder="Enter workspace name"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Workspace Domain</label>
                      <Input
                        value={orgSettings.domain}
                        onChange={(e) => setOrgSettings(s => ({ ...s, domain: e.target.value }))}
                        placeholder="example.com"
                      />
                      <p className="mt-1 text-sm text-gray-500">
                        Used to verify team members
                      </p>
                    </div>
                    <div className="flex justify-end gap-3">
                      <Button
                        variant="outline"
                        onClick={() => setIsCreatingWorkspace(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleCreateWorkspace}
                        disabled={workspaceLoading || !orgSettings.name || !orgSettings.domain}
                      >
                        {workspaceLoading ? 'Creating...' : 'Create Workspace'}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">or</span>
                </div>
              </div>

              <div className="text-center">
                <h4 className="text-sm font-medium mb-2">Join Existing Workspace</h4>
                <p className="text-sm text-gray-500 mb-4">
                  Ask your workspace admin for an invitation link
                </p>
              </div>
            </div>
          ) : (
            <>
              <section>
                <h2 className="text-lg font-semibold mb-4">Workspace Settings</h2>
                <div className="max-w-md space-y-6">
                  <div>
                    <label className="text-sm font-medium">Workspace Name</label>
                    <Input
                      value={orgSettings.name}
                      onChange={(e) => setOrgSettings(s => ({ ...s, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Workspace Domain</label>
                    <Input
                      value={orgSettings.domain}
                      onChange={(e) => setOrgSettings(s => ({ ...s, domain: e.target.value }))}
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Used to verify team members
                    </p>
                  </div>
                  <Button
                    onClick={handleSaveWorkspaceSettings}
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </section>
            </>
          )}
        </div>
      )
    },
    {
      id: 'billing',
      label: 'Plan & Billing',
      icon: CreditCard
    },
    {
      id: 'members',
      label: 'Members',
      icon: Users,
      content: (
        <div className="space-y-8">
          <section>
            <h2 className="text-lg font-semibold mb-4">Teams</h2>
            <div className="space-y-6">
              {!user?.organizationId ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Teams Available</h3>
                  <p className="text-sm text-gray-500">
                    You need to be part of a workspace to manage teams.
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-sm font-medium">Teams</h3>
                      <p className="text-sm text-gray-500">Manage your workspace teams</p>
                    </div>
                    <Button onClick={() => {/* TODO: Implement create team */}}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Team
                    </Button>
                  </div>

                  <div className="border rounded-lg divide-y">
                    <div className="p-4 flex items-center justify-between bg-gray-50">
                      <div className="flex items-center gap-3">
                        <Users className="h-5 w-5 text-gray-400" />
                        <div>
                          <h4 className="text-sm font-medium">General</h4>
                          <p className="text-xs text-gray-500">Company-wide team for all members</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">Default</span>
                      </div>
                    </div>
                    {/* TODO: List other teams here */}
                  </div>
                </>
              )}
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-4">Workspace Members</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-medium">Members</h3>
                  <p className="text-sm text-gray-500">People with access to your workspace</p>
                </div>
                <Button onClick={() => {/* TODO: Implement invite members */}}>
                  <Plus className="h-4 w-4 mr-2" />
                  Invite Members
                </Button>
              </div>

              {/* TODO: List workspace members here */}
            </div>
          </section>
        </div>
      )
    },
    {
      id: 'insights',
      label: 'Insights',
      icon: BarChart
    },
    {
      id: 'appearance',
      label: 'Appearance',
      icon: Palette
    },
    {
      id: 'integrations',
      label: 'Integrations',
      icon: LinkIcon
    }
  ]

  return (
    <div className="flex-1 overflow-auto bg-gray-50 py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex gap-8">
          {/* Sidebar Navigation */}
          <div className="w-64 flex-shrink-0">
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-md ${
                      activeTab === tab.id
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {tab.label}
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 bg-white rounded-lg border p-8">
            {tabs.find(tab => tab.id === activeTab)?.content}
          </div>
        </div>
      </div>
    </div>
  )
} 