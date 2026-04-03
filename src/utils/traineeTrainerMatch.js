'use strict'

/** Canonical primary goals for onboarding & matching */
const PRIMARY_GOALS = [
  'lose_weight',
  'gain_muscle',
  'general_fitness',
  'build_endurance',
  'flexibility_mobility',
  'rehabilitation',
  'sports_performance'
]

/** Map goal slug → keywords matched against trainer specialty strings (lowercased) */
const GOAL_TO_KEYWORDS = {
  lose_weight: ['weight loss', 'fat loss', 'slim', 'lose weight', 'cut', 'lean', 'nutrition', 'diet', 'cardio'],
  gain_muscle: ['muscle', 'hypertrophy', 'strength', 'mass', 'bulk', 'bodybuilding', 'powerlifting'],
  general_fitness: ['general', 'fitness', 'wellness', 'beginner', 'lifestyle', 'functional'],
  build_endurance: ['endurance', 'running', 'cardio', 'marathon', 'stamina', 'aerobic', 'cycling'],
  flexibility_mobility: ['yoga', 'stretch', 'mobility', 'flexibility', 'pilates', 'recovery'],
  rehabilitation: ['rehab', 'physio', 'injury', 'corrective', 'posture', 'prehab'],
  sports_performance: ['sport', 'athletic', 'performance', 'agility', 'speed', 'explosive']
}

function normalizePrimaryGoal(goal) {
  if (!goal || typeof goal !== 'string') return 'general_fitness'
  const g = goal.trim()
  return PRIMARY_GOALS.includes(g) ? g : 'general_fitness'
}

/**
 * Score a trainer row (with specialties array) for the user's primary goal
 * @returns {number} non-negative score; 0 = no keyword overlap
 */
function scoreTrainerForGoal(specialties, primaryGoal) {
  const goal = normalizePrimaryGoal(primaryGoal)
  const keywords = GOAL_TO_KEYWORDS[goal] || GOAL_TO_KEYWORDS.general_fitness
  if (!Array.isArray(specialties) || specialties.length === 0) {
    return goal === 'general_fitness' ? 1 : 0
  }
  let score = 0
  for (const s of specialties) {
    if (!s || typeof s !== 'string') continue
    const low = s.toLowerCase()
    for (const kw of keywords) {
      if (low.includes(kw)) score += 2
    }
    if (low.includes(goal.replace(/_/g, ' '))) score += 3
  }
  return score
}

/**
 * Sort trainers by match score descending; stable tie-breaker by userId
 */
function rankTrainersByGoal(trainersFormatted, primaryGoal) {
  const withScores = trainersFormatted.map((t) => ({
    ...t,
    matchScore: scoreTrainerForGoal(t.specialties, primaryGoal)
  }))
  withScores.sort((a, b) => {
    if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore
    return (a.userId || 0) - (b.userId || 0)
  })
  return withScores
}

module.exports = {
  PRIMARY_GOALS,
  GOAL_TO_KEYWORDS,
  normalizePrimaryGoal,
  scoreTrainerForGoal,
  rankTrainersByGoal
}
