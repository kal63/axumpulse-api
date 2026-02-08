'use strict'

const { sequelize } = require('../db/sequelize')
const { DataTypes } = require('sequelize')

// Models
const Language = require('./Language')(sequelize, DataTypes)
const User = require('./User')(sequelize, DataTypes)
const UserProfile = require('./UserProfile')(sequelize, DataTypes)
const Trainer = require('./Trainer')(sequelize, DataTypes)
const TrainerApplication = require('./TrainerApplication')(sequelize, DataTypes)
const TrainerSite = require('./TrainerSite')(sequelize, DataTypes)
const CertificationFile = require('./CertificationFile')(sequelize, DataTypes)
const SubscriptionAccess = require('./SubscriptionAccess')(sequelize, DataTypes)
const Challenge = require('./Challenge')(sequelize, DataTypes)
const Reward = require('./Reward')(sequelize, DataTypes)
const Content = require('./Content')(sequelize, DataTypes)
const WorkoutPlan = require('./WorkoutPlan')(sequelize, DataTypes)
const WorkoutExercise = require('./WorkoutExercise')(sequelize, DataTypes)
const UserContentProgress = require('./UserContentProgress')(sequelize, DataTypes)
const UserWorkoutPlanProgress = require('./UserWorkoutPlanProgress')(sequelize, DataTypes)
const UserExerciseProgress = require('./UserExerciseProgress')(sequelize, DataTypes)
const UserChallengeProgress = require('./UserChallengeProgress')(sequelize, DataTypes)
const Achievement = require('./Achievement')(sequelize, DataTypes)
const UserAchievement = require('./UserAchievement')(sequelize, DataTypes)
const Game = require('./Game')(sequelize, DataTypes)
const UserGameProgress = require('./UserGameProgress')(sequelize, DataTypes)
const DailyChallengeProgress = require('./DailyChallengeProgress')(sequelize, DataTypes)

// Medical layer (new)
const MedicalProfessionalApplication = require('./MedicalProfessionalApplication')(sequelize, DataTypes)
const MedicalCredentialFile = require('./MedicalCredentialFile')(sequelize, DataTypes)
const MedicalProfessional = require('./MedicalProfessional')(sequelize, DataTypes)
const UserMedicalProfile = require('./UserMedicalProfile')(sequelize, DataTypes)
const IntakeForm = require('./IntakeForm')(sequelize, DataTypes)
const IntakeResponse = require('./IntakeResponse')(sequelize, DataTypes)
const TriageRule = require('./TriageRule')(sequelize, DataTypes)
const TriageRun = require('./TriageRun')(sequelize, DataTypes)
const MedicalQuestion = require('./MedicalQuestion')(sequelize, DataTypes)
const MedicalAnswer = require('./MedicalAnswer')(sequelize, DataTypes)
const MedicalAttachment = require('./MedicalAttachment')(sequelize, DataTypes)
const ConsultSchedule = require('./ConsultSchedule')(sequelize, DataTypes)
const ConsultSlot = require('./ConsultSlot')(sequelize, DataTypes)
const ConsultBooking = require('./ConsultBooking')(sequelize, DataTypes)
const ConsultNote = require('./ConsultNote')(sequelize, DataTypes)
const HealthDataPoint = require('./HealthDataPoint')(sequelize, DataTypes)
const HealthDataRollup = require('./HealthDataRollup')(sequelize, DataTypes)
const HealthAlert = require('./HealthAlert')(sequelize, DataTypes)
const WorkoutPlanInsight = require('./WorkoutPlanInsight')(sequelize, DataTypes)
const SubscriptionPlan = require('./SubscriptionPlan')(sequelize, DataTypes)
const UserSubscription = require('./UserSubscription')(sequelize, DataTypes)
const PaymentTransaction = require('./PaymentTransaction')(sequelize, DataTypes)

const models = {
    Language,
    User,
    UserProfile,
    Trainer,
    TrainerApplication,
    TrainerSite,
    CertificationFile,
    SubscriptionAccess,
    Challenge,
    Reward,
    Content,
    WorkoutPlan,
    WorkoutExercise,
    UserContentProgress,
    UserWorkoutPlanProgress,
    UserExerciseProgress,
    UserChallengeProgress,
    Achievement,
    UserAchievement,
    Game,
    UserGameProgress,
    DailyChallengeProgress,

    // Medical layer exports
    MedicalProfessionalApplication,
    MedicalCredentialFile,
    MedicalProfessional,
    UserMedicalProfile,
    IntakeForm,
    IntakeResponse,
    TriageRule,
    TriageRun,
    MedicalQuestion,
    MedicalAnswer,
    MedicalAttachment,
    ConsultSchedule,
    ConsultSlot,
    ConsultBooking,
    ConsultNote,
    HealthDataPoint,
    HealthDataRollup,
    HealthAlert,
    WorkoutPlanInsight,
    SubscriptionPlan,
    UserSubscription,
    PaymentTransaction
}

// Associations
Object.values(models).forEach((model) => {
    if (typeof model.associate === 'function') {
        model.associate(models)
    }
})

module.exports = { sequelize, ...models }


