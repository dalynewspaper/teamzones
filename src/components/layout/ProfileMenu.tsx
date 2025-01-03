'use client'
import { Fragment } from 'react'
import { Menu, Transition } from '@headlessui/react'
import { useAuth } from '@/contexts/AuthContext'
import Image from 'next/image'
import { UserCircleIcon } from '@heroicons/react/24/solid'
import { SignOutButton } from '@/components/auth/SignOutButton'

export function ProfileMenu() {
  const { user } = useAuth()

  return (
    <Menu as="div" className="relative">
      <Menu.Button className="flex rounded-full bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
        {user?.photoURL ? (
          <Image
            className="h-8 w-8 rounded-full"
            src={user.photoURL}
            alt=""
            width={32}
            height={32}
          />
        ) : (
          <UserCircleIcon className="h-8 w-8 text-gray-400" />
        )}
      </Menu.Button>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="px-4 py-2 text-sm text-gray-700">
            {user?.email}
          </div>
          <Menu.Item>
            {({ active }) => (
              <div className={`${active ? 'bg-gray-100' : ''} block w-full px-4 py-2 text-left`}>
                <SignOutButton />
              </div>
            )}
          </Menu.Item>
        </Menu.Items>
      </Transition>
    </Menu>
  )
} 