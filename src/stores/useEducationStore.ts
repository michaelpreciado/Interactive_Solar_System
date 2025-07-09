import { create } from 'zustand'

export type LearningLevel = 'elementary' | 'middle' | 'high' | 'college'
export type LessonType = 'solar-system-overview' | 'planetary-scale' | 'orbital-mechanics' | 'planet-comparison' | 'moon-phases' | 'asteroid-belt' | 'gas-giants' | 'rocky-planets'

export interface EducationalFact {
  id: string
  title: string
  content: string
  level: LearningLevel
  category: 'general' | 'physics' | 'composition' | 'history' | 'exploration'
  planetName?: string
}

export interface LessonStep {
  id: string
  title: string
  description: string
  action: 'highlight-planet' | 'zoom-to' | 'change-scale' | 'show-info' | 'compare-planets' | 'show-orbits'
  targetPlanet?: string
  scaleMode?: 'compressed' | 'realistic' | 'logarithmic'
  duration: number // seconds
  voiceOver?: string
  quiz?: QuizQuestion
}

export interface Lesson {
  id: LessonType
  title: string
  description: string
  level: LearningLevel[]
  duration: number // minutes
  steps: LessonStep[]
  objectives: string[]
  vocabulary: string[]
}

export interface QuizQuestion {
  id: string
  question: string
  type: 'multiple-choice' | 'true-false' | 'fill-blank' | 'ordering'
  options?: string[]
  correctAnswer: string | string[]
  explanation: string
  level: LearningLevel
}

export interface StudentProgress {
  lessonsCompleted: LessonType[]
  currentLesson?: LessonType
  currentStep: number
  quizScores: Record<string, number>
  factsViewed: string[]
  timeSpent: number // minutes
  achievements: string[]
}

export interface TeacherSettings {
  classroomMode: boolean
  allowedLessons: LessonType[]
  timeLimit?: number // minutes
  hideAdvancedFeatures: boolean
  customObjectives: string[]
}

export interface EducationState {
  // Current learning context
  learningLevel: LearningLevel
  currentLesson: Lesson | null
  currentStep: number
  isLessonActive: boolean
  isPaused: boolean
  
  // Educational mode settings
  educationalMode: boolean
  teacherMode: boolean
  teacherSettings: TeacherSettings
  
  // Student progress
  studentProgress: StudentProgress
  
  // UI state
  showFacts: boolean
  showQuiz: boolean
  showComparison: boolean
  selectedPlanetsForComparison: string[]
  currentFact: EducationalFact | null
  currentQuiz: QuizQuestion | null
  
  // Content visibility
  showScientificNotation: boolean
  showMetricUnits: boolean
  showEducationalOverlay: boolean
  autoPlayFacts: boolean
  
  // Actions
  setLearningLevel: (level: LearningLevel) => void
  setEducationalMode: (enabled: boolean) => void
  setTeacherMode: (enabled: boolean) => void
  updateTeacherSettings: (settings: Partial<TeacherSettings>) => void
  
  // Lesson management
  startLesson: (lessonId: LessonType) => void
  pauseLesson: () => void
  resumeLesson: () => void
  nextStep: () => void
  previousStep: () => void
  completeLesson: () => void
  exitLesson: () => void
  
  // Content interaction
  showRandomFact: (planetName?: string) => void
  hideFact: () => void
  startQuiz: (planetName?: string) => void
  submitQuizAnswer: (answer: string | string[]) => void
  
  // Comparison tools
  addPlanetToComparison: (planetName: string) => void
  removePlanetFromComparison: (planetName: string) => void
  clearComparison: () => void
  
  // Progress tracking
  updateProgress: (update: Partial<StudentProgress>) => void
  resetProgress: () => void
  
  // Settings
  toggleScientificNotation: () => void
  toggleMetricUnits: () => void
  toggleEducationalOverlay: () => void
  toggleAutoPlayFacts: () => void
}

