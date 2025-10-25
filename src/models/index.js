'use strict'

const { sequelize } = require('../db/sequelize')
const { DataTypes } = require('sequelize')

// Models
const Language = require('./Language')(sequelize, DataTypes)
const User = require('./User')(sequelize, DataTypes)
const UserProfile = require('./UserProfile')(sequelize, DataTypes)
const Trainer = require('./Trainer')(sequelize, DataTypes)
const TrainerApplication = require('./TrainerApplication')(sequelize, DataTypes)
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

const models = { Language, User, UserProfile, Trainer, TrainerApplication, CertificationFile, SubscriptionAccess, Challenge, Reward, Content, WorkoutPlan, WorkoutExercise, UserContentProgress, UserWorkoutPlanProgress, UserExerciseProgress, UserChallengeProgress, Achievement, UserAchievement }

// Associations
Object.values(models).forEach((model) => {
    if (typeof model.associate === 'function') {
        model.associate(models)
    }
})

module.exports = { sequelize, ...models }


