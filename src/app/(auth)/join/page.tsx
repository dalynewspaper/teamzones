'use client'

import { redirect } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { JoinWorkspace } from '@/components/auth/JoinWorkspace'
import { motion } from 'framer-motion'
import { Users, Building2, ArrowRight, Video, Clock, MessageSquare } from 'lucide-react'
import { useSearchParams } from 'next/navigation'

export default function JoinPage() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const org = searchParams.get('org')
  const inviter = searchParams.get('inviter')
  const { user, loading } = useAuth()

  if (!token) {
    redirect('/')
  }

  // If user is authenticated, attempt to join the workspace
  if (user) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 to-white">
        {/* Background Pattern */}
        <div className="fixed inset-0 -z-10">
          <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/5 to-transparent" />
        </div>

        <div className="container flex items-center justify-center min-h-screen py-12">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <JoinWorkspace token={token} />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  // If user is not authenticated, show sign in/sign up options
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 to-white">
      {/* Background Pattern */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/5 to-transparent" />
      </div>

      <div className="container flex items-center justify-center min-h-screen py-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mx-auto w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6"
            >
              <Users className="w-10 h-10 text-blue-600" />
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-3xl font-bold text-gray-900 mb-2"
            >
              {inviter && org 
                ? `${inviter} invited you to join the ${org} workspace`
                : "You're invited to join a workspace"}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-lg text-gray-600 mt-3"
            >
              Join your team on OpenAsync, the platform for seamless asynchronous collaboration
            </motion.p>
          </div>

          <Card className="border-2 border-blue-100">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl">Transform how you work together</CardTitle>
              <CardDescription className="text-base">
                Experience the future of remote collaboration with your team
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900 mb-3">What you'll get with OpenAsync</h3>
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <Video className="w-5 h-5 mr-3 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-gray-900">Async Video Updates</h4>
                      <p className="text-sm text-gray-500">Share updates and ideas through quick video messages, perfect for remote teams</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <Clock className="w-5 h-5 mr-3 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-gray-900">Flexible Communication</h4>
                      <p className="text-sm text-gray-500">Work across time zones without scheduling meetings or disrupting focus time</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <MessageSquare className="w-5 h-5 mr-3 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-gray-900">Rich Collaboration</h4>
                      <p className="text-sm text-gray-500">Comment, react, and collaborate on video updates with your team</p>
                    </div>
                  </li>
                </ul>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-base"
                  onClick={() => {
                    const redirectUrl = `/join?token=${token}&org=${org || ''}&inviter=${inviter || ''}`
                    window.location.href = `/signin?redirect=${encodeURIComponent(redirectUrl)}&token=${token}&org=${encodeURIComponent(org || '')}&inviter=${encodeURIComponent(inviter || '')}`
                  }}
                >
                  <span>Continue with existing account</span>
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <p className="text-center text-sm text-gray-500 mt-4">
                  New to OpenAsync?{' '}
                  <button
                    className="text-blue-600 hover:text-blue-700 font-medium"
                    onClick={() => {
                      const redirectUrl = `/join?token=${token}&org=${org || ''}&inviter=${inviter || ''}`
                      window.location.href = `/signup?redirect=${encodeURIComponent(redirectUrl)}&token=${token}&org=${encodeURIComponent(org || '')}&inviter=${encodeURIComponent(inviter || '')}`
                    }}
                  >
                    Create your account
                  </button>
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
} 