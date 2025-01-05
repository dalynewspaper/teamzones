'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'

interface LogoProps {
  className?: string
  linkClassName?: string
  showLink?: boolean
}

export function Logo({ className = '', linkClassName = '', showLink = true }: LogoProps) {
  const LogoContent = () => (
    <div className={className}>
      <Image 
        src="/logo.svg" 
        alt="OpenAsync" 
        width={62} 
        height={12} 
        className="w-auto h-6"
        priority
      />
    </div>
  )

  if (!showLink) {
    return <LogoContent />
  }

  return (
    <Link href="/" className={`inline-block group ${linkClassName}`}>
      <LogoContent />
    </Link>
  )
} 