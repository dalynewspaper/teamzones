'use client'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import { motion } from 'framer-motion'
import Image from 'next/image'

export default function LandingPage() {
  const { user } = useAuth()
  const router = useRouter()

  if (user) {
    router.push('/dashboard')
    return null
  }

  return (
    <div className="min-h-screen bg-white overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-black">
                OpenAsync
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                href="/signin"
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-black hover:bg-gray-800 transition-all hover:scale-105"
              >
                Get Started for Free
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="pt-16">
        {/* Hero */}
        <div className="relative">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-gradient-to-b from-blue-50 to-white" aria-hidden="true">
            <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="relative z-10"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl" 
                aria-hidden="true"
              />
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-6xl sm:text-7xl font-bold tracking-tight text-black mb-6 bg-clip-text text-transparent bg-gradient-to-r from-black to-gray-500"
              >
                Stay Aligned,
                <br />
                Anytime, Anywhere.
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-xl text-gray-600 max-w-3xl mx-auto mb-8"
              >
                OpenAsync brings your team together with async video updates, AI-driven goal alignment, and intelligent summaries—so you can focus on what truly matters.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex flex-col sm:flex-row gap-4 justify-center"
              >
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-base font-medium rounded-lg text-white bg-[#0066F5] hover:bg-[#0052CC] transition-all hover:scale-105 shadow-lg shadow-blue-500/20"
                >
                  Get Started for Free
                </Link>
                <Link
                  href="/signin"
                  className="inline-flex items-center justify-center px-8 py-4 border border-gray-200 text-base font-medium rounded-lg text-gray-900 bg-white hover:bg-gray-50 transition-all hover:scale-105"
                >
                  Log in
                </Link>
              </motion.div>
            </motion.div>

            {/* Hero Image */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.7 }}
              className="relative mt-16 mx-auto max-w-5xl"
            >
              <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden shadow-2xl">
                <Image
                  src="/hero-dashboard.png"
                  alt="OpenAsync Dashboard"
                  fill
                  className="object-cover"
                  priority
                />
                <div className="absolute inset-0 ring-1 ring-inset ring-black/10 rounded-xl" />
              </div>
            </motion.div>
          </div>
        </div>

        {/* Trusted By Section */}
        <div className="bg-[#F6F5F4] py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-sm text-gray-600 text-center mb-8">
              Trusted by teams at
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center justify-items-center opacity-60">
              {/* Add your company logos here */}
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-12"
            >
              {/* Feature 1 */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="relative group"
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl blur opacity-5 group-hover:opacity-10 transition duration-500"></div>
                <div className="relative bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                  <div className="h-12 w-12 rounded-lg bg-blue-50 flex items-center justify-center mb-6">
                    <svg className="h-6 w-6 text-[#0066F5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-black mb-4">
                    Async Video Updates
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Keep your team connected without the need for endless meetings.
                  </p>
                  <ul className="space-y-3 text-gray-600">
                    <li className="flex items-start">
                      <svg className="h-6 w-6 text-[#0066F5] mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Record and share video updates at your convenience</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="h-6 w-6 text-[#0066F5] mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Review team progress on your own schedule</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="h-6 w-6 text-[#0066F5] mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Engage with comments and reactions for real-time collaboration</span>
                    </li>
                  </ul>
                </div>
              </motion.div>

              {/* Feature 2 */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="relative group"
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl blur opacity-5 group-hover:opacity-10 transition duration-500"></div>
                <div className="relative bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                  <div className="h-12 w-12 rounded-lg bg-blue-50 flex items-center justify-center mb-6">
                    <svg className="h-6 w-6 text-[#0066F5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-black mb-4">
                    AI-Driven Goal Alignment
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Let AI handle the alignment so your team stays focused on results.
                  </p>
                  <ul className="space-y-3 text-gray-600">
                    <li className="flex items-start">
                      <svg className="h-6 w-6 text-[#0066F5] mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Automatically align team goals with weekly priorities</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="h-6 w-6 text-[#0066F5] mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Get personalized suggestions for setting and refining objectives</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="h-6 w-6 text-[#0066F5] mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Ensure no task or responsibility falls through the cracks</span>
                    </li>
                  </ul>
                </div>
              </motion.div>

              {/* Feature 3 */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="relative group"
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl blur opacity-5 group-hover:opacity-10 transition duration-500"></div>
                <div className="relative bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                  <div className="h-12 w-12 rounded-lg bg-blue-50 flex items-center justify-center mb-6">
                    <svg className="h-6 w-6 text-[#0066F5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-black mb-4">
                    Intelligent Summaries
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Know what's happening in minutes, not hours.
                  </p>
                  <ul className="space-y-3 text-gray-600">
                    <li className="flex items-start">
                      <svg className="h-6 w-6 text-[#0066F5] mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>AI-powered insights on team activities</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="h-6 w-6 text-[#0066F5] mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Clear summaries of what's being worked on and what needs attention</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="h-6 w-6 text-[#0066F5] mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Effortlessly stay informed about progress, blockers, and priorities</span>
                    </li>
                  </ul>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* How It Works Section */}
        <div className="relative bg-[#F6F5F4] py-24 overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-50">
            <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl font-bold text-black mb-4">How It Works</h2>
              <p className="text-xl text-gray-600">Three simple steps to transform your team's collaboration</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="relative text-center group"
              >
                <div className="relative">
                  <div className="bg-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/10 group-hover:scale-110 transition-transform duration-300">
                    <span className="text-2xl font-bold bg-gradient-to-r from-[#0066F5] to-blue-600 bg-clip-text text-transparent">1</span>
                  </div>
                  <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-[#0066F5] to-transparent" />
                </div>
                <h3 className="text-xl font-bold text-black mb-4">Record Video Updates</h3>
                <p className="text-gray-600">Share what you're working on at your convenience.</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="relative text-center group"
              >
                <div className="relative">
                  <div className="bg-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/10 group-hover:scale-110 transition-transform duration-300">
                    <span className="text-2xl font-bold bg-gradient-to-r from-[#0066F5] to-blue-600 bg-clip-text text-transparent">2</span>
                  </div>
                  <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-[#0066F5] to-transparent" />
                </div>
                <h3 className="text-xl font-bold text-black mb-4">Set Goals with AI Assistance</h3>
                <p className="text-gray-600">Let OpenAsync suggest, align, and refine team objectives.</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="relative text-center group"
              >
                <div className="bg-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/10 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-2xl font-bold bg-gradient-to-r from-[#0066F5] to-blue-600 bg-clip-text text-transparent">3</span>
                </div>
                <h3 className="text-xl font-bold text-black mb-4">Get Weekly Summaries</h3>
                <p className="text-gray-600">Understand team progress and focus areas in just minutes.</p>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl font-bold text-black mb-4">Benefits for Everyone</h2>
              <p className="text-xl text-gray-600">Designed to help both teams and managers succeed</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
              {/* For Teams */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <div className="relative">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl blur opacity-5"></div>
                  <div className="relative bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center mb-8">
                      <div className="h-12 w-12 rounded-lg bg-blue-50 flex items-center justify-center mr-4">
                        <svg className="h-6 w-6 text-[#0066F5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      </div>
                      <h3 className="text-3xl font-bold text-black">For Teams</h3>
                    </div>
                    <ul className="space-y-6">
                      <motion.li
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="flex items-start group"
                      >
                        <div className="flex-shrink-0 p-2">
                          <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                            <svg className="h-5 w-5 text-[#0066F5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        </div>
                        <div className="ml-4">
                          <h4 className="font-bold text-black mb-2">No More Meeting Fatigue</h4>
                          <p className="text-gray-600">Communicate effectively without endless calls.</p>
                        </div>
                      </motion.li>
                      <motion.li
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="flex items-start group"
                      >
                        <div className="flex-shrink-0 p-2">
                          <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                            <svg className="h-5 w-5 text-[#0066F5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        </div>
                        <div className="ml-4">
                          <h4 className="font-bold text-black mb-2">Seamless Collaboration</h4>
                          <p className="text-gray-600">Stay aligned, even across time zones.</p>
                        </div>
                      </motion.li>
                      <motion.li
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 }}
                        className="flex items-start group"
                      >
                        <div className="flex-shrink-0 p-2">
                          <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                            <svg className="h-5 w-5 text-[#0066F5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        </div>
                        <div className="ml-4">
                          <h4 className="font-bold text-black mb-2">Improved Focus</h4>
                          <p className="text-gray-600">Spend less time coordinating and more time achieving.</p>
                        </div>
                      </motion.li>
                    </ul>
                  </div>
                </div>
              </motion.div>

              {/* For Managers */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <div className="relative">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl blur opacity-5"></div>
                  <div className="relative bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center mb-8">
                      <div className="h-12 w-12 rounded-lg bg-blue-50 flex items-center justify-center mr-4">
                        <svg className="h-6 w-6 text-[#0066F5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      </div>
                      <h3 className="text-3xl font-bold text-black">For Managers</h3>
                    </div>
                    <ul className="space-y-6">
                      <motion.li
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="flex items-start group"
                      >
                        <div className="flex-shrink-0 p-2">
                          <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                            <svg className="h-5 w-5 text-[#0066F5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        </div>
                        <div className="ml-4">
                          <h4 className="font-bold text-black mb-2">Instant Oversight</h4>
                          <p className="text-gray-600">Get clear updates on progress and blockers without micromanaging.</p>
                        </div>
                      </motion.li>
                      <motion.li
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="flex items-start group"
                      >
                        <div className="flex-shrink-0 p-2">
                          <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                            <svg className="h-5 w-5 text-[#0066F5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        </div>
                        <div className="ml-4">
                          <h4 className="font-bold text-black mb-2">Goal Alignment Made Easy</h4>
                          <p className="text-gray-600">Use AI to simplify the planning process.</p>
                        </div>
                      </motion.li>
                      <motion.li
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 }}
                        className="flex items-start group"
                      >
                        <div className="flex-shrink-0 p-2">
                          <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                            <svg className="h-5 w-5 text-[#0066F5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        </div>
                        <div className="ml-4">
                          <h4 className="font-bold text-black mb-2">Data-Driven Decisions</h4>
                          <p className="text-gray-600">Leverage AI summaries to identify risks and opportunities.</p>
                        </div>
                      </motion.li>
                    </ul>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Why OpenAsync Section */}
        <div className="bg-[#F6F5F4] py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl font-bold text-center text-black mb-16">Why OpenAsync?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="text-center">
                <h3 className="text-xl font-bold text-black mb-4">Asynchronous by Design</h3>
                <p className="text-gray-600">Empower your team to work on their own schedule.</p>
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold text-black mb-4">AI-Powered Efficiency</h3>
                <p className="text-gray-600">Automate alignment and insights for better decision-making.</p>
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold text-black mb-4">Built for Teams of All Sizes</h3>
                <p className="text-gray-600">Whether you're a small team or a global organization, OpenAsync scales with you.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Testimonials Section */}
        <div className="relative py-24 overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-gradient-to-b from-gray-50 to-white">
            <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl font-bold text-black mb-4">Loved by Teams Everywhere</h2>
              <p className="text-xl text-gray-600">See what our customers have to say about OpenAsync</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="relative group"
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl blur opacity-5 group-hover:opacity-10 transition duration-500"></div>
                <div className="relative bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                  <div className="flex items-center mb-8">
                    <svg className="h-8 w-8 text-blue-500 mr-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14.017 18L14.017 10.609C14.017 4.905 17.748 1.039 23 0L23.995 2.151C21.563 3.068 20 5.789 20 8H24V18H14.017ZM0 18V10.609C0 4.905 3.731 1.038 9 0L9.996 2.151C7.563 3.068 6 5.789 6 8H9.983L9.983 18L0 18Z" />
                    </svg>
                  </div>
                  <p className="text-lg text-gray-600 mb-6 leading-relaxed">"OpenAsync has completely transformed how our team communicates. The AI summaries save me hours every week!"</p>
                  <div className="flex items-center">
                    <div className="bg-gradient-to-r from-[#0066F5] to-blue-600 rounded-full w-12 h-12 flex items-center justify-center text-white font-bold text-xl mr-4 shadow-lg shadow-blue-500/20">
                      LM
                    </div>
                    <div>
                      <p className="font-bold text-black">Lisa M.</p>
                      <p className="text-gray-600">Product Manager</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="relative group"
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl blur opacity-5 group-hover:opacity-10 transition duration-500"></div>
                <div className="relative bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                  <div className="flex items-center mb-8">
                    <svg className="h-8 w-8 text-blue-500 mr-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14.017 18L14.017 10.609C14.017 4.905 17.748 1.039 23 0L23.995 2.151C21.563 3.068 20 5.789 20 8H24V18H14.017ZM0 18V10.609C0 4.905 3.731 1.038 9 0L9.996 2.151C7.563 3.068 6 5.789 6 8H9.983L9.983 18L0 18Z" />
                    </svg>
                  </div>
                  <p className="text-lg text-gray-600 mb-6 leading-relaxed">"With OpenAsync, we're always aligned on our goals, even with a distributed team. The video updates are a game changer."</p>
                  <div className="flex items-center">
                    <div className="bg-gradient-to-r from-[#0066F5] to-blue-600 rounded-full w-12 h-12 flex items-center justify-center text-white font-bold text-xl mr-4 shadow-lg shadow-blue-500/20">
                      MT
                    </div>
                    <div>
                      <p className="font-bold text-black">Mark T.</p>
                      <p className="text-gray-600">Team Lead</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Final CTA Section */}
        <div className="relative bg-black text-white py-24 overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-10" />
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20" />
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="max-w-3xl mx-auto"
            >
              <h2 className="text-4xl sm:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">
                Ready to revolutionize team alignment?
              </h2>
              <p className="text-xl text-gray-300 mb-8">
                Sign up for OpenAsync today and experience the future of team collaboration.
              </p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="flex flex-col sm:flex-row gap-4 justify-center"
              >
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-base font-medium rounded-lg text-black bg-white hover:bg-gray-100 transition-all hover:scale-105 shadow-xl shadow-white/20"
                >
                  Get Started for Free
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center px-8 py-4 border border-white text-base font-medium rounded-lg text-white hover:bg-white/10 transition-all hover:scale-105"
                >
                  Contact Sales
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <Link href="/" className="text-2xl font-bold text-black inline-flex items-center">
                <span className="bg-gradient-to-r from-black to-gray-700 bg-clip-text text-transparent">OpenAsync</span>
              </Link>
              <p className="text-gray-600">
                Stay aligned, anytime, anywhere.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-gray-500">
                  <span className="sr-only">Twitter</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-gray-500">
                  <span className="sr-only">GitHub</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-gray-500">
                  <span className="sr-only">LinkedIn</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd" />
                  </svg>
                </a>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase">
                Product
              </h3>
              <ul className="mt-4 space-y-4">
                <li>
                  <Link href="#features" className="text-base text-gray-600 hover:text-gray-900 transition-colors">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="#pricing" className="text-base text-gray-600 hover:text-gray-900 transition-colors">
                    Pricing
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase">
                Company
              </h3>
              <ul className="mt-4 space-y-4">
                <li>
                  <Link href="#about" className="text-base text-gray-600 hover:text-gray-900 transition-colors">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="#contact" className="text-base text-gray-600 hover:text-gray-900 transition-colors">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase">
                Legal
              </h3>
              <ul className="mt-4 space-y-4">
                <li>
                  <Link href="#privacy" className="text-base text-gray-600 hover:text-gray-900 transition-colors">
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link href="#terms" className="text-base text-gray-600 hover:text-gray-900 transition-colors">
                    Terms
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-base text-gray-400">
              &copy; {new Date().getFullYear()} OpenAsync. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}