// Educational content data
export const educationalFacts: EducationalFact[] = [
  // Mercury Facts
  {
    id: 'mercury-closest',
    title: 'Mercury is the closest planet to the Sun',
    content: 'Mercury orbits the Sun at an average distance of 36 million miles (58 million km). It completes one orbit in just 88 Earth days!',
    level: 'elementary',
    category: 'general',
    planetName: 'mercury'
  },
  {
    id: 'mercury-temperature',
    title: 'Mercury has extreme temperatures',
    content: 'Mercury can reach 800°F (430°C) during the day and drop to -300°F (-180°C) at night because it has no atmosphere to trap heat.',
    level: 'middle',
    category: 'physics',
    planetName: 'mercury'
  },
  {
    id: 'mercury-core',
    title: 'Mercury has a huge iron core',
    content: 'Mercury\'s iron core makes up about 75% of the planet\'s radius, making it the second densest planet after Earth.',
    level: 'high',
    category: 'composition',
    planetName: 'mercury'
  },
  
  // Venus Facts
  {
    id: 'venus-hottest',
    title: 'Venus is the hottest planet',
    content: 'Even though Mercury is closer to the Sun, Venus is actually the hottest planet because of its thick atmosphere that traps heat like a greenhouse.',
    level: 'elementary',
    category: 'physics',
    planetName: 'venus'
  },
  {
    id: 'venus-backwards',
    title: 'Venus rotates backwards',
    content: 'Venus spins in the opposite direction to most other planets. A day on Venus (243 Earth days) is longer than its year (225 Earth days)!',
    level: 'middle',
    category: 'physics',
    planetName: 'venus'
  },
  {
    id: 'venus-pressure',
    title: 'Venus has crushing atmospheric pressure',
    content: 'The atmospheric pressure on Venus is 90 times stronger than Earth\'s - equivalent to being 3,000 feet underwater!',
    level: 'high',
    category: 'physics',
    planetName: 'venus'
  },
  
  // Earth Facts
  {
    id: 'earth-goldilocks',
    title: 'Earth is in the "Goldilocks Zone"',
    content: 'Earth is at just the right distance from the Sun - not too hot and not too cold - for liquid water to exist on its surface.',
    level: 'middle',
    category: 'physics',
    planetName: 'earth'
  },
  {
    id: 'earth-magnetic-field',
    title: 'Earth has a protective magnetic field',
    content: 'Earth\'s magnetic field protects us from harmful solar radiation and helps keep our atmosphere from being stripped away by solar wind.',
    level: 'middle',
    category: 'physics',
    planetName: 'earth'
  },
  {
    id: 'earth-moon-tides',
    title: 'The Moon creates Earth\'s tides',
    content: 'The Moon\'s gravity pulls on Earth\'s oceans, creating high and low tides twice a day. The Moon is also slowly moving away from Earth.',
    level: 'elementary',
    category: 'physics',
    planetName: 'earth'
  },
  
  // Mars Facts
  {
    id: 'mars-red-planet',
    title: 'Mars is called the "Red Planet"',
    content: 'Mars appears red because its surface contains iron oxide (rust). The planet has the largest volcano in the solar system - Olympus Mons!',
    level: 'elementary',
    category: 'composition',
    planetName: 'mars'
  },
  {
    id: 'mars-polar-caps',
    title: 'Mars has polar ice caps',
    content: 'Mars has permanent ice caps at both poles made of frozen water and frozen carbon dioxide (dry ice).',
    level: 'middle',
    category: 'composition',
    planetName: 'mars'
  },
  {
    id: 'mars-water-evidence',
    title: 'Mars once had liquid water',
    content: 'Scientists have found evidence of ancient river valleys, lake beds, and possibly even oceans on Mars billions of years ago.',
    level: 'high',
    category: 'exploration',
    planetName: 'mars'
  },
  
  // Jupiter Facts
  {
    id: 'jupiter-great-red-spot',
    title: 'Jupiter\'s Great Red Spot is a giant storm',
    content: 'The Great Red Spot is a storm larger than Earth that has been raging for hundreds of years. Jupiter could fit over 1,300 Earths inside it!',
    level: 'middle',
    category: 'general',
    planetName: 'jupiter'
  },
  {
    id: 'jupiter-moons',
    title: 'Jupiter has 95 known moons',
    content: 'Jupiter has four large moons discovered by Galileo: Io, Europa, Ganymede, and Callisto. Europa may have an ocean beneath its icy surface!',
    level: 'elementary',
    category: 'exploration',
    planetName: 'jupiter'
  },
  {
    id: 'jupiter-comet-catcher',
    title: 'Jupiter protects Earth from comets',
    content: 'Jupiter\'s massive gravity acts like a cosmic vacuum cleaner, capturing or deflecting comets and asteroids that might otherwise hit Earth.',
    level: 'high',
    category: 'physics',
    planetName: 'jupiter'
  },
  
  // Saturn Facts
  {
    id: 'saturn-rings',
    title: 'Saturn\'s rings are made of ice and rock',
    content: 'Saturn\'s beautiful rings are made of billions of pieces of ice and rock, ranging in size from tiny particles to house-sized chunks.',
    level: 'elementary',
    category: 'composition',
    planetName: 'saturn'
  },
  {
    id: 'saturn-density',
    title: 'Saturn is less dense than water',
    content: 'Saturn is so light that it would float if you could find an ocean big enough! It\'s made mostly of hydrogen and helium gases.',
    level: 'middle',
    category: 'physics',
    planetName: 'saturn'
  },
  {
    id: 'saturn-hexagon',
    title: 'Saturn has a hexagonal storm at its north pole',
    content: 'Saturn\'s north pole has a unique six-sided storm pattern that\'s larger than Earth. This geometric shape is rare in nature!',
    level: 'high',
    category: 'physics',
    planetName: 'saturn'
  },
  
  // Uranus Facts
  {
    id: 'uranus-sideways',
    title: 'Uranus rotates on its side',
    content: 'Uranus has an extreme axial tilt of 98 degrees, meaning it essentially rolls around the Sun on its side rather than spinning upright.',
    level: 'high',
    category: 'physics',
    planetName: 'uranus'
  },
  {
    id: 'uranus-ice-giant',
    title: 'Uranus is an ice giant',
    content: 'Unlike Jupiter and Saturn, Uranus is made mostly of water, methane, and ammonia ices surrounding a rocky core.',
    level: 'middle',
    category: 'composition',
    planetName: 'uranus'
  },
  {
    id: 'uranus-discovery',
    title: 'Uranus was the first planet discovered with a telescope',
    content: 'William Herschel discovered Uranus in 1781, making it the first planet found using a telescope rather than being visible to the naked eye.',
    level: 'high',
    category: 'history',
    planetName: 'uranus'
  },
  
  // Neptune Facts
  {
    id: 'neptune-windiest',
    title: 'Neptune has the fastest winds in the solar system',
    content: 'Neptune\'s winds can reach speeds of up to 1,200 mph (2,000 km/h) - that\'s faster than the speed of sound!',
    level: 'middle',
    category: 'physics',
    planetName: 'neptune'
  },
  {
    id: 'neptune-math-discovery',
    title: 'Neptune was discovered through mathematics',
    content: 'Neptune was found in 1846 by calculating where it should be based on its gravitational effects on Uranus\'s orbit.',
    level: 'high',
    category: 'history',
    planetName: 'neptune'
  },
  {
    id: 'neptune-triton',
    title: 'Neptune\'s largest moon orbits backwards',
    content: 'Triton, Neptune\'s largest moon, orbits in the opposite direction to Neptune\'s rotation, suggesting it was a captured object.',
    level: 'high',
    category: 'physics',
    planetName: 'neptune'
  },
  
  // General Solar System Facts
  {
    id: 'asteroid-belt',
    title: 'The asteroid belt separates inner and outer planets',
    content: 'Between Mars and Jupiter lies the asteroid belt, containing millions of rocky objects left over from the solar system\'s formation.',
    level: 'middle',
    category: 'general'
  },
  {
    id: 'solar-system-formation',
    title: 'The solar system formed from a giant cloud of gas and dust',
    content: 'About 4.6 billion years ago, our solar system formed when a giant molecular cloud collapsed under its own gravity.',
    level: 'high',
    category: 'history'
  },
  {
    id: 'planet-definition',
    title: 'A planet must clear its orbit',
    content: 'To be called a planet, an object must orbit the Sun, be massive enough to be round, and have cleared other objects from its orbital path.',
    level: 'middle',
    category: 'general'
  }
]

