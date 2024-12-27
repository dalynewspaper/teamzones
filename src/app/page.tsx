'use client'

import { useAuth } from '@/contexts/AuthContext'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Video, Goal, Brain, Clock, CheckCircle2, Users, LineChart, Sparkles, ArrowRight } from 'lucide-react'

export default function Home() {
  const { user } = useAuth()

  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 w-full bg-white border-b z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-xl font-semibold text-[#4263EB]">
              OpenAsync
            </Link>
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

      {/* Hero Section */}
      <section className="pt-32 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            <h1 className="text-[2.75rem] sm:text-6xl font-bold tracking-tight">
              <span className="text-[#1F2937]">Stay Aligned,</span>
              <br />
              <span className="text-[#4263EB]">Anytime, Anywhere.</span>
            </h1>
            
            <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto">
              OpenAsync brings your team together with async video updates, AI-driven goal alignment, and intelligent summaries—so you can focus on what truly matters.
            </p>

            <div className="mt-10 flex justify-center gap-4">
              <Link href="/signup">
                <Button 
                  size="lg"
                  className="h-12 px-6 bg-[#4263EB] hover:bg-[#3b5bdb] text-white"
                >
                  Get Started Free →
                </Button>
              </Link>
              <Link href="/demo">
                <Button 
                  size="lg"
                  variant="outline"
                  className="h-12 px-6 border-2"
                >
                  Watch Demo <Video className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="mt-12 flex justify-center items-center space-x-8 text-sm text-gray-600">
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
            </div>
          </motion.div>
        </div>
      </section>

      {/* Key Features Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Async Video Updates */}
            <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
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

            {/* AI-Driven Goal Alignment */}
            <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
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

            {/* Intelligent Summaries */}
            <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
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
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-16">How It Works</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="relative mx-auto mb-6">
                <div className="absolute inset-0 bg-blue-100 rounded-full blur-xl opacity-50"></div>
                <div className="relative h-16 w-16 bg-[#4263EB] rounded-full flex items-center justify-center mx-auto">
                  <Video className="h-8 w-8 text-white" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-3">1. Record Video Updates</h3>
              <p className="text-gray-600">Share what you're working on at your convenience.</p>
            </div>

            <div className="text-center">
              <div className="relative mx-auto mb-6">
                <div className="absolute inset-0 bg-blue-100 rounded-full blur-xl opacity-50"></div>
                <div className="relative h-16 w-16 bg-[#4263EB] rounded-full flex items-center justify-center mx-auto">
                  <Goal className="h-8 w-8 text-white" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-3">2. Set Goals with AI Assistance</h3>
              <p className="text-gray-600">Let OpenAsync suggest, align, and refine team objectives.</p>
            </div>

            <div className="text-center">
              <div className="relative mx-auto mb-6">
                <div className="absolute inset-0 bg-blue-100 rounded-full blur-xl opacity-50"></div>
                <div className="relative h-16 w-16 bg-[#4263EB] rounded-full flex items-center justify-center mx-auto">
                  <Clock className="h-8 w-8 text-white" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-3">3. Get Weekly Summaries</h3>
              <p className="text-gray-600">Understand team progress and focus areas in just minutes.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
            {/* For Teams */}
            <div>
              <div className="flex items-center space-x-4 mb-8">
                <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Users className="h-6 w-6 text-[#4263EB]" />
                </div>
                <h3 className="text-2xl font-bold">For Teams</h3>
              </div>
              <ul className="space-y-6">
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-[#4263EB] mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold mb-1">No More Meeting Fatigue</h4>
                    <p className="text-gray-600">Communicate effectively without endless calls.</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-[#4263EB] mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold mb-1">Seamless Collaboration</h4>
                    <p className="text-gray-600">Stay aligned, even across time zones.</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-[#4263EB] mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold mb-1">Improved Focus</h4>
                    <p className="text-gray-600">Spend less time coordinating and more time achieving.</p>
                  </div>
                </li>
              </ul>
            </div>

            {/* For Managers */}
            <div>
              <div className="flex items-center space-x-4 mb-8">
                <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <LineChart className="h-6 w-6 text-[#4263EB]" />
                </div>
                <h3 className="text-2xl font-bold">For Managers</h3>
              </div>
              <ul className="space-y-6">
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-[#4263EB] mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold mb-1">Instant Oversight</h4>
                    <p className="text-gray-600">Get clear updates on progress and blockers without micromanaging.</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-[#4263EB] mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold mb-1">Goal Alignment Made Easy</h4>
                    <p className="text-gray-600">Use AI to simplify the planning process.</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-[#4263EB] mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold mb-1">Data-Driven Decisions</h4>
                    <p className="text-gray-600">Leverage AI summaries to identify risks and opportunities.</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <p className="text-lg text-gray-600 mb-6">
                "OpenAsync has completely transformed how our team communicates. The AI summaries save me hours every week!"
              </p>
              <div className="flex items-center">
                <div>
                  <p className="font-semibold">Lisa M.</p>
                  <p className="text-sm text-gray-500">Product Manager</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <p className="text-lg text-gray-600 mb-6">
                "With OpenAsync, we're always aligned on our goals, even with a distributed team. The video updates are a game changer."
              </p>
              <div className="flex items-center">
                <div>
                  <p className="font-semibold">Mark T.</p>
                  <p className="text-sm text-gray-500">Team Lead</p>
                </div>
              </div>
            </div>
          </div>
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
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6">
            Ready to revolutionize team alignment?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Sign up for OpenAsync today and experience the future of team collaboration.
          </p>
          <Button 
            size="lg"
            className="h-12 px-8 bg-[#4263EB] hover:bg-[#3b5bdb] text-white"
          >
            Get Started Free <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              © {new Date().getFullYear()} OpenAsync. All rights reserved.
            </div>
            <div className="flex items-center space-x-6">
              <Link href="/privacy" className="text-sm text-gray-500 hover:text-gray-900">
                Privacy
              </Link>
              <Link href="/terms" className="text-sm text-gray-500 hover:text-gray-900">
                Terms
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}