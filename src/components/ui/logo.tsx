'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

interface LogoProps {
  className?: string
  linkClassName?: string
  showLink?: boolean
}

export function Logo({ className = '', linkClassName = '', showLink = true }: LogoProps) {
  const LogoContent = () => (
    <motion.h1 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`text-2xl font-bold text-[#4263EB] ${className}`}
    >
      OpenAsync
    </motion.h1>
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