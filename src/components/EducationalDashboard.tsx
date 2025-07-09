import React from 'react'
import { useEducationStore, LearningLevel, lessons } from '../stores/useEducationStore'

interface EducationalDashboardProps {
  isOpen: boolean
  onClose: () => void
}

export const EducationalDashboard: React.FC<EducationalDashboardProps> = ({ isOpen, onClose }) => {
  const {
    learningLevel,
    educationalMode,
    teacherMode,
    studentProgress,
    setLearningLevel,
    setEducationalMode,
    setTeacherMode,
    startLesson,
    showRandomFact,
    startQuiz,
    resetProgress
  } = useEducationStore()

  if (!isOpen) return null

  const getLevelColor = (level: LearningLevel) => {
    switch (level) {
      case 'elementary': return 'bg-green-500'
      case 'middle': return 'bg-blue-500'
      case 'high': return 'bg-purple-500'
      case 'college': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getAvailableLessons = () => {
    return lessons.filter(lesson => lesson.level.includes(learningLevel))
  }

  const calculateProgressPercentage = () => {
    const totalLessons = getAvailableLessons().length
    const completedLessons = studentProgress.lessonsCompleted.length
    return totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="liquid-glass-panel max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">🚀 Solar System Learning Center</h1>
            <p className="text-gray-300">Explore space through interactive lessons and activities</p>
          </div>
          <button
            onClick={onClose}
            className="liquid-glass-close"
            aria-label="Close Educational Dashboard"
          >
            ×
          </button>
        </div>

        {/* Mode Toggles */}
        <div className="flex flex-wrap gap-4 mb-6">
          <button
            onClick={() => setEducationalMode(!educationalMode)}
            className={`liquid-glass-toggle ${educationalMode ? 'active' : 'inactive'}`}
          >
            📚 Educational Mode
          </button>
          <button
            onClick={() => setTeacherMode(!teacherMode)}
            className={`liquid-glass-toggle ${teacherMode ? 'active' : 'inactive'}`}
          >
            👩‍🏫 Teacher Mode
          </button>
        </div>

        {/* Learning Level Selector */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">📊 Choose Your Learning Level</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(['elementary', 'middle', 'high', 'college'] as LearningLevel[]).map((level) => (
              <button
                key={level}
                onClick={() => setLearningLevel(level)}
                className={`liquid-glass-button p-4 text-center transition-all duration-300 ${
                  learningLevel === level 
                    ? 'scale-105 ring-2 ring-white/50' 
                    : 'opacity-70 hover:opacity-100'
                }`}
              >
                <div className={`w-8 h-8 rounded-full ${getLevelColor(level)} mx-auto mb-2`}></div>
                <div className="text-sm font-medium capitalize">{level}</div>
                <div className="text-xs text-gray-300 mt-1">
                  {level === 'elementary' && 'Ages 6-10'}
                  {level === 'middle' && 'Ages 11-13'}
                  {level === 'high' && 'Ages 14-18'}
                  {level === 'college' && 'Ages 18+'}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Progress Overview */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">📈 Your Progress</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="liquid-glass-panel p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{studentProgress.lessonsCompleted.length}</div>
                <div className="text-sm text-gray-300">Lessons Completed</div>
              </div>
            </div>
            <div className="liquid-glass-panel p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">{calculateProgressPercentage()}%</div>
                <div className="text-sm text-gray-300">Overall Progress</div>
              </div>
            </div>
            <div className="liquid-glass-panel p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">{studentProgress.timeSpent}</div>
                <div className="text-sm text-gray-300">Minutes Learned</div>
              </div>
            </div>
          </div>
        </div>

        {/* Available Lessons */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">🎓 Interactive Lessons</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {getAvailableLessons().map((lesson) => {
              const isCompleted = studentProgress.lessonsCompleted.includes(lesson.id)
              return (
                <div key={lesson.id} className="liquid-glass-panel p-6 relative">
                  {isCompleted && (
                    <div className="absolute top-3 right-3 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                  
                  <h3 className="text-lg font-semibold text-white mb-2">{lesson.title}</h3>
                  <p className="text-gray-300 text-sm mb-4">{lesson.description}</p>
                  
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs text-gray-400">⏱️ {lesson.duration} minutes</span>
                    <span className="text-xs text-gray-400">
                      📚 {lesson.level.map(l => l.charAt(0).toUpperCase() + l.slice(1)).join(', ')}
                    </span>
                  </div>

                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-white mb-2">🎯 Learning Objectives:</h4>
                    <ul className="text-xs text-gray-300 space-y-1">
                      {lesson.objectives.slice(0, 2).map((objective, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-blue-400 mr-2">•</span>
                          {objective}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    onClick={() => startLesson(lesson.id)}
                    className="liquid-glass-button w-full"
                  >
                    {isCompleted ? '🔄 Replay Lesson' : '▶️ Start Lesson'}
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        {/* Quick Activities */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">⚡ Quick Activities</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => showRandomFact()}
              className="liquid-glass-button p-6 text-center"
            >
              <div className="text-2xl mb-2">🧠</div>
              <div className="font-medium">Random Fact</div>
              <div className="text-xs text-gray-300 mt-1">Learn something new!</div>
            </button>
            
            <button
              onClick={() => startQuiz()}
              className="liquid-glass-button p-6 text-center"
            >
              <div className="text-2xl mb-2">🎯</div>
              <div className="font-medium">Take Quiz</div>
              <div className="text-xs text-gray-300 mt-1">Test your knowledge</div>
            </button>
            
            <button
              onClick={() => {/* This will open planet comparison */}}
              className="liquid-glass-button p-6 text-center"
            >
              <div className="text-2xl mb-2">⚖️</div>
              <div className="font-medium">Compare Planets</div>
              <div className="text-xs text-gray-300 mt-1">See the differences</div>
            </button>
          </div>
        </div>

        {/* Teacher Tools */}
        {teacherMode && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-white mb-4">👩‍🏫 Teacher Tools</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="liquid-glass-panel p-4">
                <h3 className="font-medium text-white mb-3">📋 Classroom Management</h3>
                <div className="space-y-2">
                  <button className="liquid-glass-button w-full text-sm">
                    📊 View Class Progress
                  </button>
                  <button className="liquid-glass-button w-full text-sm">
                    📝 Create Assignment
                  </button>
                  <button className="liquid-glass-button w-full text-sm">
                    🎮 Classroom Mode
                  </button>
                </div>
              </div>
              
              <div className="liquid-glass-panel p-4">
                <h3 className="font-medium text-white mb-3">📚 Resources</h3>
                <div className="space-y-2">
                  <button className="liquid-glass-button w-full text-sm">
                    📖 Lesson Plans
                  </button>
                  <button className="liquid-glass-button w-full text-sm">
                    🎯 Curriculum Standards
                  </button>
                  <button className="liquid-glass-button w-full text-sm">
                    📄 Export Data
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Settings */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">⚙️ Settings</h2>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={resetProgress}
              className="liquid-glass-button liquid-glass-danger"
            >
              🔄 Reset Progress
            </button>
          </div>
        </div>

        {/* Educational Resources Links */}
        <div className="border-t border-white/10 pt-6">
          <h2 className="text-lg font-semibold text-white mb-4">🔗 Educational Resources</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h3 className="font-medium text-white mb-2">🏫 Curriculum Standards</h3>
              <ul className="text-gray-300 space-y-1">
                <li>• Next Generation Science Standards (NGSS)</li>
                <li>• NASA Education Resources</li>
                <li>• Common Core Math Applications</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-white mb-2">📖 Additional Learning</h3>
              <ul className="text-gray-300 space-y-1">
                <li>• NASA Solar System Exploration</li>
                <li>• Planetary Society Resources</li>
                <li>• ESA Space Education</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 