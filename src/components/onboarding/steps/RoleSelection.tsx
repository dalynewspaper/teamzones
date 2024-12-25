'use client'
import { useState } from 'react'
import { useOnboarding } from '../../../contexts/OnboardingContext'
import { UserIcon, UsersIcon, ShieldCheckIcon } from 'lucide-react'
import React from 'react'

const roles = [
  {
    id: 'member',
    title: 'Team Member',
    description: 'Record updates and collaborate with your team',
    icon: UserIcon
  },
  {
    id: 'lead',
    title: 'Team Lead',
    description: 'Manage team goals and review updates',
    icon: UsersIcon
  },
  {
    id: 'admin',
    title: 'Administrator',
    description: 'Full control over team settings and permissions',
    icon: ShieldCheckIcon
  }
]

export function RoleSelection() {
  const { completeStep } = useOnboarding()
  const [selectedRole, setSelectedRole] = useState<string | null>(null)

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Select your role</h3>
        <p className="text-sm text-gray-500">Choose how you'll be using TeamZones</p>
      </div>

      <div className="space-y-3">
        {roles.map((role) => (
          <button
            key={role.id}
            onClick={() => {
              setSelectedRole(role.id)
              completeStep('team')
            }}
            className="w-full p-4 text-left rounded-lg border hover:border-blue-600"
          >
            <div className="flex items-start gap-3">
              <role.icon className="w-5 h-5 mt-0.5 text-blue-600" />
              <div>
                <div className="font-medium">{role.title}</div>
                <div className="text-sm text-gray-500">{role.description}</div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
} 