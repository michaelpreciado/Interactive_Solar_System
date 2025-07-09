import React, { useEffect, useState } from 'react'
import { useEducationStore } from '../stores/useEducationStore'

export const FactDisplay: React.FC = () => {
  const { currentFact, showFacts, hideFact, learningLevel, showRandomFact } = useEducationStore()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (showFacts && currentFact) {
      setIsVisible(true)
    } else {
      setIsVisible(false)
    }
  }, [showFacts, currentFact])

  if (!showFacts || !currentFact) return null

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'general': return '🌟'
      case 'physics': return '⚡'
      case 'composition': return '🧪'
      case 'history': return '📚'
      case 'exploration': return '🚀'
      default: return '💫'
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'general': return 'text-yellow-400'
      case 'physics': return 'text-blue-400'
      case 'composition': return 'text-green-400'
      case 'history': return 'text-purple-400'
      case 'exploration': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  const getLevelBadgeColor = (level: string) => {
    switch (level) {
      case 'elementary': return 'bg-green-500'
      case 'middle': return 'bg-blue-500'
      case 'high': return 'bg-purple-500'
      case 'college': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div 
      className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 transition-all duration-500 ${
        isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
      }`}
    >
      <div className="liquid-glass-panel max-w-md mx-4 p-6 relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">{getCategoryIcon(currentFact.category)}</span>
            <div>
              <span className={`text-sm font-medium ${getCategoryColor(currentFact.category)}`}>
                {currentFact.category.charAt(0).toUpperCase() + currentFact.category.slice(1)} Fact
              </span>
              <div className="flex items-center space-x-2 mt-1">
                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium text-white ${getLevelBadgeColor(currentFact.level)}`}>
                  {currentFact.level.charAt(0).toUpperCase() + currentFact.level.slice(1)}
                </span>
                {currentFact.planetName && (
                  <span className="text-xs text-gray-400 capitalize">
                    🪐 {currentFact.planetName}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={hideFact}
            className="liquid-glass-close text-sm"
            aria-label="Close fact"
          >
            ×
          </button>
        </div>

        {/* Fact Content */}
        <div className="mb-6">
          <h3 className="text-lg font-bold text-white mb-3 leading-tight">
            {currentFact.title}
          </h3>
          <p className="text-gray-300 leading-relaxed">
            {currentFact.content}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={() => showRandomFact(currentFact.planetName)}
            className="liquid-glass-button flex-1 text-sm"
          >
            🎲 Another Fact
          </button>
          <button
            onClick={hideFact}
            className="liquid-glass-button flex-1 text-sm liquid-glass-success"
          >
            ✨ Got It!
          </button>
        </div>

        {/* Educational Tip */}
        <div className="mt-4 p-3 bg-white/5 rounded-lg border border-white/10">
          <p className="text-xs text-gray-400 flex items-start">
            <span className="text-blue-400 mr-2 mt-0.5">💡</span>
            <span>
              {learningLevel === 'elementary' && "Click on planets to learn more fascinating facts like this one!"}
              {learningLevel === 'middle' && "Explore different planets to discover scientific connections and patterns!"}
              {learningLevel === 'high' && "Consider how this fact relates to physics concepts and space exploration missions!"}
              {learningLevel === 'college' && "Think about the underlying scientific principles and current research implications!"}
            </span>
          </p>
        </div>
      </div>

      {/* Background overlay */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm -z-10"
        onClick={hideFact}
      />
    </div>
  )
} 