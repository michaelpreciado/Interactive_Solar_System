import React, { useEffect, useState } from 'react'
import { useEducationStore } from '../stores/useEducationStore'
import { useUIStore } from '../stores/useUIStore'

export const LessonPlayer: React.FC = () => {
  const {
    currentLesson,
    currentStep,
    isLessonActive,
    isPaused,
    nextStep,
    previousStep,
    completeLesson,
    exitLesson,
    pauseLesson,
    resumeLesson,
    learningLevel
  } = useEducationStore()

  const { selectedPlanet, setSelectedPlanet, scaleMode, setScaleMode } = useUIStore()

  const [stepTimer, setStepTimer] = useState(0)
  const [autoAdvance, setAutoAdvance] = useState(true)

  useEffect(() => {
    if (isLessonActive && currentLesson && !isPaused) {
      const currentStepData = currentLesson.steps[currentStep]
      if (currentStepData) {
        executeStepAction(currentStepData)
        setStepTimer(currentStepData.duration)
      }
    }
  }, [currentStep, isLessonActive, isPaused])

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>
    if (isLessonActive && !isPaused && stepTimer > 0 && autoAdvance) {
      interval = setInterval(() => {
        setStepTimer(prev => {
          if (prev <= 1) {
            // Auto advance to next step
            if (currentLesson && currentStep < currentLesson.steps.length - 1) {
              nextStep()
            } else {
              completeLesson()
            }
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isLessonActive, isPaused, stepTimer, autoAdvance, currentStep, currentLesson])

  if (!isLessonActive || !currentLesson) return null

  const executeStepAction = (step: any) => {
    switch (step.action) {
      case 'highlight-planet':
        if (step.targetPlanet) {
          setSelectedPlanet(step.targetPlanet)
        }
        break
      case 'zoom-to':
        if (step.targetPlanet) {
          setSelectedPlanet(step.targetPlanet)
        }
        break
      case 'change-scale':
        if (step.scaleMode) {
          setScaleMode(step.scaleMode)
        }
        break
      case 'show-orbits':
        // This would trigger orbit visualization
        break
      default:
        break
    }
  }

  const currentStepData = currentLesson.steps[currentStep]
  const progress = ((currentStep + 1) / currentLesson.steps.length) * 100

  const getStepIcon = (action: string) => {
    switch (action) {
      case 'highlight-planet': return '🌟'
      case 'zoom-to': return '🔍'
      case 'change-scale': return '📏'
      case 'show-info': return '📚'
      case 'compare-planets': return '⚖️'
      case 'show-orbits': return '🌌'
      default: return '📖'
    }
  }

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40 w-full max-w-4xl px-4">
      <div className="liquid-glass-panel p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">🎓</span>
            <div>
              <h2 className="text-lg font-bold text-white">{currentLesson.title}</h2>
              <div className="flex items-center space-x-2 text-sm text-gray-300">
                <span>Step {currentStep + 1} of {currentLesson.steps.length}</span>
                <span>•</span>
                <span>{Math.ceil(currentLesson.duration - (currentStep * 2))} min remaining</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={autoAdvance ? pauseLesson : resumeLesson}
              className="liquid-glass-button text-sm px-3 py-1"
            >
              {isPaused ? '▶️' : '⏸️'}
            </button>
            <button
              onClick={exitLesson}
              className="liquid-glass-close"
            >
              ×
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-400">Progress</span>
            <span className="text-sm text-gray-400">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Current Step */}
        <div className="mb-6">
          <div className="flex items-start space-x-3 mb-3">
            <span className="text-2xl mt-1">{getStepIcon(currentStepData.action)}</span>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white mb-2">
                {currentStepData.title}
              </h3>
              <p className="text-gray-300 leading-relaxed">
                {currentStepData.description}
              </p>
            </div>
          </div>

          {/* Voice Over Text */}
          {currentStepData.voiceOver && (
            <div className="mt-3 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <div className="flex items-start space-x-2">
                <span className="text-blue-400 mt-0.5">🎤</span>
                <p className="text-blue-300 text-sm italic">
                  "{currentStepData.voiceOver}"
                </p>
              </div>
            </div>
          )}

          {/* Step Timer */}
          {autoAdvance && !isPaused && (
            <div className="mt-3 flex items-center space-x-2">
              <span className="text-sm text-gray-400">Next step in:</span>
              <div className="flex items-center space-x-2">
                <div className="w-16 h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-yellow-400 to-orange-400 transition-all duration-1000"
                    style={{ width: `${((currentStepData.duration - stepTimer) / currentStepData.duration) * 100}%` }}
                  />
                </div>
                <span className="text-sm text-yellow-400 font-mono">{stepTimer}s</span>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={previousStep}
              disabled={currentStep === 0}
              className={`liquid-glass-button text-sm px-4 py-2 ${
                currentStep === 0 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              ← Previous
            </button>
            
            <button
              onClick={() => setAutoAdvance(!autoAdvance)}
              className={`liquid-glass-button text-sm px-4 py-2 ${
                autoAdvance ? 'liquid-glass-primary' : ''
              }`}
            >
              {autoAdvance ? '🔄 Auto' : '⏯️ Manual'}
            </button>
          </div>

          <div className="flex items-center space-x-3">
            {currentStep < currentLesson.steps.length - 1 ? (
              <button
                onClick={nextStep}
                className="liquid-glass-button liquid-glass-primary text-sm px-4 py-2"
              >
                Next →
              </button>
            ) : (
              <button
                onClick={completeLesson}
                className="liquid-glass-button liquid-glass-success text-sm px-4 py-2"
              >
                Complete Lesson ✨
              </button>
            )}
          </div>
        </div>

        {/* Lesson Navigation */}
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="flex items-center space-x-2 overflow-x-auto">
            <span className="text-sm text-gray-400 whitespace-nowrap">Steps:</span>
            {currentLesson.steps.map((step, index) => (
              <div
                key={index}
                className={`flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                  index === currentStep
                    ? 'border-blue-400 bg-blue-400 text-white'
                    : index < currentStep
                    ? 'border-green-400 bg-green-400 text-white'
                    : 'border-gray-600 text-gray-400'
                }`}
              >
                {index < currentStep ? '✓' : index + 1}
              </div>
            ))}
          </div>
        </div>

        {/* Educational Context */}
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="flex items-start space-x-2">
            <span className="text-blue-400 mt-0.5">💡</span>
            <div className="text-xs text-gray-400">
              <p className="mb-1">
                <strong>Learning Context:</strong>
              </p>
              <p>
                {learningLevel === 'elementary' && "Follow along as we explore each planet step by step!"}
                {learningLevel === 'middle' && "Pay attention to the scientific concepts being demonstrated."}
                {learningLevel === 'high' && "Consider how each observation relates to physical laws and planetary formation."}
                {learningLevel === 'college' && "Analyze the underlying mechanisms and consider current research implications."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 