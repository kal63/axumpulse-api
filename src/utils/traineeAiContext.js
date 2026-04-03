'use strict'

const { getUserMedicalContext } = require('./WorkoutPlanInsightGenerator')
const {
  UserProfile,
  UserWorkoutPlanProgress,
  UserChallengeProgress,
  HealthDataPoint
} = require('../models')
const { mergeAiContextSharing } = require('./defaultAiContextSharing')

/**
 * Build a text block for the trainee AI coach from user data & consent flags.
 */
async function buildTraineeAiContextBlock(userId, sharingOverrides = {}) {
  const profile = await UserProfile.findOne({ where: { userId } })
  const sharing = mergeAiContextSharing({
    ...(profile?.preferences?.aiContextSharing || {}),
    ...sharingOverrides
  })

  const parts = []

  if (sharing.goalsAndMetrics && profile) {
    const fg = profile.fitnessGoals || {}
    const hm = profile.healthMetrics || {}
    parts.push(`TRAINING PROFILE:
Primary goal: ${fg.primary || 'general_fitness'}
Secondary goals: ${(fg.secondary || []).join(', ') || 'none'}
Target weight: ${fg.targetWeight != null ? fg.targetWeight : 'n/a'}
Height (cm): ${hm.height != null ? hm.height : 'n/a'}
Weight (kg): ${hm.weight != null ? hm.weight : 'n/a'}
Activity level: ${hm.activityLevel || 'n/a'}
Fitness level: ${fg.fitnessLevel || 'n/a'}`)
  }

  if (sharing.workoutProgress || sharing.challengesProgress || sharing.xpAndStreaks) {
    const counts = {}
    if (sharing.workoutProgress) {
      counts.workoutPlansCompleted = await UserWorkoutPlanProgress.count({
        where: { userId, status: 'completed' }
      })
      counts.workoutPlansActive = await UserWorkoutPlanProgress.count({
        where: { userId, status: 'active' }
      })
    }
    if (sharing.challengesProgress) {
      counts.challengesCompleted = await UserChallengeProgress.count({
        where: { userId, status: 'completed' }
      })
    }
    if (sharing.xpAndStreaks && profile) {
      counts.totalXp = profile.totalXp
      counts.workoutsCompleted = profile.workoutsCompleted
      counts.challengesCompletedProfile = profile.challengesCompleted
      counts.dailyChallengeStreak = profile.dailyChallengeStreak
    }
    parts.push(`PROGRESS SUMMARY:\n${JSON.stringify(counts, null, 2)}`)
  }

  if (sharing.medicalProfile || sharing.intakeResponses || sharing.triageRuns || sharing.consultNotes) {
    const med = await getUserMedicalContext(userId)
    if (sharing.medicalProfile && med.medicalProfile) {
      const p = med.medicalProfile
      parts.push(`MEDICAL PROFILE (user-consented):
Conditions: ${(p.conditions || []).join(', ') || 'none'}
Medications: ${(p.medications || []).join(', ') || 'none'}
Allergies: ${(p.allergies || []).join(', ') || 'none'}`)
    }
    if (sharing.intakeResponses && med.intakeResponse) {
      parts.push(`RECENT INTAKE (summary): ${JSON.stringify(med.intakeResponse.answers || {}).slice(0, 2000)}`)
    }
    if (sharing.triageRuns && med.triageRun) {
      parts.push(`RECENT TRIAGE: disposition=${med.triageRun.disposition || 'n/a'}, risk=${med.triageRun.riskLevel || 'n/a'}`)
    }
    if (sharing.consultNotes && med.consultNote) {
      const n = med.consultNote
      const rec = typeof n.recommendations === 'string' ? n.recommendations : JSON.stringify(n.recommendations || [])
      const con = typeof n.constraints === 'string' ? n.constraints : JSON.stringify(n.constraints || {})
      parts.push(`RECENT CONSULT NOTE (summary): recommendations=${rec.slice(0, 1500)} constraints=${con.slice(0, 800)}`)
    }
  }

  if (sharing.healthDataPoints) {
    const points = await HealthDataPoint.findAll({
      where: { userId },
      order: [['capturedAt', 'DESC']],
      limit: 12
    })
    if (points.length) {
      parts.push(`RECENT HEALTH DATA POINTS:\n${points.map((d) => `${d.metric}:${d.value}@${d.capturedAt}`).join('\n')}`)
    }
  }

  return parts.filter(Boolean).join('\n\n') || 'No additional profile context (user has not enabled sharing or has no data).'
}

module.exports = { buildTraineeAiContextBlock }