export const quizQuestions: QuizQuestion[] = [
  // Elementary Level Questions
  {
    id: 'mercury-orbit-time',
    question: 'How long does it take Mercury to orbit the Sun?',
    type: 'multiple-choice',
    options: ['88 Earth days', '365 Earth days', '687 Earth days', '12 Earth years'],
    correctAnswer: '88 Earth days',
    explanation: 'Mercury is the fastest planet, completing its orbit around the Sun in just 88 Earth days.',
    level: 'elementary'
  },
  {
    id: 'hottest-planet',
    question: 'Which planet is the hottest in our solar system?',
    type: 'multiple-choice',
    options: ['Mercury', 'Venus', 'Earth', 'Mars'],
    correctAnswer: 'Venus',
    explanation: 'Venus is the hottest planet due to its thick atmosphere that creates a runaway greenhouse effect.',
    level: 'elementary'
  },
  {
    id: 'mars-color',
    question: 'Why does Mars appear red?',
    type: 'multiple-choice',
    options: ['It\'s very hot', 'Iron oxide (rust) on its surface', 'Red clouds in its atmosphere', 'Reflection from the Sun'],
    correctAnswer: 'Iron oxide (rust) on its surface',
    explanation: 'Mars appears red because its surface contains iron oxide, which is essentially rust.',
    level: 'elementary'
  },
  {
    id: 'largest-planet',
    question: 'Which is the largest planet in our solar system?',
    type: 'multiple-choice',
    options: ['Saturn', 'Jupiter', 'Neptune', 'Uranus'],
    correctAnswer: 'Jupiter',
    explanation: 'Jupiter is by far the largest planet, with a diameter of about 88,846 miles (142,984 km).',
    level: 'elementary'
  },
  {
    id: 'saturn-rings',
    question: 'Which planet is famous for its beautiful rings?',
    type: 'multiple-choice',
    options: ['Jupiter', 'Saturn', 'Mars', 'Venus'],
    correctAnswer: 'Saturn',
    explanation: 'Saturn has the most prominent and beautiful ring system, made of ice and rock particles.',
    level: 'elementary'
  },
  {
    id: 'earth-moon-count',
    question: 'How many moons does Earth have?',
    type: 'multiple-choice',
    options: ['0', '1', '2', '4'],
    correctAnswer: '1',
    explanation: 'Earth has one large moon, which is about 1/4 the size of Earth.',
    level: 'elementary'
  },
  
  // Middle School Level Questions
  {
    id: 'gas-giants',
    question: 'Which planets are considered gas giants?',
    type: 'multiple-choice',
    options: ['Mercury, Venus, Earth, Mars', 'Jupiter, Saturn, Uranus, Neptune', 'Earth, Mars, Jupiter, Saturn', 'Venus, Earth, Mars, Jupiter'],
    correctAnswer: 'Jupiter, Saturn, Uranus, Neptune',
    explanation: 'The four outer planets are gas giants, composed mainly of hydrogen and helium.',
    level: 'middle'
  },
  {
    id: 'venus-rotation',
    question: 'What is unusual about Venus\'s rotation?',
    type: 'multiple-choice',
    options: ['It doesn\'t rotate', 'It rotates backwards', 'It rotates very fast', 'It rotates on its side'],
    correctAnswer: 'It rotates backwards',
    explanation: 'Venus rotates in the opposite direction to most planets, a phenomenon called retrograde rotation.',
    level: 'middle'
  },
  {
    id: 'asteroid-belt-location',
    question: 'Where is the asteroid belt located?',
    type: 'multiple-choice',
    options: ['Between Earth and Mars', 'Between Mars and Jupiter', 'Between Jupiter and Saturn', 'Beyond Neptune'],
    correctAnswer: 'Between Mars and Jupiter',
    explanation: 'The asteroid belt is located between Mars and Jupiter, containing millions of rocky objects.',
    level: 'middle'
  },
  {
    id: 'jupiter-moons',
    question: 'Approximately how many moons does Jupiter have?',
    type: 'multiple-choice',
    options: ['4', '27', '95', '146'],
    correctAnswer: '95',
    explanation: 'Jupiter has 95 known moons, including the four large Galilean moons: Io, Europa, Ganymede, and Callisto.',
    level: 'middle'
  },
  {
    id: 'goldilocks-zone',
    question: 'What is the "Goldilocks Zone"?',
    type: 'multiple-choice',
    options: ['The asteroid belt', 'The region where life can exist', 'Saturn\'s rings', 'Jupiter\'s Great Red Spot'],
    correctAnswer: 'The region where life can exist',
    explanation: 'The Goldilocks Zone is the region around a star where conditions are just right for liquid water to exist.',
    level: 'middle'
  },
  {
    id: 'inner-vs-outer',
    question: 'What separates the inner planets from the outer planets?',
    type: 'multiple-choice',
    options: ['The Sun', 'The asteroid belt', 'Jupiter\'s gravity', 'The Kuiper belt'],
    correctAnswer: 'The asteroid belt',
    explanation: 'The asteroid belt separates the four inner rocky planets from the four outer gas giants.',
    level: 'middle'
  },
  
  // High School Level Questions
  {
    id: 'uranus-tilt',
    question: 'What is unusual about Uranus\'s rotation?',
    type: 'multiple-choice',
    options: ['It rotates backwards', 'It rotates on its side', 'It doesn\'t rotate', 'It rotates very slowly'],
    correctAnswer: 'It rotates on its side',
    explanation: 'Uranus has an extreme axial tilt of 98 degrees, meaning it essentially rolls around the Sun on its side.',
    level: 'high'
  },
  {
    id: 'neptune-discovery',
    question: 'How was Neptune discovered?',
    type: 'multiple-choice',
    options: ['By telescope observation', 'By mathematical calculation', 'By spacecraft', 'By accident'],
    correctAnswer: 'By mathematical calculation',
    explanation: 'Neptune was discovered in 1846 through mathematical calculations based on its gravitational effects on Uranus.',
    level: 'high'
  },
  {
    id: 'greenhouse-effect',
    question: 'Which planet demonstrates the extreme greenhouse effect?',
    type: 'multiple-choice',
    options: ['Mercury', 'Venus', 'Mars', 'Jupiter'],
    correctAnswer: 'Venus',
    explanation: 'Venus\'s thick CO2 atmosphere creates a runaway greenhouse effect, making it hotter than Mercury despite being farther from the Sun.',
    level: 'high'
  },
  {
    id: 'tidal-forces',
    question: 'What causes tides on Earth?',
    type: 'multiple-choice',
    options: ['Solar wind', 'Earth\'s rotation', 'Moon\'s gravity', 'Earth\'s magnetic field'],
    correctAnswer: 'Moon\'s gravity',
    explanation: 'The Moon\'s gravitational pull creates tidal forces that cause the rise and fall of ocean tides.',
    level: 'high'
  },
  {
    id: 'mars-atmosphere',
    question: 'What is the main component of Mars\'s atmosphere?',
    type: 'multiple-choice',
    options: ['Oxygen', 'Nitrogen', 'Carbon dioxide', 'Water vapor'],
    correctAnswer: 'Carbon dioxide',
    explanation: 'Mars\'s thin atmosphere is about 96% carbon dioxide, with traces of nitrogen and argon.',
    level: 'high'
  },
  
  // True/False Questions
  {
    id: 'saturn-density',
    question: 'Saturn is less dense than water.',
    type: 'true-false',
    correctAnswer: 'True',
    explanation: 'Saturn\'s density is about 0.69 g/cm³, which is less than water (1.0 g/cm³), so it would float!',
    level: 'middle'
  },
  {
    id: 'mercury-atmosphere',
    question: 'Mercury has a thick atmosphere.',
    type: 'true-false',
    correctAnswer: 'False',
    explanation: 'Mercury has virtually no atmosphere, which is why it has such extreme temperature variations.',
    level: 'elementary'
  },
  {
    id: 'jupiter-solid-surface',
    question: 'Jupiter has a solid surface you could walk on.',
    type: 'true-false',
    correctAnswer: 'False',
    explanation: 'Jupiter is a gas giant with no solid surface. It\'s composed mostly of hydrogen and helium gas.',
    level: 'elementary'
  },
  {
    id: 'all-planets-same-direction',
    question: 'All planets orbit the Sun in the same direction.',
    type: 'true-false',
    correctAnswer: 'True',
    explanation: 'All planets orbit the Sun in the same counterclockwise direction (when viewed from above the Sun\'s north pole).',
    level: 'middle'
  }
]

