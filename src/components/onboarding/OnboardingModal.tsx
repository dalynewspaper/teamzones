'use client'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { useOnboarding } from '@/contexts/OnboardingContext'
import { UserInfo } from './steps/UserInfo'
import { OrganizationSetup } from './steps/OrganizationSetup'
import { FirstUpdate } from './steps/FirstUpdate'
import { motion, AnimatePresence } from 'framer-motion'

const STEPS = [
  { 
    id: 'user-info',
    title: 'Welcome to Open Async',
    subtitle: "Let's personalize your experience",
    icon: '👋'
  },
  { 
    id: 'organization',
    title: 'Set Up Your Workspace',
    subtitle: 'Create a home for your team',
    icon: '🏢'
  },
  { 
    id: 'first-update',
    title: 'Share Your First Update',
    subtitle: 'Connect with your team async-style',
    icon: '🎥'
  }
]

export function OnboardingModal() {
  const { currentStep, isComplete, showOnboarding } = useOnboarding()

  if (isComplete || !showOnboarding) {
    return null
  }

  const currentStepIndex = STEPS.findIndex(step => step.id === currentStep)
  const currentStepInfo = STEPS[currentStepIndex]

  return (
    <Dialog open={true}>
      <DialogContent 
        className="max-w-[1200px] min-h-[800px] p-0 overflow-hidden bg-white shadow-2xl"
        aria-describedby="onboarding-description"
      >
        <DialogTitle className="sr-only">
          {currentStepInfo.title}
        </DialogTitle>

        {/* Progress Bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-black/5">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-600 to-blue-400"
            initial={{ width: '0%' }}
            animate={{ width: `${((currentStepIndex + 1) / STEPS.length) * 100}%` }}
            transition={{ duration: 0.8, ease: [0.4, 0.0, 0.2, 1] }}
          />
        </div>

        <div className="relative px-24 py-16">
          {/* Step Indicator */}
          <motion.div 
            className="flex items-start space-x-8 mb-16"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-7xl"
            >
              {currentStepInfo.icon}
            </motion.div>
            <div>
              <motion.div
                className="text-sm font-medium text-blue-600 mb-3"
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
              >
                Step {currentStepIndex + 1} of {STEPS.length}
              </motion.div>
              <motion.h2
                id="onboarding-description"
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-4xl font-bold text-gray-900"
              >
                {currentStepInfo.title}
              </motion.h2>
              <motion.p
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-xl text-gray-500 mt-3"
              >
                {currentStepInfo.subtitle}
              </motion.p>
            </div>
          </motion.div>

          {/* Steps Navigation */}
          <div className="flex justify-between mb-20 px-16">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <motion.div 
                  className={`
                    w-16 h-16 rounded-full flex items-center justify-center text-xl font-medium
                    transition-all duration-500 ease-out
                    ${index <= currentStepIndex 
                      ? 'bg-blue-600 text-white shadow-xl shadow-blue-200/50 scale-110' 
                      : 'bg-white text-gray-400 border-2 border-gray-100'
                    }
                  `}
                  initial={false}
                  animate={{
                    scale: index === currentStepIndex ? 1.1 : 1,
                    y: index === currentStepIndex ? -4 : 0
                  }}
                >
                  {index < currentStepIndex ? '✓' : index + 1}
                </motion.div>
                {index < STEPS.length - 1 && (
                  <div className="relative w-48 mx-6">
                    <div className="absolute top-1/2 w-full h-[2px] bg-gray-100" />
                    <motion.div 
                      className="absolute top-1/2 h-[2px] bg-gradient-to-r from-blue-600 to-blue-400"
                      initial={{ width: '0%' }}
                      animate={{ 
                        width: index < currentStepIndex ? '100%' : '0%'
                      }}
                      transition={{ duration: 0.8, ease: [0.4, 0.0, 0.2, 1] }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, ease: [0.4, 0.0, 0.2, 1] }}
              className="px-16 max-w-3xl mx-auto"
            >
              {currentStep === 'user-info' && <UserInfo />}
              {currentStep === 'organization' && <OrganizationSetup />}
              {currentStep === 'first-update' && <FirstUpdate />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom Gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none" />
      </DialogContent>
    </Dialog>
  )
} 