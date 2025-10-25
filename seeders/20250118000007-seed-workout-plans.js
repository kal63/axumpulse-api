'use strict';

const { WorkoutPlan, WorkoutExercise, Trainer, User } = require('../src/models');

module.exports = {
    async up(queryInterface, Sequelize) {
        try {
            // Get all trainers to assign workout plans to
            const trainers = await Trainer.findAll({
                include: [{ model: User, as: 'User' }]
            });

            if (trainers.length === 0) {
                console.log('No trainers found. Please run trainer seeder first.');
                return;
            }

            // Exercise templates for different categories
            const exerciseTemplates = {
                cardio: [
                    { name: 'Running', description: 'Cardio running exercise', category: 'cardio', muscleGroups: ['legs', 'core'], equipment: 'none', sets: 1, reps: '30 min', duration: 30 },
                    { name: 'Cycling', description: 'Stationary or outdoor cycling', category: 'cardio', muscleGroups: ['legs', 'glutes'], equipment: 'bike', sets: 1, reps: '45 min', duration: 45 },
                    { name: 'Jump Rope', description: 'High-intensity jump rope workout', category: 'cardio', muscleGroups: ['legs', 'calves', 'core'], equipment: 'jump rope', sets: 3, reps: '2 min', duration: 6 },
                    { name: 'Burpees', description: 'Full-body cardio exercise', category: 'cardio', muscleGroups: ['full body'], equipment: 'none', sets: 4, reps: '15', duration: 0 },
                    { name: 'Mountain Climbers', description: 'High-intensity cardio movement', category: 'cardio', muscleGroups: ['core', 'legs', 'shoulders'], equipment: 'none', sets: 3, reps: '30 sec', duration: 0 },
                    { name: 'High Knees', description: 'Running in place with high knees', category: 'cardio', muscleGroups: ['legs', 'core'], equipment: 'none', sets: 3, reps: '1 min', duration: 0 },
                    { name: 'Box Jumps', description: 'Explosive jumping exercise', category: 'cardio', muscleGroups: ['legs', 'glutes'], equipment: 'box', sets: 3, reps: '12', duration: 0 },
                    { name: 'Rowing Machine', description: 'Full-body cardio on rowing machine', category: 'cardio', muscleGroups: ['back', 'legs', 'arms'], equipment: 'rowing machine', sets: 1, reps: '20 min', duration: 20 }
                ],
                strength: [
                    { name: 'Push-ups', description: 'Classic upper body exercise', category: 'strength', muscleGroups: ['chest', 'shoulders', 'triceps'], equipment: 'none', sets: 3, reps: '15', duration: 0 },
                    { name: 'Pull-ups', description: 'Upper body pulling exercise', category: 'strength', muscleGroups: ['back', 'biceps'], equipment: 'pull-up bar', sets: 3, reps: '8', duration: 0 },
                    { name: 'Squats', description: 'Lower body compound movement', category: 'strength', muscleGroups: ['legs', 'glutes'], equipment: 'none', sets: 4, reps: '20', duration: 0 },
                    { name: 'Deadlifts', description: 'Hip hinge movement', category: 'strength', muscleGroups: ['back', 'legs', 'glutes'], equipment: 'barbell', sets: 4, reps: '8', duration: 0 },
                    { name: 'Bench Press', description: 'Chest pressing exercise', category: 'strength', muscleGroups: ['chest', 'shoulders', 'triceps'], equipment: 'barbell', sets: 4, reps: '10', duration: 0 },
                    { name: 'Overhead Press', description: 'Shoulder pressing movement', category: 'strength', muscleGroups: ['shoulders', 'triceps'], equipment: 'dumbbells', sets: 3, reps: '12', duration: 0 },
                    { name: 'Bent-over Rows', description: 'Back pulling exercise', category: 'strength', muscleGroups: ['back', 'biceps'], equipment: 'barbell', sets: 4, reps: '10', duration: 0 },
                    { name: 'Lunges', description: 'Single-leg lower body exercise', category: 'strength', muscleGroups: ['legs', 'glutes'], equipment: 'none', sets: 3, reps: '12 each', duration: 0 },
                    { name: 'Plank', description: 'Core stability exercise', category: 'strength', muscleGroups: ['core'], equipment: 'none', sets: 3, reps: '1 min', duration: 0 },
                    { name: 'Dips', description: 'Tricep and chest exercise', category: 'strength', muscleGroups: ['triceps', 'chest'], equipment: 'dip bars', sets: 3, reps: '10', duration: 0 }
                ],
                yoga: [
                    { name: 'Downward Dog', description: 'Classic yoga pose', category: 'yoga', muscleGroups: ['full body'], equipment: 'yoga mat', sets: 1, reps: '5 breaths', duration: 0 },
                    { name: 'Warrior I', description: 'Standing yoga pose', category: 'yoga', muscleGroups: ['legs', 'core'], equipment: 'yoga mat', sets: 1, reps: '5 breaths each', duration: 0 },
                    { name: 'Warrior II', description: 'Hip-opening standing pose', category: 'yoga', muscleGroups: ['legs', 'hips'], equipment: 'yoga mat', sets: 1, reps: '5 breaths each', duration: 0 },
                    { name: 'Tree Pose', description: 'Balance and focus pose', category: 'yoga', muscleGroups: ['legs', 'core'], equipment: 'yoga mat', sets: 1, reps: '5 breaths each', duration: 0 },
                    { name: 'Child\'s Pose', description: 'Restorative resting pose', category: 'yoga', muscleGroups: ['back', 'hips'], equipment: 'yoga mat', sets: 1, reps: '10 breaths', duration: 0 },
                    { name: 'Cat-Cow Stretch', description: 'Spinal mobility exercise', category: 'yoga', muscleGroups: ['back', 'core'], equipment: 'yoga mat', sets: 1, reps: '10 cycles', duration: 0 },
                    { name: 'Sun Salutation', description: 'Flowing yoga sequence', category: 'yoga', muscleGroups: ['full body'], equipment: 'yoga mat', sets: 3, reps: '1 round', duration: 0 },
                    { name: 'Bridge Pose', description: 'Hip and back strengthening', category: 'yoga', muscleGroups: ['glutes', 'back'], equipment: 'yoga mat', sets: 1, reps: '5 breaths', duration: 0 }
                ],
                wellness: [
                    { name: 'Meditation', description: 'Mindfulness and relaxation', category: 'wellness', muscleGroups: ['mind'], equipment: 'none', sets: 1, reps: '10 min', duration: 10 },
                    { name: 'Deep Breathing', description: 'Stress relief breathing exercise', category: 'wellness', muscleGroups: ['core'], equipment: 'none', sets: 1, reps: '5 min', duration: 5 },
                    { name: 'Stretching', description: 'Full body flexibility routine', category: 'wellness', muscleGroups: ['full body'], equipment: 'none', sets: 1, reps: '15 min', duration: 15 },
                    { name: 'Walking', description: 'Low-impact cardio and relaxation', category: 'wellness', muscleGroups: ['legs'], equipment: 'none', sets: 1, reps: '30 min', duration: 30 },
                    { name: 'Tai Chi', description: 'Gentle martial arts movement', category: 'wellness', muscleGroups: ['full body'], equipment: 'none', sets: 1, reps: '20 min', duration: 20 },
                    { name: 'Foam Rolling', description: 'Self-myofascial release', category: 'wellness', muscleGroups: ['full body'], equipment: 'foam roller', sets: 1, reps: '10 min', duration: 10 }
                ]
            };

            // Workout plan templates
            const workoutTemplates = [
                // Cardio Workouts
                { title: 'Morning Cardio Blast', description: 'High-energy cardio workout to start your day', difficulty: 'beginner', category: 'cardio', tags: ['morning', 'cardio', 'energy'], estimatedDuration: 30 },
                { title: 'HIIT Cardio Challenge', description: 'High-intensity interval training for maximum calorie burn', difficulty: 'intermediate', category: 'cardio', tags: ['hiit', 'cardio', 'intense'], estimatedDuration: 25 },
                { title: 'Endurance Running', description: 'Build cardiovascular endurance with this running workout', difficulty: 'advanced', category: 'cardio', tags: ['running', 'endurance', 'cardio'], estimatedDuration: 45 },
                { title: 'Dance Cardio Party', description: 'Fun dance-based cardio workout', difficulty: 'beginner', category: 'cardio', tags: ['dance', 'fun', 'cardio'], estimatedDuration: 35 },
                { title: 'Cycling Adventure', description: 'Indoor cycling workout for all fitness levels', difficulty: 'intermediate', category: 'cardio', tags: ['cycling', 'indoor', 'cardio'], estimatedDuration: 40 },

                // Strength Workouts
                { title: 'Upper Body Power', description: 'Build strength in your upper body', difficulty: 'intermediate', category: 'strength', tags: ['upper body', 'strength', 'muscle'], estimatedDuration: 45 },
                { title: 'Lower Body Blast', description: 'Intense lower body strength training', difficulty: 'advanced', category: 'strength', tags: ['legs', 'glutes', 'strength'], estimatedDuration: 50 },
                { title: 'Full Body Strength', description: 'Complete strength workout for entire body', difficulty: 'intermediate', category: 'strength', tags: ['full body', 'strength', 'muscle'], estimatedDuration: 60 },
                { title: 'Core Crusher', description: 'Target your core with these challenging exercises', difficulty: 'advanced', category: 'strength', tags: ['core', 'abs', 'strength'], estimatedDuration: 30 },
                { title: 'Beginner Strength', description: 'Perfect introduction to strength training', difficulty: 'beginner', category: 'strength', tags: ['beginner', 'strength', 'muscle'], estimatedDuration: 35 },
                { title: 'Push Day', description: 'Focus on pushing movements for chest, shoulders, and triceps', difficulty: 'intermediate', category: 'strength', tags: ['push', 'chest', 'shoulders'], estimatedDuration: 50 },
                { title: 'Pull Day', description: 'Target pulling muscles in back and biceps', difficulty: 'intermediate', category: 'strength', tags: ['pull', 'back', 'biceps'], estimatedDuration: 50 },
                { title: 'Leg Day', description: 'Comprehensive leg and glute workout', difficulty: 'advanced', category: 'strength', tags: ['legs', 'glutes', 'squats'], estimatedDuration: 55 },

                // Yoga Workouts
                { title: 'Morning Yoga Flow', description: 'Gentle yoga to start your day with energy', difficulty: 'beginner', category: 'yoga', tags: ['morning', 'yoga', 'gentle'], estimatedDuration: 25 },
                { title: 'Power Yoga', description: 'Dynamic yoga flow for strength and flexibility', difficulty: 'intermediate', category: 'yoga', tags: ['power', 'yoga', 'dynamic'], estimatedDuration: 45 },
                { title: 'Yin Yoga', description: 'Deep stretching and relaxation', difficulty: 'beginner', category: 'yoga', tags: ['yin', 'stretching', 'relaxation'], estimatedDuration: 60 },
                { title: 'Vinyasa Flow', description: 'Flowing yoga sequence connecting breath and movement', difficulty: 'intermediate', category: 'yoga', tags: ['vinyasa', 'flow', 'breath'], estimatedDuration: 40 },
                { title: 'Yoga for Flexibility', description: 'Focus on improving flexibility and range of motion', difficulty: 'beginner', category: 'yoga', tags: ['flexibility', 'stretching', 'yoga'], estimatedDuration: 35 },
                { title: 'Advanced Yoga', description: 'Challenging yoga poses for experienced practitioners', difficulty: 'advanced', category: 'yoga', tags: ['advanced', 'yoga', 'challenging'], estimatedDuration: 50 },

                // Wellness Workouts
                { title: 'Stress Relief', description: 'Gentle movements to reduce stress and tension', difficulty: 'beginner', category: 'wellness', tags: ['stress relief', 'relaxation', 'wellness'], estimatedDuration: 20 },
                { title: 'Mindful Movement', description: 'Combine movement with mindfulness practices', difficulty: 'beginner', category: 'wellness', tags: ['mindfulness', 'movement', 'wellness'], estimatedDuration: 30 },
                { title: 'Recovery Session', description: 'Gentle recovery workout for rest days', difficulty: 'beginner', category: 'wellness', tags: ['recovery', 'rest day', 'gentle'], estimatedDuration: 25 },
                { title: 'Breathing & Stretching', description: 'Focus on breathwork and gentle stretching', difficulty: 'beginner', category: 'wellness', tags: ['breathing', 'stretching', 'relaxation'], estimatedDuration: 20 },
                { title: 'Evening Wind Down', description: 'Perfect workout to end your day', difficulty: 'beginner', category: 'wellness', tags: ['evening', 'wind down', 'relaxation'], estimatedDuration: 25 },

                // Mixed Workouts
                { title: 'Cardio & Strength Combo', description: 'Combine cardio and strength training', difficulty: 'intermediate', category: 'strength', tags: ['cardio', 'strength', 'combo'], estimatedDuration: 50 },
                { title: 'Yoga & Strength', description: 'Blend yoga flexibility with strength training', difficulty: 'intermediate', category: 'yoga', tags: ['yoga', 'strength', 'flexibility'], estimatedDuration: 45 },
                { title: 'HIIT & Core', description: 'High-intensity intervals with core focus', difficulty: 'advanced', category: 'strength', tags: ['hiit', 'core', 'intense'], estimatedDuration: 30 },
                { title: 'Full Body Fusion', description: 'Complete workout combining all elements', difficulty: 'advanced', category: 'strength', tags: ['full body', 'fusion', 'complete'], estimatedDuration: 60 },
                { title: 'Quick 15-Minute', description: 'Fast and effective 15-minute workout', difficulty: 'beginner', category: 'cardio', tags: ['quick', '15 min', 'efficient'], estimatedDuration: 15 },
                { title: '30-Minute Power', description: 'Intense 30-minute power workout', difficulty: 'intermediate', category: 'strength', tags: ['30 min', 'power', 'intense'], estimatedDuration: 30 },
                { title: '45-Minute Challenge', description: 'Comprehensive 45-minute fitness challenge', difficulty: 'advanced', category: 'strength', tags: ['45 min', 'challenge', 'comprehensive'], estimatedDuration: 45 },
                { title: 'Beginner\'s Choice', description: 'Perfect starting point for fitness beginners', difficulty: 'beginner', category: 'wellness', tags: ['beginner', 'starting', 'gentle'], estimatedDuration: 25 },
                { title: 'Intermediate Intensity', description: 'Moderate intensity workout for intermediate fitness', difficulty: 'intermediate', category: 'strength', tags: ['intermediate', 'moderate', 'intensity'], estimatedDuration: 40 },
                { title: 'Advanced Athlete', description: 'High-level workout for advanced athletes', difficulty: 'advanced', category: 'strength', tags: ['advanced', 'athlete', 'high level'], estimatedDuration: 65 },
                { title: 'Weight Loss Focus', description: 'Calorie-burning workout for weight loss', difficulty: 'intermediate', category: 'cardio', tags: ['weight loss', 'calorie burn', 'cardio'], estimatedDuration: 40 },
                { title: 'Muscle Building', description: 'Strength-focused workout for muscle growth', difficulty: 'advanced', category: 'strength', tags: ['muscle building', 'strength', 'growth'], estimatedDuration: 55 },
                { title: 'Flexibility Focus', description: 'Improve flexibility and mobility', difficulty: 'beginner', category: 'yoga', tags: ['flexibility', 'mobility', 'stretching'], estimatedDuration: 35 },
                { title: 'Balance & Stability', description: 'Enhance balance and core stability', difficulty: 'intermediate', category: 'yoga', tags: ['balance', 'stability', 'core'], estimatedDuration: 30 },
                { title: 'Posture Perfect', description: 'Exercises to improve posture and alignment', difficulty: 'beginner', category: 'wellness', tags: ['posture', 'alignment', 'wellness'], estimatedDuration: 25 },
                { title: 'Energy Boost', description: 'Quick workout to increase energy levels', difficulty: 'beginner', category: 'cardio', tags: ['energy', 'boost', 'quick'], estimatedDuration: 20 },
                { title: 'Sleep Better', description: 'Evening routine to promote better sleep', difficulty: 'beginner', category: 'wellness', tags: ['sleep', 'evening', 'relaxation'], estimatedDuration: 20 },
                { title: 'Office Worker Relief', description: 'Exercises to counteract desk work', difficulty: 'beginner', category: 'wellness', tags: ['office', 'desk work', 'relief'], estimatedDuration: 15 },
                { title: 'Travel Workout', description: 'No-equipment workout for travelers', difficulty: 'beginner', category: 'strength', tags: ['travel', 'no equipment', 'portable'], estimatedDuration: 25 },
                { title: 'Senior Fitness', description: 'Gentle exercises designed for seniors', difficulty: 'beginner', category: 'wellness', tags: ['senior', 'gentle', 'safe'], estimatedDuration: 30 },
                { title: 'Prenatal Safe', description: 'Safe exercises for expecting mothers', difficulty: 'beginner', category: 'wellness', tags: ['prenatal', 'pregnancy', 'safe'], estimatedDuration: 25 },
                { title: 'Postnatal Recovery', description: 'Gentle recovery exercises after childbirth', difficulty: 'beginner', category: 'wellness', tags: ['postnatal', 'recovery', 'gentle'], estimatedDuration: 20 },
                { title: 'Kids Fitness', description: 'Fun exercises designed for children', difficulty: 'beginner', category: 'cardio', tags: ['kids', 'fun', 'active'], estimatedDuration: 20 },
                { title: 'Family Workout', description: 'Exercises the whole family can enjoy', difficulty: 'beginner', category: 'cardio', tags: ['family', 'fun', 'together'], estimatedDuration: 25 },
                { title: 'Couples Workout', description: 'Partner exercises for couples', difficulty: 'intermediate', category: 'strength', tags: ['couples', 'partner', 'fun'], estimatedDuration: 35 },
                { title: 'Group Fitness', description: 'Exercises perfect for group classes', difficulty: 'intermediate', category: 'cardio', tags: ['group', 'class', 'social'], estimatedDuration: 45 },
                { title: 'Home Gym', description: 'Complete home gym workout routine', difficulty: 'intermediate', category: 'strength', tags: ['home gym', 'equipment', 'complete'], estimatedDuration: 50 },
                { title: 'Outdoor Adventure', description: 'Exercises designed for outdoor settings', difficulty: 'intermediate', category: 'cardio', tags: ['outdoor', 'adventure', 'nature'], estimatedDuration: 40 },
                { title: 'Beach Body', description: 'Get ready for beach season', difficulty: 'intermediate', category: 'strength', tags: ['beach body', 'summer', 'toning'], estimatedDuration: 45 },
                { title: 'Holiday Fitness', description: 'Stay fit during the holidays', difficulty: 'beginner', category: 'cardio', tags: ['holiday', 'maintenance', 'fun'], estimatedDuration: 30 },
                { title: 'New Year Resolution', description: 'Start your fitness journey right', difficulty: 'beginner', category: 'wellness', tags: ['new year', 'resolution', 'start'], estimatedDuration: 25 },
                { title: 'Summer Shred', description: 'Get lean for summer', difficulty: 'advanced', category: 'strength', tags: ['summer', 'shred', 'lean'], estimatedDuration: 50 },
                { title: 'Winter Warm-up', description: 'Stay active during winter months', difficulty: 'intermediate', category: 'cardio', tags: ['winter', 'warm-up', 'indoor'], estimatedDuration: 35 }
            ];

            const workoutPlans = [];
            const exercises = [];

            // Generate 50 workout plans
            for (let i = 0; i < 50; i++) {
                const template = workoutTemplates[i % workoutTemplates.length];
                const trainer = trainers[i % trainers.length];

                const workoutPlan = await WorkoutPlan.create({
                    trainerId: trainer.userId,
                    title: `${template.title} ${i + 1}`,
                    description: template.description,
                    difficulty: template.difficulty,
                    category: template.category,
                    language: 'en',
                    tags: template.tags,
                    isPublic: Math.random() > 0.3, // 70% public
                    status: ['draft', 'pending', 'approved'][Math.floor(Math.random() * 3)],
                    estimatedDuration: template.estimatedDuration,
                    totalExercises: 0 // Will be updated after exercises are created
                });

                workoutPlans.push(workoutPlan);

                // Generate 5-12 exercises per workout plan
                const exerciseCount = Math.floor(Math.random() * 8) + 5; // 5-12 exercises
                const categoryExercises = exerciseTemplates[template.category] || exerciseTemplates.strength;

                for (let j = 0; j < exerciseCount; j++) {
                    const exerciseTemplate = categoryExercises[j % categoryExercises.length];

                    const exercise = await WorkoutExercise.create({
                        workoutPlanId: workoutPlan.id,
                        name: exerciseTemplate.name,
                        description: exerciseTemplate.description,
                        category: exerciseTemplate.category,
                        muscleGroups: exerciseTemplate.muscleGroups,
                        equipment: exerciseTemplate.equipment,
                        sets: exerciseTemplate.sets,
                        reps: exerciseTemplate.reps,
                        weight: exerciseTemplate.equipment !== 'none' ? 'body weight' : null,
                        duration: exerciseTemplate.duration,
                        restTime: Math.floor(Math.random() * 60) + 30, // 30-90 seconds
                        order: j + 1,
                        notes: `Focus on proper form and controlled movements. ${exerciseTemplate.name} is great for building ${exerciseTemplate.muscleGroups.join(' and ')} strength.`
                    });

                    exercises.push(exercise);
                }

                // Update total exercises count
                await workoutPlan.update({ totalExercises: exerciseCount });
            }

            console.log(`✅ Created ${workoutPlans.length} workout plans with ${exercises.length} exercises`);

        } catch (error) {
            console.error('❌ Error seeding workout plans:', error);
            throw error;
        }
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('WorkoutExercises', null, {});
        await queryInterface.bulkDelete('WorkoutPlans', null, {});
    }
};