// Lesson definitions
export const lessons: Lesson[] = [
  {
    id: 'solar-system-overview',
    title: 'Tour of the Solar System',
    description: 'Take a guided tour through our solar system and meet all the planets',
    level: ['elementary', 'middle'],
    duration: 10,
    objectives: [
      'Identify all eight planets in order from the Sun',
      'Understand the difference between inner and outer planets',
      'Learn basic facts about each planet'
    ],
    vocabulary: ['orbit', 'planet', 'solar system', 'asteroid belt', 'gas giant', 'rocky planet'],
    steps: [
      {
        id: 'intro',
        title: 'Welcome to the Solar System',
        description: 'Our solar system contains eight planets orbiting around our star, the Sun.',
        action: 'show-info',
        duration: 30,
        voiceOver: 'Welcome to our amazing solar system! Let\'s explore the eight planets that orbit our Sun.'
      },
      {
        id: 'mercury',
        title: 'Mercury - The Speedy Planet',
        description: 'Mercury is the smallest planet and closest to the Sun.',
        action: 'highlight-planet',
        targetPlanet: 'mercury',
        duration: 45,
        voiceOver: 'Here\'s Mercury, the smallest planet and closest to the Sun. It\'s very fast!'
      },
      {
        id: 'venus',
        title: 'Venus - The Hottest Planet',
        description: 'Venus is covered in thick clouds and is the hottest planet.',
        action: 'highlight-planet',
        targetPlanet: 'venus',
        duration: 45,
        voiceOver: 'Venus is covered in thick clouds and is the hottest planet in our solar system.'
      }
      // More steps would be added for each planet
    ]
  }
  // More lessons would be defined here
]

