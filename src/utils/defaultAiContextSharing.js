'use strict'

/**
 * Defaults: sensitive medical data off; fitness/progress on for a useful coach.
 */
function getDefaultAiContextSharing() {
  return {
    goalsAndMetrics: true,
    workoutProgress: true,
    challengesProgress: true,
    xpAndStreaks: true,
    medicalProfile: false,
    intakeResponses: false,
    triageRuns: false,
    consultNotes: false,
    healthDataPoints: false
  }
}

function mergeAiContextSharing(stored) {
  return { ...getDefaultAiContextSharing(), ...(stored && typeof stored === 'object' ? stored : {}) }
}

module.exports = { getDefaultAiContextSharing, mergeAiContextSharing }
