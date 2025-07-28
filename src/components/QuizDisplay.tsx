import React, { useState, useEffect } from 'react'
import { useEducationStore } from '../stores/useEducationStore'

export const QuizDisplay: React.FC = () => {
  const { currentQuiz, showQuiz, submitQuizAnswer, startQuiz, learningLevel } = useEducationStore()
  const [selectedAnswer, setSelectedAnswer] = useState<string>('')
  const [showResult, setShowResult] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [timeLeft, setTimeLeft] = useState(30) // 30 seconds per question
  const [timerActive, setTimerActive] = useState(false)

  useEffect(() => {
    if (showQuiz && currentQuiz) {
      setSelectedAnswer('')
      setShowResult(false)
      setTimeLeft(30)
      setTimerActive(true)
    }
  }, [showQuiz, currentQuiz])

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(timeLeft - 1)
      }, 1000)
    } else if (timeLeft === 0 && timerActive) {
      // Time's up - auto submit
      handleSubmit()
    }
    return () => clearInterval(interval)
  }, [timerActive, timeLeft])

  if (!showQuiz || !currentQuiz) return null

  const handleAnswerSelect = (answer: string) => {
    if (!showResult) {
      setSelectedAnswer(answer)
    }
  }

  const handleSubmit = () => {
    if (!selectedAnswer && timeLeft > 0) return

    const correct = Array.isArray(currentQuiz.correctAnswer) 
      ? currentQuiz.correctAnswer.includes(selectedAnswer)
      : currentQuiz.correctAnswer === selectedAnswer

    setIsCorrect(correct)
    setShowResult(true)
    setTimerActive(false)
    submitQuizAnswer(selectedAnswer)
  }

  const getTimerColor = () => {
    if (timeLeft > 20) return 'text-green-400'
    if (timeLeft > 10) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'elementary': return 'bg-green-500'
      case 'middle': return 'bg-blue-500'
      case 'high': return 'bg-purple-500'
      case 'college': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="liquid-glass-panel max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">🎯</span>
            <div>
              <h2 className="text-xl font-bold text-white">Quiz Time!</h2>
              <div className="flex items-center space-x-2 mt-1">
                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium text-white ${getDifficultyColor(currentQuiz.level)}`}>
                  {currentQuiz.level.charAt(0).toUpperCase() + currentQuiz.level.slice(1)}
                </span>
                <span className={`text-sm font-mono ${getTimerColor()}`}>
                  ⏱️ {timeLeft}s
                </span>
              </div>
            </div>
          </div>
          
          {/* Timer Visual */}
          <div className="relative w-16 h-16">
            <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-gray-700"
                strokeWidth="2"
                fill="none"
                stroke="currentColor"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className={getTimerColor()}
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
                stroke="currentColor"
                strokeDasharray={`${(timeLeft / 30) * 100}, 100`}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-xs font-bold ${getTimerColor()}`}>
                {timeLeft}
              </span>
            </div>
          </div>
        </div>

        {/* Question */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-white mb-4 leading-relaxed">
            {currentQuiz.question}
          </h3>
        </div>

        {/* Answer Options */}
        {currentQuiz.type === 'multiple-choice' && currentQuiz.options && (
          <div className="space-y-3 mb-8">
            {currentQuiz.options.map((option, index) => {
              const isSelected = selectedAnswer === option
              const isCorrectAnswer = currentQuiz.correctAnswer === option
              const isWrongAnswer = showResult && isSelected && !isCorrect
              
              let buttonClass = 'liquid-glass-button w-full text-left p-4 transition-all duration-300'
              
              if (showResult) {
                if (isCorrectAnswer) {
                  buttonClass += ' liquid-glass-success ring-2 ring-green-400'
                } else if (isWrongAnswer) {
                  buttonClass += ' liquid-glass-danger ring-2 ring-red-400'
                } else {
                  buttonClass += ' opacity-50'
                }
              } else if (isSelected) {
                buttonClass += ' ring-2 ring-blue-400 scale-105'
              }

              return (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(option)}
                  disabled={showResult}
                  className={buttonClass}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      showResult && isCorrectAnswer 
                        ? 'border-green-400 bg-green-400' 
                        : showResult && isWrongAnswer
                        ? 'border-red-400 bg-red-400'
                        : isSelected 
                        ? 'border-blue-400 bg-blue-400' 
                        : 'border-gray-400'
                    }`}>
                      <span className="text-white text-xs font-bold">
                        {String.fromCharCode(65 + index)}
                      </span>
                    </div>
                    <span className="flex-1">{option}</span>
                    {showResult && isCorrectAnswer && (
                      <span className="text-green-400">✓</span>
                    )}
                    {showResult && isWrongAnswer && (
                      <span className="text-red-400">✗</span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {/* True/False Questions */}
        {currentQuiz.type === 'true-false' && (
          <div className="flex space-x-4 mb-8">
            {['True', 'False'].map((option) => {
              const isSelected = selectedAnswer === option
              const isCorrectAnswer = currentQuiz.correctAnswer === option
              const isWrongAnswer = showResult && isSelected && !isCorrect
              
              let buttonClass = 'liquid-glass-button flex-1 p-6 text-center transition-all duration-300'
              
              if (showResult) {
                if (isCorrectAnswer) {
                  buttonClass += ' liquid-glass-success ring-2 ring-green-400'
                } else if (isWrongAnswer) {
                  buttonClass += ' liquid-glass-danger ring-2 ring-red-400'
                } else {
                  buttonClass += ' opacity-50'
                }
              } else if (isSelected) {
                buttonClass += ' ring-2 ring-blue-400 scale-105'
              }

              return (
                <button
                  key={option}
                  onClick={() => handleAnswerSelect(option)}
                  disabled={showResult}
                  className={buttonClass}
                >
                  <div className="text-2xl mb-2">
                    {option === 'True' ? '✓' : '✗'}
                  </div>
                  <div className="font-semibold">{option}</div>
                </button>
              )
            })}
          </div>
        )}

        {/* Submit Button */}
        {!showResult && (
          <div className="mb-6">
            <button
              onClick={handleSubmit}
              disabled={!selectedAnswer}
              className={`liquid-glass-button w-full p-4 font-semibold ${
                selectedAnswer 
                  ? 'liquid-glass-primary' 
                  : 'opacity-50 cursor-not-allowed'
              }`}
            >
              {selectedAnswer ? '📝 Submit Answer' : '👆 Select an answer first'}
            </button>
          </div>
        )}

        {/* Result and Explanation */}
        {showResult && (
          <div className="mb-6">
            <div className={`p-4 rounded-lg border-2 mb-4 ${
              isCorrect 
                ? 'bg-green-500/20 border-green-400' 
                : 'bg-red-500/20 border-red-400'
            }`}>
              <div className="flex items-center space-x-3 mb-2">
                <span className="text-2xl">
                  {isCorrect ? '🎉' : '🤔'}
                </span>
                <span className={`font-bold text-lg ${
                  isCorrect ? 'text-green-400' : 'text-red-400'
                }`}>
                  {isCorrect ? 'Correct!' : 'Not quite right'}
                </span>
              </div>
              <p className="text-gray-300 leading-relaxed">
                {currentQuiz.explanation}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={() => startQuiz()}
                className="liquid-glass-button flex-1"
              >
                🎲 Next Question
              </button>
              <button
                onClick={() => {
                  // Close quiz - handled by store
                }}
                className="liquid-glass-button flex-1 liquid-glass-success"
              >
                ✨ Continue Learning
              </button>
            </div>
          </div>
        )}

        {/* Educational Tips */}
        <div className="border-t border-white/10 pt-4">
          <div className="flex items-start space-x-2">
            <span className="text-blue-400 mt-0.5">💡</span>
            <div className="text-xs text-gray-400">
              <p className="mb-1">
                <strong>Learning Tip:</strong>
              </p>
              <p>
                {learningLevel === 'elementary' && "Take your time and think about what you've learned about the planets!"}
                {learningLevel === 'middle' && "Consider the scientific principles behind each answer choice."}
                {learningLevel === 'high' && "Think critically about the relationships between different planetary characteristics."}
                {learningLevel === 'college' && "Analyze the underlying physics and consider current research findings."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 