const initialTeacherSettings: TeacherSettings = {
  classroomMode: false,
  allowedLessons: ['solar-system-overview', 'planetary-scale', 'planet-comparison'],
  hideAdvancedFeatures: false,
  customObjectives: []
}

const initialStudentProgress: StudentProgress = {
  lessonsCompleted: [],
  currentStep: 0,
  quizScores: {},
  factsViewed: [],
  timeSpent: 0,
  achievements: []
}

export const useEducationStore = create<EducationState>((set, get) => ({
  // Initial state
  learningLevel: 'middle',
  currentLesson: null,
  currentStep: 0,
  isLessonActive: false,
  isPaused: false,
  
  educationalMode: false,
  teacherMode: false,
  teacherSettings: initialTeacherSettings,
  
  studentProgress: initialStudentProgress,
  
  showFacts: false,
  showQuiz: false,
  showComparison: false,
  selectedPlanetsForComparison: [],
  currentFact: null,
  currentQuiz: null,
  
  showScientificNotation: false,
  showMetricUnits: true,
  showEducationalOverlay: false,
  autoPlayFacts: false,
  
  // Actions
  setLearningLevel: (level) => set({ learningLevel: level }),
  
  setEducationalMode: (enabled) => set({ 
    educationalMode: enabled,
    showEducationalOverlay: enabled
  }),
  
  setTeacherMode: (enabled) => set({ teacherMode: enabled }),
  
  updateTeacherSettings: (settings) => set((state) => ({
    teacherSettings: { ...state.teacherSettings, ...settings }
  })),
  
  // Lesson management
  startLesson: (lessonId) => {
    const lesson = lessons.find(l => l.id === lessonId)
    if (lesson) {
      set({
        currentLesson: lesson,
        currentStep: 0,
        isLessonActive: true,
        isPaused: false
      })
    }
  },
  
  pauseLesson: () => set({ isPaused: true }),
  resumeLesson: () => set({ isPaused: false }),
  
  nextStep: () => set((state) => {
    if (state.currentLesson && state.currentStep < state.currentLesson.steps.length - 1) {
      return { currentStep: state.currentStep + 1 }
    }
    return state
  }),
  
  previousStep: () => set((state) => {
    if (state.currentStep > 0) {
      return { currentStep: state.currentStep - 1 }
    }
    return state
  }),
  
  completeLesson: () => set((state) => {
    if (state.currentLesson) {
      const updatedProgress = {
        ...state.studentProgress,
        lessonsCompleted: [...state.studentProgress.lessonsCompleted, state.currentLesson.id]
      }
      return {
        currentLesson: null,
        currentStep: 0,
        isLessonActive: false,
        isPaused: false,
        studentProgress: updatedProgress
      }
    }
    return state
  }),
  
  exitLesson: () => set({
    currentLesson: null,
    currentStep: 0,
    isLessonActive: false,
    isPaused: false
  }),
  
  // Content interaction
  showRandomFact: (planetName) => {
    const { learningLevel } = get()
    let availableFacts = educationalFacts.filter(fact => 
      fact.level === learningLevel || 
      (learningLevel === 'middle' && fact.level === 'elementary') ||
      (learningLevel === 'high' && (fact.level === 'elementary' || fact.level === 'middle'))
    )
    
    if (planetName) {
      availableFacts = availableFacts.filter(fact => fact.planetName === planetName)
    }
    
    if (availableFacts.length > 0) {
      const randomFact = availableFacts[Math.floor(Math.random() * availableFacts.length)]
      set({ currentFact: randomFact, showFacts: true })
    }
  },
  
  hideFact: () => set({ currentFact: null, showFacts: false }),
  
  startQuiz: (planetName) => {
    const { learningLevel } = get()
    let availableQuestions = quizQuestions.filter(q => 
      q.level === learningLevel ||
      (learningLevel === 'middle' && q.level === 'elementary') ||
      (learningLevel === 'high' && (q.level === 'elementary' || q.level === 'middle'))
    )
    
    if (availableQuestions.length > 0) {
      const randomQuestion = availableQuestions[Math.floor(Math.random() * availableQuestions.length)]
      set({ currentQuiz: randomQuestion, showQuiz: true })
    }
  },
  
  submitQuizAnswer: (answer) => {
    const { currentQuiz, studentProgress } = get()
    if (currentQuiz) {
      const isCorrect = Array.isArray(currentQuiz.correctAnswer) 
        ? currentQuiz.correctAnswer.includes(answer as string)
        : currentQuiz.correctAnswer === answer
      
      const score = isCorrect ? 100 : 0
      const updatedScores = {
        ...studentProgress.quizScores,
        [currentQuiz.id]: score
      }
      
      set((state) => ({
        studentProgress: {
          ...state.studentProgress,
          quizScores: updatedScores
        }
      }))
      
      // Show result for a moment, then hide quiz
      setTimeout(() => {
        set({ currentQuiz: null, showQuiz: false })
      }, 3000)
    }
  },
  
  // Comparison tools
  addPlanetToComparison: (planetName) => set((state) => {
    if (state.selectedPlanetsForComparison.length < 4 && 
        !state.selectedPlanetsForComparison.includes(planetName)) {
      return {
        selectedPlanetsForComparison: [...state.selectedPlanetsForComparison, planetName],
        showComparison: true
      }
    }
    return state
  }),
  
  removePlanetFromComparison: (planetName) => set((state) => ({
    selectedPlanetsForComparison: state.selectedPlanetsForComparison.filter(p => p !== planetName),
    showComparison: state.selectedPlanetsForComparison.length > 1
  })),
  
  clearComparison: () => set({
    selectedPlanetsForComparison: [],
    showComparison: false
  }),
  
  // Progress tracking
  updateProgress: (update) => set((state) => ({
    studentProgress: { ...state.studentProgress, ...update }
  })),
  
  resetProgress: () => set({ studentProgress: initialStudentProgress }),
  
  // Settings
  toggleScientificNotation: () => set((state) => ({
    showScientificNotation: !state.showScientificNotation
  })),
  
  toggleMetricUnits: () => set((state) => ({
    showMetricUnits: !state.showMetricUnits
  })),
  
  toggleEducationalOverlay: () => set((state) => ({
    showEducationalOverlay: !state.showEducationalOverlay
  })),
  
  toggleAutoPlayFacts: () => set((state) => ({
    autoPlayFacts: !state.autoPlayFacts
  }))
})) 