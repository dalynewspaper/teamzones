'use client'

import { useAuth } from '@/contexts/AuthContext'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Video, Goal, Brain, Clock, CheckCircle2, Users, LineChart, Sparkles, ArrowRight, Play } from 'lucide-react'
import Image from 'next/image'

export default function Home() {
  const { user, loading } = useAuth()
  const { scrollYProgress } = useScroll()
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0])
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95])

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#4263EB]"></div>
      </div>
    )
  }

  // Only redirect after loading is complete
  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Gradient Background */}
      <div className="fixed inset-0 -z-10 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_100%_200px,#4263EB0A,transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_0%_800px,#4263EB0A,transparent)]" />
      </div>

      {/* Header */}
      <header className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link 
              href="/" 
              className="flex items-center"
            >
              <Image 
                src="/logo.svg" 
                alt="OpenAsync" 
                width={40} 
                height={40} 
                className="w-auto h-10"
              />
            </Link>
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/features" className="text-gray-600 hover:text-gray-900">Features</Link>
              <Link href="/pricing" className="text-gray-600 hover:text-gray-900">Pricing</Link>
              <Link href="/about" className="text-gray-600 hover:text-gray-900">About</Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/signin">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href="/signup">
                <Button className="bg-[#4263EB] hover:bg-[#3b5bdb] text-white">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="mt-16">
        {/* Hero Section */}
        <section className="relative pt-32 pb-16 overflow-hidden">
          <motion.div 
            style={{ opacity, scale }}
            className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="relative z-10 text-center"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="inline-block"
              >
                <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-sm text-blue-600 mb-8">
                  <Sparkles className="h-4 w-4 mr-2" />
                  <span>Introducing AI-Powered Team Alignment</span>
                </div>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="text-5xl sm:text-7xl font-bold tracking-tight max-w-4xl mx-auto"
              >
                <span className="text-[#1F2937] block mb-2">Stay Aligned,</span>
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#4263EB] to-[#3b5bdb]">
                  Anytime, Anywhere.
                </span>
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="mt-8 text-xl text-gray-600 max-w-2xl mx-auto"
              >
                OpenAsync brings your team together with async video updates, AI-driven goal alignment, and intelligent summaries—so you can focus on what truly matters.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="mt-10 flex flex-col sm:flex-row justify-center gap-4 items-center"
              >
                <Link href="/signup">
                  <Button 
                    size="lg"
                    className="h-12 px-8 bg-[#4263EB] hover:bg-[#3b5bdb] text-white group relative overflow-hidden"
                  >
                    <span className="relative z-10">Get Started Free</span>
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-700 opacity-0 group-hover:opacity-100 transition-opacity"
                      initial={false}
                      animate={{ scale: 1.5 }}
                      transition={{ repeat: Infinity, duration: 2 }}
                    />
                  </Button>
                </Link>
                <Link href="/demo">
                  <Button 
                    size="lg"
                    variant="outline"
                    className="h-12 px-8 border-2 group"
                  >
                    <Play className="mr-2 h-4 w-4 transition-transform group-hover:scale-110" />
                    Watch Demo
                  </Button>
                </Link>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                className="mt-12 flex flex-wrap justify-center items-center gap-8 text-sm text-gray-600"
              >
                <div className="flex items-center">
                  <Sparkles className="h-4 w-4 text-[#4263EB] mr-2" />
                  <span>AI-Powered</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle2 className="h-4 w-4 text-[#4263EB] mr-2" />
                  <span>Enterprise Ready</span>
                </div>
                <div className="flex items-center">
                  <Users className="h-4 w-4 text-[#4263EB] mr-2" />
                  <span>Team Focused</span>
                </div>
              </motion.div>
            </motion.div>

            {/* Hero Image */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.7 }}
              className="relative mt-20 px-6"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent z-10" />
              <div className="relative rounded-xl overflow-hidden shadow-2xl border border-gray-200/50">
                <Image
                  src="/dashboard-preview.png"
                  alt="OpenAsync Dashboard"
                  width={1200}
                  height={675}
                  className="w-full"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/5 via-transparent to-transparent" />
              </div>
            </motion.div>
          </motion.div>
        </section>

        {/* Key Features Section */}
        <section className="py-24 bg-gradient-to-b from-white to-gray-50/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl font-bold tracking-tight mb-4">Everything you need to keep your team aligned</h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Powerful features designed to help your team stay connected, focused, and productive.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Async Video Updates */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                whileHover={{ y: -5 }}
                className="relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-2xl transform group-hover:scale-105 transition-transform duration-300" />
                <div className="relative bg-white/80 backdrop-blur-sm p-8 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all">
                  <div className="h-12 w-12 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Video className="h-6 w-6 text-[#4263EB]" />
                  </div>
                  <h3 className="text-xl font-semibold mb-4">Async Video Updates</h3>
                  <ul className="space-y-3 text-gray-600">
                    <li className="flex items-start">
                      <CheckCircle2 className="h-5 w-5 text-[#4263EB] mr-2 mt-0.5 flex-shrink-0" />
                      <span>Record and share video updates at your convenience</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle2 className="h-5 w-5 text-[#4263EB] mr-2 mt-0.5 flex-shrink-0" />
                      <span>Review team progress on your own schedule</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle2 className="h-5 w-5 text-[#4263EB] mr-2 mt-0.5 flex-shrink-0" />
                      <span>Engage with comments and reactions for real-time collaboration</span>
                    </li>
                  </ul>
                </div>
              </motion.div>

              {/* AI-Driven Goal Alignment */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                whileHover={{ y: -5 }}
                className="relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-2xl transform group-hover:scale-105 transition-transform duration-300" />
                <div className="relative bg-white/80 backdrop-blur-sm p-8 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all">
                  <div className="h-12 w-12 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Goal className="h-6 w-6 text-[#4263EB]" />
                  </div>
                  <h3 className="text-xl font-semibold mb-4">AI-Driven Goal Alignment</h3>
                  <ul className="space-y-3 text-gray-600">
                    <li className="flex items-start">
                      <CheckCircle2 className="h-5 w-5 text-[#4263EB] mr-2 mt-0.5 flex-shrink-0" />
                      <span>Automatically align team goals with weekly priorities</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle2 className="h-5 w-5 text-[#4263EB] mr-2 mt-0.5 flex-shrink-0" />
                      <span>Get personalized suggestions for setting and refining objectives</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle2 className="h-5 w-5 text-[#4263EB] mr-2 mt-0.5 flex-shrink-0" />
                      <span>Ensure no task or responsibility falls through the cracks</span>
                    </li>
                  </ul>
                </div>
              </motion.div>

              {/* Intelligent Summaries */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                whileHover={{ y: -5 }}
                className="relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-2xl transform group-hover:scale-105 transition-transform duration-300" />
                <div className="relative bg-white/80 backdrop-blur-sm p-8 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all">
                  <div className="h-12 w-12 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Brain className="h-6 w-6 text-[#4263EB]" />
                  </div>
                  <h3 className="text-xl font-semibold mb-4">Intelligent Summaries</h3>
                  <ul className="space-y-3 text-gray-600">
                    <li className="flex items-start">
                      <CheckCircle2 className="h-5 w-5 text-[#4263EB] mr-2 mt-0.5 flex-shrink-0" />
                      <span>AI-powered insights on team activities</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle2 className="h-5 w-5 text-[#4263EB] mr-2 mt-0.5 flex-shrink-0" />
                      <span>Clear summaries of what's being worked on and needs attention</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle2 className="h-5 w-5 text-[#4263EB] mr-2 mt-0.5 flex-shrink-0" />
                      <span>Stay informed about progress, blockers, and priorities</span>
                    </li>
                  </ul>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_50%_-100px,#4263EB0A,transparent)]" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl font-bold tracking-tight mb-4">How It Works</h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Get started in minutes and transform how your team collaborates
              </p>
            </motion.div>
            
            <div className="relative">
              {/* Connection Line */}
              <div className="absolute top-24 left-1/2 h-[calc(100%-6rem)] w-px bg-gradient-to-b from-blue-200 to-transparent md:hidden" />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
                {/* Step 1 */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="relative"
                >
                  <div className="text-center">
                    <div className="relative mx-auto mb-6 group">
                      <div className="absolute inset-0 bg-blue-100 rounded-full blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
                      <div className="relative h-16 w-16 bg-gradient-to-br from-[#4263EB] to-blue-600 rounded-full flex items-center justify-center mx-auto transform group-hover:scale-110 transition-transform">
                        <Video className="h-8 w-8 text-white" />
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold mb-3">1. Record Video Updates</h3>
                    <p className="text-gray-600">Share what you're working on at your convenience, keeping everyone in the loop without disrupting their flow.</p>
                  </div>
                </motion.div>

                {/* Step 2 */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="relative"
                >
                  <div className="text-center">
                    <div className="relative mx-auto mb-6 group">
                      <div className="absolute inset-0 bg-blue-100 rounded-full blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
                      <div className="relative h-16 w-16 bg-gradient-to-br from-[#4263EB] to-blue-600 rounded-full flex items-center justify-center mx-auto transform group-hover:scale-110 transition-transform">
                        <Goal className="h-8 w-8 text-white" />
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold mb-3">2. Set Goals with AI Assistance</h3>
                    <p className="text-gray-600">Let OpenAsync suggest, align, and refine team objectives using advanced AI to ensure everyone is moving in the same direction.</p>
                  </div>
                </motion.div>

                {/* Step 3 */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                  className="relative"
                >
                  <div className="text-center">
                    <div className="relative mx-auto mb-6 group">
                      <div className="absolute inset-0 bg-blue-100 rounded-full blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
                      <div className="relative h-16 w-16 bg-gradient-to-br from-[#4263EB] to-blue-600 rounded-full flex items-center justify-center mx-auto transform group-hover:scale-110 transition-transform">
                        <Clock className="h-8 w-8 text-white" />
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold mb-3">3. Get Weekly Summaries</h3>
                    <p className="text-gray-600">Receive AI-generated summaries of team progress, key achievements, and focus areas, helping you stay informed without the meeting fatigue.</p>
                  </div>
                </motion.div>
              </div>

              {/* Preview Image */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.7 }}
                className="mt-16"
              >
                <div className="relative rounded-xl overflow-hidden shadow-2xl border border-gray-200/50">
                  <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/5 via-transparent to-transparent" />
                  <Image
                    src="/workflow-preview.png"
                    alt="OpenAsync Workflow"
                    width={1200}
                    height={675}
                    className="w-full"
                  />
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-24 bg-gradient-to-b from-gray-50/50 to-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_100%_200px,#4263EB0A,transparent)]" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl font-bold tracking-tight mb-4">Built for modern teams</h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Whether you're a small startup or a global enterprise, OpenAsync adapts to your team's needs
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
              {/* For Teams */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="relative"
              >
                <div className="flex items-center space-x-4 mb-8">
                  <div className="h-12 w-12 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl flex items-center justify-center">
                    <Users className="h-6 w-6 text-[#4263EB]" />
                  </div>
                  <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#4263EB] to-blue-600">For Teams</h3>
                </div>
                <ul className="space-y-6">
                  <motion.li
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="flex items-start group"
                  >
                    <div className="mt-1 h-5 w-5 bg-blue-50 rounded-full flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                      <CheckCircle2 className="h-4 w-4 text-[#4263EB] transform group-hover:scale-110 transition-transform" />
                    </div>
                    <div className="ml-3">
                      <h4 className="font-semibold mb-1 group-hover:text-[#4263EB] transition-colors">No More Meeting Fatigue</h4>
                      <p className="text-gray-600">Communicate effectively without endless calls, keeping your team's energy focused on what matters.</p>
                    </div>
                  </motion.li>
                  <motion.li
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                    className="flex items-start group"
                  >
                    <div className="mt-1 h-5 w-5 bg-blue-50 rounded-full flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                      <CheckCircle2 className="h-4 w-4 text-[#4263EB] transform group-hover:scale-110 transition-transform" />
                    </div>
                    <div className="ml-3">
                      <h4 className="font-semibold mb-1 group-hover:text-[#4263EB] transition-colors">Seamless Collaboration</h4>
                      <p className="text-gray-600">Stay aligned across time zones and work styles, ensuring everyone can contribute at their best.</p>
                    </div>
                  </motion.li>
                  <motion.li
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                    className="flex items-start group"
                  >
                    <div className="mt-1 h-5 w-5 bg-blue-50 rounded-full flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                      <CheckCircle2 className="h-4 w-4 text-[#4263EB] transform group-hover:scale-110 transition-transform" />
                    </div>
                    <div className="ml-3">
                      <h4 className="font-semibold mb-1 group-hover:text-[#4263EB] transition-colors">Improved Focus</h4>
                      <p className="text-gray-600">Minimize interruptions and context switching, letting your team maintain deep focus on their work.</p>
                    </div>
                  </motion.li>
                </ul>
              </motion.div>

              {/* For Managers */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="relative"
              >
                <div className="flex items-center space-x-4 mb-8">
                  <div className="h-12 w-12 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl flex items-center justify-center">
                    <LineChart className="h-6 w-6 text-[#4263EB]" />
                  </div>
                  <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#4263EB] to-blue-600">For Managers</h3>
                </div>
                <ul className="space-y-6">
                  <motion.li
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                    className="flex items-start group"
                  >
                    <div className="mt-1 h-5 w-5 bg-blue-50 rounded-full flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                      <CheckCircle2 className="h-4 w-4 text-[#4263EB] transform group-hover:scale-110 transition-transform" />
                    </div>
                    <div className="ml-3">
                      <h4 className="font-semibold mb-1 group-hover:text-[#4263EB] transition-colors">Instant Oversight</h4>
                      <p className="text-gray-600">Get clear updates on progress and blockers without micromanaging, empowering your team to own their work.</p>
                    </div>
                  </motion.li>
                  <motion.li
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                    className="flex items-start group"
                  >
                    <div className="mt-1 h-5 w-5 bg-blue-50 rounded-full flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                      <CheckCircle2 className="h-4 w-4 text-[#4263EB] transform group-hover:scale-110 transition-transform" />
                    </div>
                    <div className="ml-3">
                      <h4 className="font-semibold mb-1 group-hover:text-[#4263EB] transition-colors">Goal Alignment Made Easy</h4>
                      <p className="text-gray-600">Use AI to simplify the planning process and ensure every team member is moving in the right direction.</p>
                    </div>
                  </motion.li>
                  <motion.li
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6, duration: 0.5 }}
                    className="flex items-start group"
                  >
                    <div className="mt-1 h-5 w-5 bg-blue-50 rounded-full flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                      <CheckCircle2 className="h-4 w-4 text-[#4263EB] transform group-hover:scale-110 transition-transform" />
                    </div>
                    <div className="ml-3">
                      <h4 className="font-semibold mb-1 group-hover:text-[#4263EB] transition-colors">Data-Driven Decisions</h4>
                      <p className="text-gray-600">Leverage AI summaries to identify trends, risks, and opportunities before they impact your team's success.</p>
                    </div>
                  </motion.li>
                </ul>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_100%_200px,#4263EB0A,transparent)]" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl font-bold tracking-tight mb-4">Loved by teams worldwide</h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                See how teams are using OpenAsync to transform their collaboration
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Testimonial 1 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-2xl transform group-hover:scale-105 transition-transform duration-300" />
                <div className="relative bg-white/80 backdrop-blur-sm p-8 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all h-full">
                  <div className="flex items-center mb-6">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xl">
                      LM
                    </div>
                    <div className="ml-4">
                      <p className="font-semibold">Lisa Martinez</p>
                      <p className="text-sm text-gray-500">Product Manager at Acme Inc.</p>
                    </div>
                  </div>
                  <div className="mb-6">
                    <div className="flex text-yellow-400 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} className="h-5 w-5 fill-current" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                  <blockquote className="text-lg text-gray-600 mb-6">
                    "OpenAsync has completely transformed how our team communicates. The AI summaries save me hours every week, and the async updates keep everyone aligned without the meeting fatigue."
                  </blockquote>
                  <div className="flex items-center text-sm text-gray-500">
                    <span className="flex items-center">
                      <span className="h-2 w-2 bg-green-500 rounded-full mr-2"></span>
                      Verified Customer
                    </span>
                  </div>
                </div>
              </motion.div>

              {/* Testimonial 2 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-2xl transform group-hover:scale-105 transition-transform duration-300" />
                <div className="relative bg-white/80 backdrop-blur-sm p-8 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all h-full">
                  <div className="flex items-center mb-6">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xl">
                      MT
                    </div>
                    <div className="ml-4">
                      <p className="font-semibold">Mark Thompson</p>
                      <p className="text-sm text-gray-500">Engineering Lead at TechCorp</p>
                    </div>
                  </div>
                  <div className="mb-6">
                    <div className="flex text-yellow-400 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} className="h-5 w-5 fill-current" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                  <blockquote className="text-lg text-gray-600 mb-6">
                    "With OpenAsync, we're always aligned on our goals, even with a distributed team. The video updates and AI-driven insights have made remote collaboration feel natural and efficient."
                  </blockquote>
                  <div className="flex items-center text-sm text-gray-500">
                    <span className="flex items-center">
                      <span className="h-2 w-2 bg-green-500 rounded-full mr-2"></span>
                      Verified Customer
                    </span>
                  </div>
                </div>
              </motion.div>

              {/* Testimonial 3 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-2xl transform group-hover:scale-105 transition-transform duration-300" />
                <div className="relative bg-white/80 backdrop-blur-sm p-8 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all h-full">
                  <div className="flex items-center mb-6">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xl">
                      SK
                    </div>
                    <div className="ml-4">
                      <p className="font-semibold">Sarah Kim</p>
                      <p className="text-sm text-gray-500">COO at StartupX</p>
                    </div>
                  </div>
                  <div className="mb-6">
                    <div className="flex text-yellow-400 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} className="h-5 w-5 fill-current" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                  <blockquote className="text-lg text-gray-600 mb-6">
                    "The AI-powered goal alignment has been a game-changer for our strategic planning. It's like having an expert consultant guiding our team's direction."
                  </blockquote>
                  <div className="flex items-center text-sm text-gray-500">
                    <span className="flex items-center">
                      <span className="h-2 w-2 bg-green-500 rounded-full mr-2"></span>
                      Verified Customer
                    </span>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Logos */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="mt-16 pt-8 border-t"
            >
              <p className="text-sm text-gray-500 text-center mb-8">Trusted by innovative teams at</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center justify-items-center opacity-60">
                <Image src="/logos/logo1.svg" alt="Company Logo" width={120} height={40} className="grayscale hover:grayscale-0 transition-all" />
                <Image src="/logos/logo2.svg" alt="Company Logo" width={120} height={40} className="grayscale hover:grayscale-0 transition-all" />
                <Image src="/logos/logo3.svg" alt="Company Logo" width={120} height={40} className="grayscale hover:grayscale-0 transition-all" />
                <Image src="/logos/logo4.svg" alt="Company Logo" width={120} height={40} className="grayscale hover:grayscale-0 transition-all" />
              </div>
            </motion.div>
          </div>
        </section>

        {/* Why OpenAsync */}
        <section className="py-24 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-12">Why OpenAsync?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-xl font-semibold mb-3">Asynchronous by Design</h3>
                <p className="text-gray-600">Empower your team to work on their own schedule.</p>
              </div>
              <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-xl font-semibold mb-3">AI-Powered Efficiency</h3>
                <p className="text-gray-600">Automate alignment and insights for better decision-making.</p>
              </div>
              <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-xl font-semibold mb-3">Built for Teams of All Sizes</h3>
                <p className="text-gray-600">Whether you're a small team or a global organization, OpenAsync scales with you.</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]" />
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-purple-500/5" />
          </div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="max-w-4xl mx-auto text-center"
            >
              <h2 className="text-4xl sm:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-[#4263EB] to-blue-600">
                Ready to revolutionize team alignment?
              </h2>
              <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
                Join thousands of teams already using OpenAsync to transform their collaboration. Get started free today.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link href="/signup">
                  <Button 
                    size="lg"
                    className="h-12 px-8 bg-[#4263EB] hover:bg-[#3b5bdb] text-white group relative overflow-hidden w-full sm:w-auto"
                  >
                    <span className="relative z-10">Get Started Free</span>
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-700 opacity-0 group-hover:opacity-100 transition-opacity"
                      initial={false}
                      animate={{ scale: 1.5 }}
                      transition={{ repeat: Infinity, duration: 2 }}
                    />
                  </Button>
                </Link>
                <Link href="/demo">
                  <Button 
                    size="lg"
                    variant="outline"
                    className="h-12 px-8 border-2 group w-full sm:w-auto"
                  >
                    <Play className="mr-2 h-4 w-4 transition-transform group-hover:scale-110" />
                    Watch Demo
                  </Button>
                </Link>
              </div>
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>14-day free trial</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>Cancel anytime</span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t bg-gray-50/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Product</h3>
                <ul className="space-y-3">
                  <li>
                    <Link href="/features" className="text-sm text-gray-600 hover:text-gray-900">
                      Features
                    </Link>
                  </li>
                  <li>
                    <Link href="/pricing" className="text-sm text-gray-600 hover:text-gray-900">
                      Pricing
                    </Link>
                  </li>
                  <li>
                    <Link href="/security" className="text-sm text-gray-600 hover:text-gray-900">
                      Security
                    </Link>
                  </li>
                  <li>
                    <Link href="/changelog" className="text-sm text-gray-600 hover:text-gray-900">
                      Changelog
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Company</h3>
                <ul className="space-y-3">
                  <li>
                    <Link href="/about" className="text-sm text-gray-600 hover:text-gray-900">
                      About
                    </Link>
                  </li>
                  <li>
                    <Link href="/blog" className="text-sm text-gray-600 hover:text-gray-900">
                      Blog
                    </Link>
                  </li>
                  <li>
                    <Link href="/careers" className="text-sm text-gray-600 hover:text-gray-900">
                      Careers
                    </Link>
                  </li>
                  <li>
                    <Link href="/contact" className="text-sm text-gray-600 hover:text-gray-900">
                      Contact
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Resources</h3>
                <ul className="space-y-3">
                  <li>
                    <Link href="/documentation" className="text-sm text-gray-600 hover:text-gray-900">
                      Documentation
                    </Link>
                  </li>
                  <li>
                    <Link href="/guides" className="text-sm text-gray-600 hover:text-gray-900">
                      Guides
                    </Link>
                  </li>
                  <li>
                    <Link href="/help" className="text-sm text-gray-600 hover:text-gray-900">
                      Help Center
                    </Link>
                  </li>
                  <li>
                    <Link href="/api" className="text-sm text-gray-600 hover:text-gray-900">
                      API
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Legal</h3>
                <ul className="space-y-3">
                  <li>
                    <Link href="/privacy" className="text-sm text-gray-600 hover:text-gray-900">
                      Privacy
                    </Link>
                  </li>
                  <li>
                    <Link href="/terms" className="text-sm text-gray-600 hover:text-gray-900">
                      Terms
                    </Link>
                  </li>
                  <li>
                    <Link href="/security" className="text-sm text-gray-600 hover:text-gray-900">
                      Security
                    </Link>
                  </li>
                  <li>
                    <Link href="/cookies" className="text-sm text-gray-600 hover:text-gray-900">
                      Cookies
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
            <div className="py-8 border-t">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-3">
                  <Image 
                    src="/logo.svg" 
                    alt="OpenAsync" 
                    width={32} 
                    height={32} 
                    className="w-8 h-8"
                  />
                  <span className="text-sm text-gray-500">
                    © {new Date().getFullYear()} OpenAsync. All rights reserved.
                  </span>
                </div>
                <div className="flex items-center space-x-6">
                  <Link href="https://twitter.com/openasync" className="text-gray-400 hover:text-gray-500">
                    <span className="sr-only">Twitter</span>
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                    </svg>
                  </Link>
                  <Link href="https://github.com/openasync" className="text-gray-400 hover:text-gray-500">
                    <span className="sr-only">GitHub</span>
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                    </svg>
                  </Link>
                  <Link href="https://linkedin.com/company/openasync" className="text-gray-400 hover:text-gray-500">
                    <span className="sr-only">LinkedIn</span>
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}