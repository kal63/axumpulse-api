-- MySQL dump 10.13  Distrib 8.2.0, for macos12.5 (arm64)
--
-- Host: 127.0.0.1    Database: axumpulse
-- ------------------------------------------------------
-- Server version	8.2.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Current Database: `axumpulse`
--

/*!40000 DROP DATABASE IF EXISTS `axumpulse`*/;

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `axumpulse` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;

USE `axumpulse`;

--
-- Table structure for table `Achievements`
--

DROP TABLE IF EXISTS `Achievements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Achievements` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text,
  `icon` varchar(255) DEFAULT NULL COMMENT 'Icon name or emoji',
  `rarity` enum('common','rare','epic','legendary') DEFAULT 'common',
  `xpReward` int DEFAULT '0',
  `criteria` json DEFAULT NULL COMMENT 'Achievement criteria as JSON',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `achievements_rarity` (`rarity`),
  KEY `achievements_name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Achievements`
--

LOCK TABLES `Achievements` WRITE;
/*!40000 ALTER TABLE `Achievements` DISABLE KEYS */;
INSERT INTO `Achievements` (`id`, `name`, `description`, `icon`, `rarity`, `xpReward`, `criteria`, `createdAt`, `updatedAt`) VALUES (1,'First Step','Complete your first workout','👟','common',50,'{\"type\": \"workout_complete\", \"value\": 1}','2025-10-23 07:40:29','2025-10-23 07:40:29'),(2,'Getting Started','Complete 5 workouts','🏃','common',100,'{\"type\": \"workout_complete\", \"value\": 5}','2025-10-23 07:40:29','2025-10-23 07:40:29'),(3,'Early Bird','Complete a workout before 8 AM','🌅','common',75,'{\"type\": \"early_workout\", \"value\": 1}','2025-10-23 07:40:29','2025-10-23 07:40:29'),(4,'Video Fan','Watch 5 training videos','📹','common',50,'{\"type\": \"video_watch\", \"value\": 5}','2025-10-23 07:40:29','2025-10-23 07:40:29'),(5,'Week Warrior','Maintain a 7-day workout streak','🔥','rare',250,'{\"type\": \"streak\", \"value\": 7}','2025-10-23 07:40:29','2025-10-23 07:40:29'),(6,'Dedicated','Complete 25 workouts','💪','rare',300,'{\"type\": \"workout_complete\", \"value\": 25}','2025-10-23 07:40:29','2025-10-23 07:40:29'),(7,'Challenge Accepted','Complete your first challenge','🎯','rare',200,'{\"type\": \"challenge_complete\", \"value\": 1}','2025-10-23 07:40:29','2025-10-23 07:40:29'),(8,'Plan Master','Complete a full workout plan','📋','rare',500,'{\"type\": \"plan_complete\", \"value\": 1}','2025-10-23 07:40:29','2025-10-23 07:40:29'),(9,'Month Champion','Maintain a 30-day workout streak','🏆','epic',1000,'{\"type\": \"streak\", \"value\": 30}','2025-10-23 07:40:29','2025-10-23 07:40:29'),(10,'Fitness Enthusiast','Complete 50 workouts','⭐','epic',750,'{\"type\": \"workout_complete\", \"value\": 50}','2025-10-23 07:40:29','2025-10-23 07:40:29'),(11,'Challenge Hunter','Complete 5 challenges','🎖️','epic',800,'{\"type\": \"challenge_complete\", \"value\": 5}','2025-10-23 07:40:29','2025-10-23 07:40:29'),(12,'Level 10','Reach Level 10','🌟','epic',500,'{\"type\": \"level_reach\", \"value\": 10}','2025-10-23 07:40:29','2025-10-23 07:40:29'),(13,'Streak Master','Maintain a 100-day workout streak','🔥','legendary',5000,'{\"type\": \"streak\", \"value\": 100}','2025-10-23 07:40:29','2025-10-23 07:40:29'),(14,'Century Club','Complete 100 workouts','💯','legendary',2000,'{\"type\": \"workout_complete\", \"value\": 100}','2025-10-23 07:40:29','2025-10-23 07:40:29'),(15,'Ultimate Champion','Complete 10 challenges','👑','legendary',3000,'{\"type\": \"challenge_complete\", \"value\": 10}','2025-10-23 07:40:29','2025-10-23 07:40:29'),(16,'Level 25','Reach Level 25','💎','legendary',2500,'{\"type\": \"level_reach\", \"value\": 25}','2025-10-23 07:40:29','2025-10-23 07:40:29'),(17,'Social Butterfly','Like 50 videos','❤️','common',100,'{\"type\": \"like_count\", \"value\": 50}','2025-10-23 07:40:29','2025-10-23 07:40:29'),(18,'Content Creator','Save 25 videos for later','💾','common',75,'{\"type\": \"save_count\", \"value\": 25}','2025-10-23 07:40:29','2025-10-23 07:40:29'),(19,'Weekend Warrior','Complete workouts on 10 weekends','🗓️','rare',300,'{\"type\": \"weekend_workouts\", \"value\": 10}','2025-10-23 07:40:29','2025-10-23 07:40:29'),(20,'All-Rounder','Complete workout plans in 3 different categories','🎨','epic',600,'{\"type\": \"category_diversity\", \"value\": 3}','2025-10-23 07:40:29','2025-10-23 07:40:29');
/*!40000 ALTER TABLE `Achievements` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `CertificationFiles`
--

DROP TABLE IF EXISTS `CertificationFiles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `CertificationFiles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `applicationId` int NOT NULL,
  `fileName` varchar(255) NOT NULL,
  `fileUrl` varchar(500) NOT NULL,
  `fileType` varchar(50) NOT NULL,
  `fileSize` int NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `certification_files_application_id` (`applicationId`),
  CONSTRAINT `certificationfiles_ibfk_1` FOREIGN KEY (`applicationId`) REFERENCES `TrainerApplications` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `CertificationFiles`
--

LOCK TABLES `CertificationFiles` WRITE;
/*!40000 ALTER TABLE `CertificationFiles` DISABLE KEYS */;
INSERT INTO `CertificationFiles` (`id`, `applicationId`, `fileName`, `fileUrl`, `fileType`, `fileSize`, `createdAt`, `updatedAt`) VALUES (6,3,'unnamed.jpg','/api/v1/uploads/applications/application_1761175296888-482476794.jpg','image/jpeg',202001,'2025-10-23 02:21:36','2025-10-23 02:21:36');
/*!40000 ALTER TABLE `CertificationFiles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Challenges`
--

DROP TABLE IF EXISTS `Challenges`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Challenges` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `description` text,
  `kind` varchar(32) NOT NULL,
  `ruleJson` json NOT NULL,
  `startTime` datetime NOT NULL,
  `endTime` datetime NOT NULL,
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `createdBy` int DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `type` enum('fitness','nutrition','wellness','achievement') DEFAULT 'fitness',
  `difficulty` enum('beginner','intermediate','advanced') DEFAULT 'beginner',
  `duration` int DEFAULT '7',
  `xpReward` int DEFAULT '100',
  `requirements` text,
  `contentIds` json DEFAULT NULL,
  `language` varchar(5) DEFAULT 'en',
  `status` enum('draft','pending','approved','rejected','active') DEFAULT 'draft',
  `rejectionReason` text,
  `participantCount` int DEFAULT '0',
  `completionCount` int DEFAULT '0',
  `isPublic` tinyint(1) DEFAULT '1',
  `isTrainerCreated` tinyint(1) DEFAULT '0',
  `trainerId` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `challenges_trainer_id` (`trainerId`),
  KEY `challenges_status` (`status`),
  KEY `challenges_type` (`type`),
  KEY `challenges_difficulty` (`difficulty`),
  KEY `challenges_is_public` (`isPublic`),
  KEY `challenges_is_trainer_created` (`isTrainerCreated`),
  KEY `challenges_start_time_idx` (`startTime`),
  KEY `challenges_end_time_idx` (`endTime`),
  CONSTRAINT `challenges_ibfk_1` FOREIGN KEY (`trainerId`) REFERENCES `trainers` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `check_challenge_dates` CHECK ((`endTime` > `startTime`))
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Challenges`
--

LOCK TABLES `Challenges` WRITE;
/*!40000 ALTER TABLE `Challenges` DISABLE KEYS */;
INSERT INTO `Challenges` (`id`, `title`, `description`, `kind`, `ruleJson`, `startTime`, `endTime`, `active`, `createdBy`, `createdAt`, `updatedAt`, `type`, `difficulty`, `duration`, `xpReward`, `requirements`, `contentIds`, `language`, `status`, `rejectionReason`, `participantCount`, `completionCount`, `isPublic`, `isTrainerCreated`, `trainerId`) VALUES (6,'30-Day Fitness Challenge','Complete a workout every day for 30 days to build a healthy habit.','daily','{\"points\": 100, \"target\": \"workout\", \"duration\": 30, \"frequency\": \"daily\"}','2025-10-17 03:27:20','2025-11-16 03:27:20',1,NULL,'2025-10-17 03:27:20','2025-10-17 03:27:20','fitness','beginner',7,100,NULL,NULL,'en','draft',NULL,0,0,1,0,NULL),(7,'Weekly Water Intake','Drink 8 glasses of water every day for a week.','weekly','{\"unit\": \"glasses\", \"amount\": 8, \"points\": 50, \"target\": \"water\", \"frequency\": \"daily\"}','2025-10-17 03:27:20','2025-10-24 03:27:20',1,NULL,'2025-10-17 03:27:20','2025-10-17 03:27:20','fitness','beginner',7,100,NULL,NULL,'en','draft',NULL,0,0,1,0,NULL),(8,'One-Time Achievement','Complete your first workout to unlock this achievement.','oneoff','{\"points\": 25, \"target\": \"workout\", \"frequency\": \"once\"}','2025-09-26 18:15:14','2025-10-15 18:15:14',1,NULL,'2025-10-17 03:27:20','2025-10-17 03:27:20','fitness','beginner',7,100,NULL,NULL,'en','draft',NULL,0,0,1,0,NULL),(9,'Inactive Challenge','This challenge is no longer active.','daily','{\"amount\": 10000, \"points\": 30, \"target\": \"steps\", \"frequency\": \"daily\"}','2025-09-17 03:27:20','2025-10-16 03:27:20',0,NULL,'2025-10-17 03:27:20','2025-10-17 03:27:20','fitness','beginner',7,100,NULL,NULL,'en','draft',NULL,0,0,1,0,NULL),(10,'adfadf','adfadf','trainer_challenge','{}','2025-10-16 18:15:14','2025-10-28 18:15:14',1,NULL,'2025-10-18 07:49:50','2025-10-24 02:10:20','fitness','beginner',7,100,'adfadsf','[]','en','approved',NULL,0,0,1,1,12),(12,'test challenge 11','test description','trainer_challenge','{}','2025-10-14 18:15:14','2025-10-27 18:15:14',1,NULL,'2025-10-23 04:18:31','2025-10-23 05:38:09','fitness','beginner',7,100,'','[]','en','draft',NULL,0,0,1,1,12),(13,'jhgh','kjhkjjkh','trainer_challenge','{}','2025-10-07 18:15:14','2025-10-14 18:15:14',1,NULL,'2025-10-23 04:51:15','2025-10-23 04:51:15','fitness','beginner',7,100,'','[]','en','draft',NULL,0,0,1,1,12);
/*!40000 ALTER TABLE `Challenges` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Contents`
--

DROP TABLE IF EXISTS `Contents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Contents` (
  `id` int NOT NULL AUTO_INCREMENT,
  `trainerId` int NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text,
  `type` enum('video','image','document') NOT NULL DEFAULT 'video',
  `fileUrl` varchar(255) DEFAULT NULL,
  `thumbnailUrl` varchar(255) DEFAULT NULL,
  `duration` int DEFAULT NULL,
  `difficulty` enum('beginner','intermediate','advanced') DEFAULT NULL,
  `category` enum('cardio','strength','yoga','nutrition','wellness') DEFAULT NULL,
  `language` varchar(5) DEFAULT NULL,
  `tags` json NOT NULL,
  `status` enum('draft','pending','approved','rejected') NOT NULL DEFAULT 'draft',
  `rejectionReason` text,
  `views` int NOT NULL DEFAULT '0',
  `likes` int NOT NULL DEFAULT '0',
  `isPublic` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `contents_trainer_id_idx` (`trainerId`),
  KEY `contents_status_idx` (`status`),
  KEY `contents_type_idx` (`type`),
  CONSTRAINT `contents_ibfk_1` FOREIGN KEY (`trainerId`) REFERENCES `Trainers` (`userId`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Contents`
--

LOCK TABLES `Contents` WRITE;
/*!40000 ALTER TABLE `Contents` DISABLE KEYS */;
INSERT INTO `Contents` (`id`, `trainerId`, `title`, `description`, `type`, `fileUrl`, `thumbnailUrl`, `duration`, `difficulty`, `category`, `language`, `tags`, `status`, `rejectionReason`, `views`, `likes`, `isPublic`, `createdAt`, `updatedAt`) VALUES (5,12,'adf','','image','/uploads/1760751628267-318908045.jpg',NULL,NULL,'beginner','cardio','en','[]','draft',NULL,0,0,0,'2025-10-18 04:40:28','2025-10-18 05:27:34'),(6,12,'aaaa','aaaa','video','/uploads/1760755250546-712748857.mp4','/uploads/1760755250567-778660909.jpg',20,'beginner','cardio','en','[]','approved',NULL,0,0,0,'2025-10-18 05:40:50','2025-10-24 02:53:08'),(7,12,'test vieo','adfadsfadsf','video','/uploads/1760767603398-507135309.mp4','/uploads/1760767603420-460654547.jpg',99,'beginner','cardio','en','[]','approved',NULL,0,0,1,'2025-10-18 09:06:43','2025-10-24 02:15:50'),(8,12,'Test content 1','','video','/uploads/1760768097479-51417858.mp4','/uploads/1760768097502-686299755.jpg',20,'intermediate','strength','am','[]','approved',NULL,0,0,1,'2025-10-18 09:14:57','2025-10-24 02:54:19');
/*!40000 ALTER TABLE `Contents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Languages`
--

DROP TABLE IF EXISTS `Languages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Languages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(5) NOT NULL,
  `name` varchar(255) NOT NULL,
  `nativeName` varchar(255) DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  UNIQUE KEY `code_2` (`code`),
  UNIQUE KEY `code_3` (`code`),
  UNIQUE KEY `code_4` (`code`),
  UNIQUE KEY `code_5` (`code`),
  UNIQUE KEY `code_6` (`code`),
  UNIQUE KEY `code_7` (`code`),
  UNIQUE KEY `code_8` (`code`),
  UNIQUE KEY `code_9` (`code`),
  UNIQUE KEY `code_10` (`code`),
  UNIQUE KEY `code_11` (`code`),
  UNIQUE KEY `code_12` (`code`),
  UNIQUE KEY `code_13` (`code`),
  UNIQUE KEY `code_14` (`code`),
  UNIQUE KEY `code_15` (`code`),
  UNIQUE KEY `code_16` (`code`),
  UNIQUE KEY `code_17` (`code`),
  UNIQUE KEY `code_18` (`code`),
  UNIQUE KEY `code_19` (`code`),
  UNIQUE KEY `code_20` (`code`),
  UNIQUE KEY `code_21` (`code`),
  UNIQUE KEY `code_22` (`code`),
  UNIQUE KEY `code_23` (`code`),
  UNIQUE KEY `code_24` (`code`),
  UNIQUE KEY `code_25` (`code`),
  UNIQUE KEY `code_26` (`code`),
  UNIQUE KEY `code_27` (`code`),
  UNIQUE KEY `code_28` (`code`),
  UNIQUE KEY `code_29` (`code`),
  UNIQUE KEY `code_30` (`code`),
  UNIQUE KEY `code_31` (`code`),
  UNIQUE KEY `code_32` (`code`),
  UNIQUE KEY `code_33` (`code`),
  UNIQUE KEY `code_34` (`code`),
  UNIQUE KEY `code_35` (`code`),
  UNIQUE KEY `code_36` (`code`),
  UNIQUE KEY `code_37` (`code`),
  UNIQUE KEY `code_38` (`code`),
  UNIQUE KEY `code_39` (`code`),
  UNIQUE KEY `code_40` (`code`),
  UNIQUE KEY `code_41` (`code`),
  UNIQUE KEY `code_42` (`code`),
  UNIQUE KEY `code_43` (`code`),
  UNIQUE KEY `code_44` (`code`),
  UNIQUE KEY `languages_code_unique` (`code`),
  UNIQUE KEY `code_45` (`code`),
  UNIQUE KEY `code_46` (`code`),
  UNIQUE KEY `code_47` (`code`),
  UNIQUE KEY `code_48` (`code`),
  UNIQUE KEY `code_49` (`code`),
  UNIQUE KEY `code_50` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Languages`
--

LOCK TABLES `Languages` WRITE;
/*!40000 ALTER TABLE `Languages` DISABLE KEYS */;
INSERT INTO `Languages` (`id`, `code`, `name`, `nativeName`, `isActive`, `createdAt`, `updatedAt`) VALUES (13,'en','English','English',1,'2025-10-17 03:27:20','2025-10-17 03:27:20'),(14,'am','Amharic','አማርኛ',1,'2025-10-17 03:27:20','2025-10-17 03:27:20'),(15,'fr','French','Français',0,'2025-10-17 03:27:20','2025-10-17 07:08:02'),(16,'es','Spanish','Español',0,'2025-10-17 03:27:20','2025-10-18 08:54:17'),(17,'ar','Arabic','Arabic',0,'2025-10-17 07:06:48','2025-10-18 08:54:12'),(19,'or','Oromiffa','Oromiffa',1,'2025-10-17 20:01:49','2025-10-17 20:01:49'),(20,'tg','Tigrigna','Tirgigna',0,'2025-10-18 08:54:37','2025-10-18 08:54:41');
/*!40000 ALTER TABLE `Languages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Rewards`
--

DROP TABLE IF EXISTS `Rewards`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Rewards` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `costXp` int NOT NULL,
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `stock` int DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Rewards`
--

LOCK TABLES `Rewards` WRITE;
/*!40000 ALTER TABLE `Rewards` DISABLE KEYS */;
INSERT INTO `Rewards` (`id`, `title`, `costXp`, `active`, `stock`, `createdAt`, `updatedAt`) VALUES (8,'Premium Workout Plan',500,1,100,'2025-10-17 03:27:20','2025-10-17 03:27:20'),(9,'Nutrition Consultation',750,1,50,'2025-10-17 03:27:20','2025-10-17 03:27:20'),(10,'Fitness Tracker',2000,1,25,'2025-10-17 03:27:20','2025-10-17 03:27:20'),(12,'Limited Edition T-Shirt',300,0,0,'2025-10-17 03:27:20','2025-10-18 08:54:02'),(13,'Inactive Reward',100,0,5,'2025-10-17 03:27:20','2025-10-18 08:54:01');
/*!40000 ALTER TABLE `Rewards` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `SequelizeMeta`
--

DROP TABLE IF EXISTS `SequelizeMeta`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `SequelizeMeta` (
  `name` varchar(255) COLLATE utf8mb3_unicode_ci NOT NULL,
  PRIMARY KEY (`name`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `SequelizeMeta`
--

LOCK TABLES `SequelizeMeta` WRITE;
/*!40000 ALTER TABLE `SequelizeMeta` DISABLE KEYS */;
INSERT INTO `SequelizeMeta` (`name`) VALUES ('20250118020000-enhance-challenges-table.js'),('20250118030000-change-requirements-to-text.js'),('20250118040000-fix-kind-column-size.js'),('20251017025513-create-user-profiles.js'),('20251017034655-remove-subscription-expires-at.js'),('20251017050000-create-contents.js'),('20251017234911-create-workout-plans.js'),('20251017235010-create-workout-exercises.js'),('20251017235030-add-workout-plan-id-to-contents.js'),('20251018010459-remove-workout-plan-id-from-contents.js'),('20251022062121-create-trainer-applications.js'),('20251022062130-create-certification-files.js'),('20251022062722-add-verification-fields-to-trainers.js'),('20251022062833-grandfather-existing-trainers.js'),('20251022200000-refactor-trainer-applications-use-userid.js'),('20251022231644-remove-availability-from-trainer-applications.js'),('20251023002955-add-approval-tracking-to-workout-plans.js'),('20251023072505-create-user-content-progress.js'),('20251023072556-create-user-workout-plan-progress.js'),('20251023072626-create-user-challenge-progress.js'),('20251023072626-create-user-exercise-progress.js'),('20251023072627-add-xp-fields-to-users.js'),('20251023072627-create-achievements.js'),('20251023072627-create-user-achievements.js'),('20251023231404-make-challenge-dates-required.js');
/*!40000 ALTER TABLE `SequelizeMeta` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `SubscriptionAccesses`
--

DROP TABLE IF EXISTS `SubscriptionAccesses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `SubscriptionAccesses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `subscriptionStatus` varchar(16) NOT NULL,
  `externalSubId` varchar(64) DEFAULT NULL,
  `currentPeriodEnd` datetime DEFAULT NULL,
  `providerName` varchar(64) NOT NULL,
  `metaJson` json NOT NULL,
  `lastCheckedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `userId` (`userId`),
  UNIQUE KEY `subscription_accesses_user_id_unique` (`userId`),
  CONSTRAINT `subscriptionaccesses_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `SubscriptionAccesses`
--

LOCK TABLES `SubscriptionAccesses` WRITE;
/*!40000 ALTER TABLE `SubscriptionAccesses` DISABLE KEYS */;
/*!40000 ALTER TABLE `SubscriptionAccesses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `trainer_challenges`
--

DROP TABLE IF EXISTS `trainer_challenges`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `trainer_challenges` (
  `id` int NOT NULL AUTO_INCREMENT,
  `trainerId` int NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text,
  `type` enum('fitness','nutrition','wellness','achievement') NOT NULL DEFAULT 'fitness',
  `difficulty` enum('beginner','intermediate','advanced') NOT NULL DEFAULT 'beginner',
  `duration` int NOT NULL DEFAULT '7',
  `xpReward` int NOT NULL DEFAULT '100',
  `requirements` json DEFAULT NULL,
  `contentIds` json DEFAULT NULL,
  `language` varchar(5) NOT NULL DEFAULT 'en',
  `status` enum('draft','pending','approved','rejected','active') NOT NULL DEFAULT 'draft',
  `rejectionReason` text,
  `participantCount` int NOT NULL DEFAULT '0',
  `completionCount` int NOT NULL DEFAULT '0',
  `isPublic` tinyint(1) NOT NULL DEFAULT '1',
  `startDate` datetime DEFAULT NULL,
  `endDate` datetime DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `trainer_challenges_trainer_id` (`trainerId`),
  KEY `trainer_challenges_status` (`status`),
  KEY `trainer_challenges_type` (`type`),
  KEY `trainer_challenges_difficulty` (`difficulty`),
  KEY `trainer_challenges_is_public` (`isPublic`),
  CONSTRAINT `trainer_challenges_ibfk_1` FOREIGN KEY (`trainerId`) REFERENCES `trainers` (`userId`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `trainer_challenges`
--

LOCK TABLES `trainer_challenges` WRITE;
/*!40000 ALTER TABLE `trainer_challenges` DISABLE KEYS */;
/*!40000 ALTER TABLE `trainer_challenges` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `TrainerApplications`
--

DROP TABLE IF EXISTS `TrainerApplications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `TrainerApplications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `specialties` json NOT NULL,
  `yearsOfExperience` int DEFAULT NULL,
  `bio` text,
  `languages` json NOT NULL,
  `certifications` json NOT NULL,
  `portfolio` json NOT NULL,
  `socialMedia` json NOT NULL,
  `preferences` json NOT NULL,
  `status` enum('pending','under_review','approved','rejected') NOT NULL DEFAULT 'pending',
  `rejectionReason` text,
  `adminNotes` text,
  `submittedAt` datetime NOT NULL,
  `reviewedAt` datetime DEFAULT NULL,
  `reviewedBy` int DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `userId` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_trainer_app_userId` (`userId`),
  UNIQUE KEY `trainer_applications_user_id` (`userId`),
  KEY `trainer_applications_status` (`status`),
  KEY `trainer_applications_submitted_at` (`submittedAt`),
  CONSTRAINT `trainerapplications_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `Users` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `TrainerApplications`
--

LOCK TABLES `TrainerApplications` WRITE;
/*!40000 ALTER TABLE `TrainerApplications` DISABLE KEYS */;
INSERT INTO `TrainerApplications` (`id`, `specialties`, `yearsOfExperience`, `bio`, `languages`, `certifications`, `portfolio`, `socialMedia`, `preferences`, `status`, `rejectionReason`, `adminNotes`, `submittedAt`, `reviewedAt`, `reviewedBy`, `createdAt`, `updatedAt`, `userId`) VALUES (3,'[\"Weight Training\"]',NULL,'','[\"English\", \"Amharic\", \"Oromo\"]','[]','[]','{}','{\"contentTypes\": [\"Workout Videos\"], \"targetAudience\": [\"Intermediate\"], \"experienceLevel\": \"\"}','approved',NULL,NULL,'2025-10-23 02:21:36','2025-10-23 02:46:48',11,'2025-10-23 02:21:36','2025-10-23 02:46:48',14);
/*!40000 ALTER TABLE `TrainerApplications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Trainers`
--

DROP TABLE IF EXISTS `Trainers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Trainers` (
  `userId` int NOT NULL,
  `bio` text,
  `specialties` json NOT NULL,
  `verified` tinyint(1) NOT NULL DEFAULT '0',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `applicationId` int DEFAULT NULL,
  `verifiedAt` datetime DEFAULT NULL,
  `verifiedBy` int DEFAULT NULL,
  PRIMARY KEY (`userId`),
  KEY `trainers_application_id` (`applicationId`),
  KEY `trainers_verified_at` (`verifiedAt`),
  KEY `verifiedBy` (`verifiedBy`),
  CONSTRAINT `trainers_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `trainers_ibfk_406` FOREIGN KEY (`applicationId`) REFERENCES `TrainerApplications` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `trainers_ibfk_407` FOREIGN KEY (`verifiedBy`) REFERENCES `Users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Trainers`
--

LOCK TABLES `Trainers` WRITE;
/*!40000 ALTER TABLE `Trainers` DISABLE KEYS */;
INSERT INTO `Trainers` (`userId`, `bio`, `specialties`, `verified`, `createdAt`, `updatedAt`, `applicationId`, `verifiedAt`, `verifiedBy`) VALUES (12,'Certified fitness trainer with 5+ years of experience in strength training and cardio workouts. Passionate about helping people achieve their fitness goals.','[\"strength_training\", \"cardio\", \"weight_loss\"]',1,'2025-10-17 03:27:20','2025-10-22 07:06:45',NULL,NULL,NULL),(13,'Yoga instructor and wellness coach specializing in flexibility and mindfulness. Focused on holistic health and mental well-being.','[\"yoga\", \"flexibility\", \"mindfulness\", \"meditation\"]',1,'2025-10-17 03:27:20','2025-10-18 08:53:19',NULL,'2025-10-22 06:30:11',NULL),(14,'','[\"Weight Training\"]',1,'2025-10-23 02:46:48','2025-10-23 02:46:48',3,'2025-10-23 02:46:48',11);
/*!40000 ALTER TABLE `Trainers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_profiles`
--

DROP TABLE IF EXISTS `user_profiles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_profiles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `totalXp` int NOT NULL DEFAULT '0',
  `challengesCompleted` int NOT NULL DEFAULT '0',
  `workoutsCompleted` int NOT NULL DEFAULT '0',
  `subscriptionTier` enum('premium','pro') NOT NULL DEFAULT 'premium',
  `language` varchar(5) DEFAULT 'en',
  `notificationSettings` json NOT NULL,
  `fitnessGoals` json NOT NULL,
  `healthMetrics` json NOT NULL,
  `preferences` json NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `userId` (`userId`),
  UNIQUE KEY `user_profiles_user_id_unique` (`userId`),
  CONSTRAINT `user_profiles_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_profiles`
--

LOCK TABLES `user_profiles` WRITE;
/*!40000 ALTER TABLE `user_profiles` DISABLE KEYS */;
INSERT INTO `user_profiles` (`id`, `userId`, `totalXp`, `challengesCompleted`, `workoutsCompleted`, `subscriptionTier`, `language`, `notificationSettings`, `fitnessGoals`, `healthMetrics`, `preferences`, `createdAt`, `updatedAt`) VALUES (6,11,3609,7,50,'pro','en','{\"sms\": true, \"push\": true, \"email\": true, \"workouts\": true, \"challenges\": true, \"achievements\": true}','{\"experience\": \"beginner\", \"primaryGoal\": \"weight_loss\", \"targetWeight\": 74.04067990921786, \"weeklyWorkouts\": 3}','{\"height\": 170.7338153310337, \"bodyFat\": 10.219799862560643, \"lastUpdated\": \"2025-10-04T09:41:22.259Z\", \"currentWeight\": 79.49154445602096}','{\"difficulty\": \"beginner\", \"workoutTypes\": [\"cardio\", \"strength\", \"yoga\"], \"preferredTime\": \"morning\", \"musicPreference\": \"upbeat\"}','2025-10-17 03:27:20','2025-10-17 03:27:20'),(7,12,1302,16,44,'premium','am','{\"sms\": false, \"push\": true, \"email\": true, \"workouts\": true, \"challenges\": true, \"achievements\": true}','{\"experience\": \"intermediate\", \"primaryGoal\": \"muscle_gain\", \"targetWeight\": 80.94442788619358, \"weeklyWorkouts\": 5}','{\"height\": 176.90369152106086, \"bodyFat\": 10.613812118175892, \"lastUpdated\": \"2025-10-12T00:34:25.464Z\", \"currentWeight\": 60.885794840857386}','{\"difficulty\": \"intermediate\", \"workoutTypes\": [\"cardio\", \"strength\", \"yoga\"], \"preferredTime\": \"afternoon\", \"musicPreference\": \"calm\"}','2025-10-17 03:27:20','2025-10-22 07:06:45'),(8,13,4129,14,37,'premium','en','{\"sms\": false, \"push\": true, \"email\": true, \"workouts\": true, \"challenges\": true, \"achievements\": true}','{\"experience\": \"advanced\", \"primaryGoal\": \"endurance\", \"targetWeight\": 79.55736409999434, \"weeklyWorkouts\": 5}','{\"height\": 182.43623665799396, \"bodyFat\": 15.613739714172343, \"lastUpdated\": \"2025-10-10T13:08:55.776Z\", \"currentWeight\": 64.92653906021911}','{\"difficulty\": \"advanced\", \"workoutTypes\": [\"cardio\", \"strength\"], \"preferredTime\": \"evening\", \"musicPreference\": \"no_music\"}','2025-10-17 03:27:20','2025-10-17 03:27:20'),(9,14,344,7,8,'pro','am','{\"sms\": true, \"push\": true, \"email\": true, \"workouts\": true, \"challenges\": true, \"achievements\": true}','{\"experience\": \"beginner\", \"primaryGoal\": \"flexibility\", \"targetWeight\": 88.08841270869988, \"weeklyWorkouts\": 3}','{\"height\": 173.64372345448956, \"bodyFat\": 18.267318857730277, \"lastUpdated\": \"2025-10-03T10:40:32.637Z\", \"currentWeight\": 66.5421913111884}','{\"difficulty\": \"beginner\", \"workoutTypes\": [\"cardio\", \"strength\"], \"preferredTime\": \"morning\", \"musicPreference\": \"upbeat\"}','2025-10-17 03:27:20','2025-10-17 03:27:20'),(10,15,4461,11,33,'premium','en','{\"sms\": false, \"push\": true, \"email\": true, \"workouts\": true, \"challenges\": true, \"achievements\": true}','{\"experience\": \"intermediate\", \"primaryGoal\": \"weight_loss\", \"targetWeight\": 89.76810360517828, \"weeklyWorkouts\": 5}','{\"height\": 172.51710810522016, \"bodyFat\": 10.549629094031872, \"lastUpdated\": \"2025-09-20T00:12:50.698Z\", \"currentWeight\": 82.21497544571076}','{\"difficulty\": \"intermediate\", \"workoutTypes\": [\"cardio\", \"strength\"], \"preferredTime\": \"afternoon\", \"musicPreference\": \"calm\"}','2025-10-17 03:27:20','2025-10-17 03:27:20');
/*!40000 ALTER TABLE `user_profiles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `UserAchievements`
--

DROP TABLE IF EXISTS `UserAchievements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `UserAchievements` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `achievementId` int NOT NULL,
  `unlockedAt` datetime DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_achievement` (`userId`,`achievementId`),
  KEY `user_achievements_user_id` (`userId`),
  KEY `user_achievements_achievement_id` (`achievementId`),
  CONSTRAINT `userachievements_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `Users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `userachievements_ibfk_59` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `userachievements_ibfk_60` FOREIGN KEY (`achievementId`) REFERENCES `Achievements` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `UserAchievements`
--

LOCK TABLES `UserAchievements` WRITE;
/*!40000 ALTER TABLE `UserAchievements` DISABLE KEYS */;
/*!40000 ALTER TABLE `UserAchievements` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `UserChallengeProgress`
--

DROP TABLE IF EXISTS `UserChallengeProgress`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `UserChallengeProgress` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `challengeId` int NOT NULL,
  `status` enum('active','completed','failed') DEFAULT 'active',
  `progress` int DEFAULT '0' COMMENT 'Current progress value',
  `joinedAt` datetime DEFAULT NULL,
  `completedAt` datetime DEFAULT NULL,
  `xpEarned` int DEFAULT '0',
  `rank` int DEFAULT NULL COMMENT 'Final ranking in challenge',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_challenge` (`userId`,`challengeId`),
  KEY `user_challenge_progress_user_id` (`userId`),
  KEY `user_challenge_progress_challenge_id` (`challengeId`),
  KEY `user_challenge_progress_status` (`status`),
  CONSTRAINT `userchallengeprogress_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `Users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `userchallengeprogress_ibfk_213` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `userchallengeprogress_ibfk_214` FOREIGN KEY (`challengeId`) REFERENCES `Challenges` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `UserChallengeProgress`
--

LOCK TABLES `UserChallengeProgress` WRITE;
/*!40000 ALTER TABLE `UserChallengeProgress` DISABLE KEYS */;
INSERT INTO `UserChallengeProgress` (`id`, `userId`, `challengeId`, `status`, `progress`, `joinedAt`, `completedAt`, `xpEarned`, `rank`, `createdAt`, `updatedAt`) VALUES (1,14,10,'active',0,'2025-10-24 02:15:45',NULL,0,NULL,'2025-10-24 02:15:45','2025-10-24 02:15:45');
/*!40000 ALTER TABLE `UserChallengeProgress` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `UserContentProgress`
--

DROP TABLE IF EXISTS `UserContentProgress`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `UserContentProgress` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `contentId` int NOT NULL,
  `watchTime` int DEFAULT '0' COMMENT 'Watch time in seconds',
  `completed` tinyint(1) DEFAULT '0',
  `completedAt` datetime DEFAULT NULL,
  `xpEarned` int DEFAULT '0',
  `liked` tinyint(1) DEFAULT '0',
  `saved` tinyint(1) DEFAULT '0',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_content` (`userId`,`contentId`),
  KEY `user_content_progress_user_id` (`userId`),
  KEY `user_content_progress_content_id` (`contentId`),
  KEY `user_content_progress_completed` (`completed`),
  CONSTRAINT `usercontentprogress_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `Users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `usercontentprogress_ibfk_213` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `usercontentprogress_ibfk_214` FOREIGN KEY (`contentId`) REFERENCES `Contents` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `UserContentProgress`
--

LOCK TABLES `UserContentProgress` WRITE;
/*!40000 ALTER TABLE `UserContentProgress` DISABLE KEYS */;
INSERT INTO `UserContentProgress` (`id`, `userId`, `contentId`, `watchTime`, `completed`, `completedAt`, `xpEarned`, `liked`, `saved`, `createdAt`, `updatedAt`) VALUES (1,14,7,50,0,NULL,0,0,0,'2025-10-24 01:52:05','2025-10-24 02:15:50');
/*!40000 ALTER TABLE `UserContentProgress` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `UserExerciseProgress`
--

DROP TABLE IF EXISTS `UserExerciseProgress`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `UserExerciseProgress` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `workoutPlanId` int NOT NULL,
  `exerciseId` int NOT NULL,
  `completed` tinyint(1) DEFAULT '0',
  `completedAt` datetime DEFAULT NULL,
  `xpEarned` int DEFAULT '0',
  `notes` text,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_exercise` (`userId`,`exerciseId`),
  KEY `user_exercise_progress_user_id` (`userId`),
  KEY `user_exercise_progress_exercise_id` (`exerciseId`),
  KEY `user_exercise_progress_workout_plan_id` (`workoutPlanId`),
  CONSTRAINT `userexerciseprogress_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `Users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `userexerciseprogress_ibfk_319` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `userexerciseprogress_ibfk_320` FOREIGN KEY (`workoutPlanId`) REFERENCES `WorkoutPlans` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `userexerciseprogress_ibfk_321` FOREIGN KEY (`exerciseId`) REFERENCES `WorkoutExercises` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `UserExerciseProgress`
--

LOCK TABLES `UserExerciseProgress` WRITE;
/*!40000 ALTER TABLE `UserExerciseProgress` DISABLE KEYS */;
/*!40000 ALTER TABLE `UserExerciseProgress` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `phone` varchar(32) NOT NULL,
  `passwordHash` varchar(255) DEFAULT NULL,
  `isTrainer` tinyint(1) NOT NULL DEFAULT '0',
  `isAdmin` tinyint(1) NOT NULL DEFAULT '0',
  `status` varchar(16) NOT NULL DEFAULT 'active',
  `lastLoginAt` datetime DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `name` varchar(100) DEFAULT NULL,
  `profilePicture` text,
  `dateOfBirth` date DEFAULT NULL,
  `gender` enum('male','female') DEFAULT NULL,
  `lastActiveAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `phone` (`phone`),
  UNIQUE KEY `phone_2` (`phone`),
  UNIQUE KEY `phone_3` (`phone`),
  UNIQUE KEY `users_phone_unique` (`phone`),
  UNIQUE KEY `phone_4` (`phone`),
  UNIQUE KEY `phone_5` (`phone`),
  UNIQUE KEY `phone_6` (`phone`),
  UNIQUE KEY `phone_7` (`phone`),
  UNIQUE KEY `phone_8` (`phone`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `email_2` (`email`),
  UNIQUE KEY `email_3` (`email`),
  UNIQUE KEY `users_email_unique` (`email`),
  UNIQUE KEY `email_4` (`email`),
  UNIQUE KEY `email_5` (`email`),
  UNIQUE KEY `email_6` (`email`),
  UNIQUE KEY `email_7` (`email`),
  UNIQUE KEY `email_8` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` (`id`, `phone`, `passwordHash`, `isTrainer`, `isAdmin`, `status`, `lastLoginAt`, `createdAt`, `updatedAt`, `email`, `name`, `profilePicture`, `dateOfBirth`, `gender`, `lastActiveAt`) VALUES (11,'+251911234567','$2b$10$Nn69Cg4okGCZmgFt1nucOe1RTsfbOZlmicNBWNC67UwMUmgjGD4pi',0,1,'active','2025-10-24 02:54:08','2025-10-17 03:27:20','2025-10-24 02:54:08','admin@axumpulse.com','Admin User',NULL,NULL,NULL,NULL),(12,'+251912345678','$2b$10$7mSOkybHMD1lKsLdFVvVx.rpTkTz1GLlNcOM.H/9nF8TtAURljXA6',1,0,'active','2025-10-24 03:44:11','2025-10-17 03:27:20','2025-10-24 03:44:11','trainer1@axumpulse.com','Sara Bekele','/api/v1/uploads/profiles/profile_12_1761160419994.jpeg',NULL,'female',NULL),(13,'+251923456789','$2b$10$7mSOkybHMD1lKsLdFVvVx.rpTkTz1GLlNcOM.H/9nF8TtAURljXA6',1,0,'active','2025-10-24 03:44:21','2025-10-17 03:27:20','2025-10-24 03:44:21','trainer2@axumpulse.com','Meron Tekle',NULL,NULL,NULL,NULL),(14,'+251934567890','$2b$10$H5hyhWz3uJ8/7FMI8jT7quAjwORfMqkrBESxQpKLf9fz7CDHAKTMa',1,0,'active','2025-10-24 02:15:49','2025-10-17 03:27:20','2025-10-24 02:15:49','user1@axumpulse.com','Abebe Kebede',NULL,NULL,NULL,NULL),(15,'+251945678901','$2b$10$H5hyhWz3uJ8/7FMI8jT7quAjwORfMqkrBESxQpKLf9fz7CDHAKTMa',0,0,'blocked','2025-10-17 03:27:20','2025-10-17 03:27:20','2025-10-18 08:53:30','user2@axumpulse.com','Kebede Abebe',NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `UserWorkoutPlanProgress`
--

DROP TABLE IF EXISTS `UserWorkoutPlanProgress`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `UserWorkoutPlanProgress` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `workoutPlanId` int NOT NULL,
  `status` enum('active','completed','paused') DEFAULT 'active',
  `startedAt` datetime DEFAULT NULL,
  `completedAt` datetime DEFAULT NULL,
  `lastAccessedAt` datetime DEFAULT NULL,
  `completedExercises` int DEFAULT '0',
  `totalExercises` int NOT NULL,
  `xpEarned` int DEFAULT '0',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_workout_plan` (`userId`,`workoutPlanId`),
  KEY `user_workout_plan_progress_user_id` (`userId`),
  KEY `user_workout_plan_progress_workout_plan_id` (`workoutPlanId`),
  KEY `user_workout_plan_progress_status` (`status`),
  CONSTRAINT `userworkoutplanprogress_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `Users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `userworkoutplanprogress_ibfk_213` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `userworkoutplanprogress_ibfk_214` FOREIGN KEY (`workoutPlanId`) REFERENCES `WorkoutPlans` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `UserWorkoutPlanProgress`
--

LOCK TABLES `UserWorkoutPlanProgress` WRITE;
/*!40000 ALTER TABLE `UserWorkoutPlanProgress` DISABLE KEYS */;
INSERT INTO `UserWorkoutPlanProgress` (`id`, `userId`, `workoutPlanId`, `status`, `startedAt`, `completedAt`, `lastAccessedAt`, `completedExercises`, `totalExercises`, `xpEarned`, `createdAt`, `updatedAt`) VALUES (1,14,6,'active','2025-10-24 01:52:05',NULL,'2025-10-24 02:15:50',0,5,0,'2025-10-24 01:52:05','2025-10-24 02:15:50');
/*!40000 ALTER TABLE `UserWorkoutPlanProgress` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `WorkoutExercises`
--

DROP TABLE IF EXISTS `WorkoutExercises`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `WorkoutExercises` (
  `id` int NOT NULL AUTO_INCREMENT,
  `workoutPlanId` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text,
  `category` varchar(255) DEFAULT NULL,
  `muscleGroups` json DEFAULT NULL,
  `equipment` varchar(255) DEFAULT NULL,
  `sets` int DEFAULT NULL,
  `reps` varchar(255) DEFAULT NULL,
  `weight` varchar(255) DEFAULT NULL,
  `duration` int DEFAULT NULL,
  `restTime` int DEFAULT NULL,
  `order` int NOT NULL DEFAULT '1',
  `notes` text,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `workoutPlanId` (`workoutPlanId`),
  CONSTRAINT `workoutexercises_ibfk_1` FOREIGN KEY (`workoutPlanId`) REFERENCES `WorkoutPlans` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=324 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `WorkoutExercises`
--

LOCK TABLES `WorkoutExercises` WRITE;
/*!40000 ALTER TABLE `WorkoutExercises` DISABLE KEYS */;
INSERT INTO `WorkoutExercises` (`id`, `workoutPlanId`, `name`, `description`, `category`, `muscleGroups`, `equipment`, `sets`, `reps`, `weight`, `duration`, `restTime`, `order`, `notes`, `createdAt`, `updatedAt`) VALUES (1,1,'adadf','','','[]','',1,'3','32',23,60,1,'','2025-10-18 03:29:18','2025-10-18 06:25:07'),(2,1,'2323','','','[]','',14,'','',323,600,2,'','2025-10-18 03:29:18','2025-10-18 03:29:18'),(3,2,'aaa','','','[\"glutes\", \"shoulders\", \"lower back\"]','dumbbells',1,'10','40',34,60,1,'','2025-10-18 09:12:46','2025-10-18 09:12:46'),(4,3,'Push ups','teset','cardio','[\"back\", \"shoulders\", \"glutes\", \"quadriceps\", \"hamstrings\"]','dumbbells',1,'20','20',50,600,1,'','2025-10-18 09:17:08','2025-10-18 09:17:08'),(5,3,'Pull ups','','plyometric','[\"chest\", \"obliques\", \"traps\", \"quadriceps\", \"hamstrings\"]','smith machine',1,'50','60',40,60,2,'','2025-10-18 09:17:08','2025-10-18 09:17:31'),(6,4,'Running','Cardio running exercise','cardio','[\"legs\", \"core\"]','none',1,'30 min',NULL,30,66,1,'Focus on proper form and controlled movements. Running is great for building legs and core strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(7,4,'Cycling','Stationary or outdoor cycling','cardio','[\"legs\", \"glutes\"]','bike',1,'45 min','body weight',45,73,2,'Focus on proper form and controlled movements. Cycling is great for building legs and glutes strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(8,4,'Jump Rope','High-intensity jump rope workout','cardio','[\"legs\", \"calves\", \"core\"]','jump rope',3,'2 min','body weight',6,32,3,'Focus on proper form and controlled movements. Jump Rope is great for building legs and calves and core strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(9,4,'Burpees','Full-body cardio exercise','cardio','[\"full body\"]','none',4,'15',NULL,0,40,4,'Focus on proper form and controlled movements. Burpees is great for building full body strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(10,4,'Mountain Climbers','High-intensity cardio movement','cardio','[\"core\", \"legs\", \"shoulders\"]','none',3,'30 sec',NULL,0,72,5,'Focus on proper form and controlled movements. Mountain Climbers is great for building core and legs and shoulders strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(11,5,'Running','Cardio running exercise','cardio','[\"legs\", \"core\"]','none',1,'30 min',NULL,30,67,1,'Focus on proper form and controlled movements. Running is great for building legs and core strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(12,5,'Cycling','Stationary or outdoor cycling','cardio','[\"legs\", \"glutes\"]','bike',1,'45 min','body weight',45,75,2,'Focus on proper form and controlled movements. Cycling is great for building legs and glutes strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(13,5,'Jump Rope','High-intensity jump rope workout','cardio','[\"legs\", \"calves\", \"core\"]','jump rope',3,'2 min','body weight',6,36,3,'Focus on proper form and controlled movements. Jump Rope is great for building legs and calves and core strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(14,5,'Burpees','Full-body cardio exercise','cardio','[\"full body\"]','none',4,'15',NULL,0,49,4,'Focus on proper form and controlled movements. Burpees is great for building full body strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(15,5,'Mountain Climbers','High-intensity cardio movement','cardio','[\"core\", \"legs\", \"shoulders\"]','none',3,'30 sec',NULL,0,30,5,'Focus on proper form and controlled movements. Mountain Climbers is great for building core and legs and shoulders strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(16,5,'Running','Cardio running exercise','cardio','[\"legs\", \"core\"]','none',1,'30 min',NULL,30,31,6,'Focus on proper form and controlled movements. Running is great for building legs and core strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(17,6,'Push-ups','Classic upper body exercise','strength','[\"chest\", \"shoulders\", \"triceps\"]','none',3,'15',NULL,0,30,1,'Focus on proper form and controlled movements. Push-ups is great for building chest and shoulders and triceps strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(18,6,'Pull-ups','Upper body pulling exercise','strength','[\"back\", \"biceps\"]','pull-up bar',3,'8','body weight',0,76,2,'Focus on proper form and controlled movements. Pull-ups is great for building back and biceps strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(19,6,'Squats','Lower body compound movement','strength','[\"legs\", \"glutes\"]','none',4,'20',NULL,0,50,3,'Focus on proper form and controlled movements. Squats is great for building legs and glutes strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(20,6,'Deadlifts','Hip hinge movement','strength','[\"back\", \"legs\", \"glutes\"]','barbell',4,'8','body weight',0,61,4,'Focus on proper form and controlled movements. Deadlifts is great for building back and legs and glutes strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(21,6,'Bench Press','Chest pressing exercise','strength','[\"chest\", \"shoulders\", \"triceps\"]','barbell',4,'10','body weight',0,32,5,'Focus on proper form and controlled movements. Bench Press is great for building chest and shoulders and triceps strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(22,7,'Push-ups','Classic upper body exercise','strength','[\"chest\", \"shoulders\", \"triceps\"]','none',3,'15',NULL,0,58,1,'Focus on proper form and controlled movements. Push-ups is great for building chest and shoulders and triceps strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(23,7,'Pull-ups','Upper body pulling exercise','strength','[\"back\", \"biceps\"]','pull-up bar',3,'8','body weight',0,81,2,'Focus on proper form and controlled movements. Pull-ups is great for building back and biceps strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(24,7,'Squats','Lower body compound movement','strength','[\"legs\", \"glutes\"]','none',4,'20',NULL,0,76,3,'Focus on proper form and controlled movements. Squats is great for building legs and glutes strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(25,7,'Deadlifts','Hip hinge movement','strength','[\"back\", \"legs\", \"glutes\"]','barbell',4,'8','body weight',0,59,4,'Focus on proper form and controlled movements. Deadlifts is great for building back and legs and glutes strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(26,7,'Bench Press','Chest pressing exercise','strength','[\"chest\", \"shoulders\", \"triceps\"]','barbell',4,'10','body weight',0,58,5,'Focus on proper form and controlled movements. Bench Press is great for building chest and shoulders and triceps strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(27,7,'Push-ups','Classic upper body exercise','strength','[\"chest\", \"shoulders\", \"triceps\"]','none',3,'15',NULL,0,48,6,'Focus on proper form and controlled movements. Push-ups is great for building chest and shoulders and triceps strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(28,7,'Pull-ups','Upper body pulling exercise','strength','[\"back\", \"biceps\"]','pull-up bar',3,'8','body weight',0,69,7,'Focus on proper form and controlled movements. Pull-ups is great for building back and biceps strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(29,7,'Squats','Lower body compound movement','strength','[\"legs\", \"glutes\"]','none',4,'20',NULL,0,38,8,'Focus on proper form and controlled movements. Squats is great for building legs and glutes strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(30,8,'Downward Dog','Classic yoga pose','yoga','[\"full body\"]','yoga mat',1,'5 breaths','body weight',0,38,1,'Focus on proper form and controlled movements. Downward Dog is great for building full body strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(31,8,'Warrior I','Standing yoga pose','yoga','[\"legs\", \"core\"]','yoga mat',1,'5 breaths each','body weight',0,70,2,'Focus on proper form and controlled movements. Warrior I is great for building legs and core strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(32,8,'Tree Pose','Balance and focus pose','yoga','[\"legs\", \"core\"]','yoga mat',1,'5 breaths each','body weight',0,84,3,'Focus on proper form and controlled movements. Tree Pose is great for building legs and core strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(33,8,'Downward Dog','Classic yoga pose','yoga','[\"full body\"]','yoga mat',1,'5 breaths','body weight',0,64,4,'Focus on proper form and controlled movements. Downward Dog is great for building full body strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(34,8,'Warrior I','Standing yoga pose','yoga','[\"legs\", \"core\"]','yoga mat',1,'5 breaths each','body weight',0,51,5,'Focus on proper form and controlled movements. Warrior I is great for building legs and core strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(35,8,'Tree Pose','Balance and focus pose','yoga','[\"legs\", \"core\"]','yoga mat',1,'5 breaths each','body weight',0,30,6,'Focus on proper form and controlled movements. Tree Pose is great for building legs and core strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(36,8,'Downward Dog','Classic yoga pose','yoga','[\"full body\"]','yoga mat',1,'5 breaths','body weight',0,32,7,'Focus on proper form and controlled movements. Downward Dog is great for building full body strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(37,8,'Warrior I','Standing yoga pose','yoga','[\"legs\", \"core\"]','yoga mat',1,'5 breaths each','body weight',0,83,8,'Focus on proper form and controlled movements. Warrior I is great for building legs and core strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(38,9,'Meditation','Mindfulness and relaxation','wellness','[\"mind\"]','none',1,'10 min',NULL,10,69,1,'Focus on proper form and controlled movements. Meditation is great for building mind strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(39,9,'Deep Breathing','Stress relief breathing exercise','wellness','[\"core\"]','none',1,'5 min',NULL,5,33,2,'Focus on proper form and controlled movements. Deep Breathing is great for building core strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(40,9,'Stretching','Full body flexibility routine','wellness','[\"full body\"]','none',1,'15 min',NULL,15,64,3,'Focus on proper form and controlled movements. Stretching is great for building full body strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(41,9,'Meditation','Mindfulness and relaxation','wellness','[\"mind\"]','none',1,'10 min',NULL,10,36,4,'Focus on proper form and controlled movements. Meditation is great for building mind strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(42,9,'Deep Breathing','Stress relief breathing exercise','wellness','[\"core\"]','none',1,'5 min',NULL,5,52,5,'Focus on proper form and controlled movements. Deep Breathing is great for building core strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(43,10,'Running','Cardio running exercise','cardio','[\"legs\", \"core\"]','none',1,'30 min',NULL,30,43,1,'Focus on proper form and controlled movements. Running is great for building legs and core strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(44,10,'Cycling','Stationary or outdoor cycling','cardio','[\"legs\", \"glutes\"]','bike',1,'45 min','body weight',45,58,2,'Focus on proper form and controlled movements. Cycling is great for building legs and glutes strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(45,10,'Jump Rope','High-intensity jump rope workout','cardio','[\"legs\", \"calves\", \"core\"]','jump rope',3,'2 min','body weight',6,86,3,'Focus on proper form and controlled movements. Jump Rope is great for building legs and calves and core strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(46,10,'Burpees','Full-body cardio exercise','cardio','[\"full body\"]','none',4,'15',NULL,0,89,4,'Focus on proper form and controlled movements. Burpees is great for building full body strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(47,10,'Mountain Climbers','High-intensity cardio movement','cardio','[\"core\", \"legs\", \"shoulders\"]','none',3,'30 sec',NULL,0,41,5,'Focus on proper form and controlled movements. Mountain Climbers is great for building core and legs and shoulders strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(48,11,'Running','Cardio running exercise','cardio','[\"legs\", \"core\"]','none',1,'30 min',NULL,30,70,1,'Focus on proper form and controlled movements. Running is great for building legs and core strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(49,11,'Cycling','Stationary or outdoor cycling','cardio','[\"legs\", \"glutes\"]','bike',1,'45 min','body weight',45,43,2,'Focus on proper form and controlled movements. Cycling is great for building legs and glutes strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(50,11,'Jump Rope','High-intensity jump rope workout','cardio','[\"legs\", \"calves\", \"core\"]','jump rope',3,'2 min','body weight',6,36,3,'Focus on proper form and controlled movements. Jump Rope is great for building legs and calves and core strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(51,11,'Burpees','Full-body cardio exercise','cardio','[\"full body\"]','none',4,'15',NULL,0,65,4,'Focus on proper form and controlled movements. Burpees is great for building full body strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(52,11,'Mountain Climbers','High-intensity cardio movement','cardio','[\"core\", \"legs\", \"shoulders\"]','none',3,'30 sec',NULL,0,61,5,'Focus on proper form and controlled movements. Mountain Climbers is great for building core and legs and shoulders strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(53,11,'Running','Cardio running exercise','cardio','[\"legs\", \"core\"]','none',1,'30 min',NULL,30,85,6,'Focus on proper form and controlled movements. Running is great for building legs and core strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(54,11,'Cycling','Stationary or outdoor cycling','cardio','[\"legs\", \"glutes\"]','bike',1,'45 min','body weight',45,33,7,'Focus on proper form and controlled movements. Cycling is great for building legs and glutes strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(55,12,'Push-ups','Classic upper body exercise','strength','[\"chest\", \"shoulders\", \"triceps\"]','none',3,'15',NULL,0,77,1,'Focus on proper form and controlled movements. Push-ups is great for building chest and shoulders and triceps strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(56,12,'Pull-ups','Upper body pulling exercise','strength','[\"back\", \"biceps\"]','pull-up bar',3,'8','body weight',0,75,2,'Focus on proper form and controlled movements. Pull-ups is great for building back and biceps strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(57,12,'Squats','Lower body compound movement','strength','[\"legs\", \"glutes\"]','none',4,'20',NULL,0,89,3,'Focus on proper form and controlled movements. Squats is great for building legs and glutes strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(58,12,'Deadlifts','Hip hinge movement','strength','[\"back\", \"legs\", \"glutes\"]','barbell',4,'8','body weight',0,39,4,'Focus on proper form and controlled movements. Deadlifts is great for building back and legs and glutes strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(59,12,'Bench Press','Chest pressing exercise','strength','[\"chest\", \"shoulders\", \"triceps\"]','barbell',4,'10','body weight',0,72,5,'Focus on proper form and controlled movements. Bench Press is great for building chest and shoulders and triceps strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(60,12,'Push-ups','Classic upper body exercise','strength','[\"chest\", \"shoulders\", \"triceps\"]','none',3,'15',NULL,0,33,6,'Focus on proper form and controlled movements. Push-ups is great for building chest and shoulders and triceps strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(61,13,'Push-ups','Classic upper body exercise','strength','[\"chest\", \"shoulders\", \"triceps\"]','none',3,'15',NULL,0,49,1,'Focus on proper form and controlled movements. Push-ups is great for building chest and shoulders and triceps strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(62,13,'Pull-ups','Upper body pulling exercise','strength','[\"back\", \"biceps\"]','pull-up bar',3,'8','body weight',0,33,2,'Focus on proper form and controlled movements. Pull-ups is great for building back and biceps strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(63,13,'Squats','Lower body compound movement','strength','[\"legs\", \"glutes\"]','none',4,'20',NULL,0,37,3,'Focus on proper form and controlled movements. Squats is great for building legs and glutes strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(64,13,'Deadlifts','Hip hinge movement','strength','[\"back\", \"legs\", \"glutes\"]','barbell',4,'8','body weight',0,88,4,'Focus on proper form and controlled movements. Deadlifts is great for building back and legs and glutes strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(65,13,'Bench Press','Chest pressing exercise','strength','[\"chest\", \"shoulders\", \"triceps\"]','barbell',4,'10','body weight',0,49,5,'Focus on proper form and controlled movements. Bench Press is great for building chest and shoulders and triceps strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(66,13,'Push-ups','Classic upper body exercise','strength','[\"chest\", \"shoulders\", \"triceps\"]','none',3,'15',NULL,0,79,6,'Focus on proper form and controlled movements. Push-ups is great for building chest and shoulders and triceps strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(67,13,'Pull-ups','Upper body pulling exercise','strength','[\"back\", \"biceps\"]','pull-up bar',3,'8','body weight',0,66,7,'Focus on proper form and controlled movements. Pull-ups is great for building back and biceps strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(68,14,'Downward Dog','Classic yoga pose','yoga','[\"full body\"]','yoga mat',1,'5 breaths','body weight',0,48,1,'Focus on proper form and controlled movements. Downward Dog is great for building full body strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(69,14,'Warrior I','Standing yoga pose','yoga','[\"legs\", \"core\"]','yoga mat',1,'5 breaths each','body weight',0,61,2,'Focus on proper form and controlled movements. Warrior I is great for building legs and core strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(70,14,'Tree Pose','Balance and focus pose','yoga','[\"legs\", \"core\"]','yoga mat',1,'5 breaths each','body weight',0,42,3,'Focus on proper form and controlled movements. Tree Pose is great for building legs and core strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(71,14,'Downward Dog','Classic yoga pose','yoga','[\"full body\"]','yoga mat',1,'5 breaths','body weight',0,35,4,'Focus on proper form and controlled movements. Downward Dog is great for building full body strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(72,14,'Warrior I','Standing yoga pose','yoga','[\"legs\", \"core\"]','yoga mat',1,'5 breaths each','body weight',0,56,5,'Focus on proper form and controlled movements. Warrior I is great for building legs and core strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(73,14,'Tree Pose','Balance and focus pose','yoga','[\"legs\", \"core\"]','yoga mat',1,'5 breaths each','body weight',0,86,6,'Focus on proper form and controlled movements. Tree Pose is great for building legs and core strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(74,14,'Downward Dog','Classic yoga pose','yoga','[\"full body\"]','yoga mat',1,'5 breaths','body weight',0,34,7,'Focus on proper form and controlled movements. Downward Dog is great for building full body strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(75,15,'Meditation','Mindfulness and relaxation','wellness','[\"mind\"]','none',1,'10 min',NULL,10,55,1,'Focus on proper form and controlled movements. Meditation is great for building mind strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(76,15,'Deep Breathing','Stress relief breathing exercise','wellness','[\"core\"]','none',1,'5 min',NULL,5,33,2,'Focus on proper form and controlled movements. Deep Breathing is great for building core strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(77,15,'Stretching','Full body flexibility routine','wellness','[\"full body\"]','none',1,'15 min',NULL,15,31,3,'Focus on proper form and controlled movements. Stretching is great for building full body strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(78,15,'Meditation','Mindfulness and relaxation','wellness','[\"mind\"]','none',1,'10 min',NULL,10,66,4,'Focus on proper form and controlled movements. Meditation is great for building mind strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(79,15,'Deep Breathing','Stress relief breathing exercise','wellness','[\"core\"]','none',1,'5 min',NULL,5,81,5,'Focus on proper form and controlled movements. Deep Breathing is great for building core strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(80,15,'Stretching','Full body flexibility routine','wellness','[\"full body\"]','none',1,'15 min',NULL,15,68,6,'Focus on proper form and controlled movements. Stretching is great for building full body strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(81,15,'Meditation','Mindfulness and relaxation','wellness','[\"mind\"]','none',1,'10 min',NULL,10,65,7,'Focus on proper form and controlled movements. Meditation is great for building mind strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(82,15,'Deep Breathing','Stress relief breathing exercise','wellness','[\"core\"]','none',1,'5 min',NULL,5,35,8,'Focus on proper form and controlled movements. Deep Breathing is great for building core strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(83,16,'Running','Cardio running exercise','cardio','[\"legs\", \"core\"]','none',1,'30 min',NULL,30,50,1,'Focus on proper form and controlled movements. Running is great for building legs and core strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(84,16,'Cycling','Stationary or outdoor cycling','cardio','[\"legs\", \"glutes\"]','bike',1,'45 min','body weight',45,41,2,'Focus on proper form and controlled movements. Cycling is great for building legs and glutes strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(85,16,'Jump Rope','High-intensity jump rope workout','cardio','[\"legs\", \"calves\", \"core\"]','jump rope',3,'2 min','body weight',6,89,3,'Focus on proper form and controlled movements. Jump Rope is great for building legs and calves and core strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(86,16,'Burpees','Full-body cardio exercise','cardio','[\"full body\"]','none',4,'15',NULL,0,84,4,'Focus on proper form and controlled movements. Burpees is great for building full body strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(87,16,'Mountain Climbers','High-intensity cardio movement','cardio','[\"core\", \"legs\", \"shoulders\"]','none',3,'30 sec',NULL,0,80,5,'Focus on proper form and controlled movements. Mountain Climbers is great for building core and legs and shoulders strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(88,17,'Running','Cardio running exercise','cardio','[\"legs\", \"core\"]','none',1,'30 min',NULL,30,45,1,'Focus on proper form and controlled movements. Running is great for building legs and core strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(89,17,'Cycling','Stationary or outdoor cycling','cardio','[\"legs\", \"glutes\"]','bike',1,'45 min','body weight',45,56,2,'Focus on proper form and controlled movements. Cycling is great for building legs and glutes strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(90,17,'Jump Rope','High-intensity jump rope workout','cardio','[\"legs\", \"calves\", \"core\"]','jump rope',3,'2 min','body weight',6,73,3,'Focus on proper form and controlled movements. Jump Rope is great for building legs and calves and core strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(91,17,'Burpees','Full-body cardio exercise','cardio','[\"full body\"]','none',4,'15',NULL,0,50,4,'Focus on proper form and controlled movements. Burpees is great for building full body strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(92,17,'Mountain Climbers','High-intensity cardio movement','cardio','[\"core\", \"legs\", \"shoulders\"]','none',3,'30 sec',NULL,0,36,5,'Focus on proper form and controlled movements. Mountain Climbers is great for building core and legs and shoulders strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(93,17,'Running','Cardio running exercise','cardio','[\"legs\", \"core\"]','none',1,'30 min',NULL,30,70,6,'Focus on proper form and controlled movements. Running is great for building legs and core strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(94,18,'Push-ups','Classic upper body exercise','strength','[\"chest\", \"shoulders\", \"triceps\"]','none',3,'15',NULL,0,54,1,'Focus on proper form and controlled movements. Push-ups is great for building chest and shoulders and triceps strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(95,18,'Pull-ups','Upper body pulling exercise','strength','[\"back\", \"biceps\"]','pull-up bar',3,'8','body weight',0,31,2,'Focus on proper form and controlled movements. Pull-ups is great for building back and biceps strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(96,18,'Squats','Lower body compound movement','strength','[\"legs\", \"glutes\"]','none',4,'20',NULL,0,50,3,'Focus on proper form and controlled movements. Squats is great for building legs and glutes strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(97,18,'Deadlifts','Hip hinge movement','strength','[\"back\", \"legs\", \"glutes\"]','barbell',4,'8','body weight',0,61,4,'Focus on proper form and controlled movements. Deadlifts is great for building back and legs and glutes strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(98,18,'Bench Press','Chest pressing exercise','strength','[\"chest\", \"shoulders\", \"triceps\"]','barbell',4,'10','body weight',0,54,5,'Focus on proper form and controlled movements. Bench Press is great for building chest and shoulders and triceps strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(99,19,'Push-ups','Classic upper body exercise','strength','[\"chest\", \"shoulders\", \"triceps\"]','none',3,'15',NULL,0,50,1,'Focus on proper form and controlled movements. Push-ups is great for building chest and shoulders and triceps strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(100,19,'Pull-ups','Upper body pulling exercise','strength','[\"back\", \"biceps\"]','pull-up bar',3,'8','body weight',0,68,2,'Focus on proper form and controlled movements. Pull-ups is great for building back and biceps strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(101,19,'Squats','Lower body compound movement','strength','[\"legs\", \"glutes\"]','none',4,'20',NULL,0,80,3,'Focus on proper form and controlled movements. Squats is great for building legs and glutes strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(102,19,'Deadlifts','Hip hinge movement','strength','[\"back\", \"legs\", \"glutes\"]','barbell',4,'8','body weight',0,87,4,'Focus on proper form and controlled movements. Deadlifts is great for building back and legs and glutes strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(103,19,'Bench Press','Chest pressing exercise','strength','[\"chest\", \"shoulders\", \"triceps\"]','barbell',4,'10','body weight',0,78,5,'Focus on proper form and controlled movements. Bench Press is great for building chest and shoulders and triceps strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(104,20,'Downward Dog','Classic yoga pose','yoga','[\"full body\"]','yoga mat',1,'5 breaths','body weight',0,74,1,'Focus on proper form and controlled movements. Downward Dog is great for building full body strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(105,20,'Warrior I','Standing yoga pose','yoga','[\"legs\", \"core\"]','yoga mat',1,'5 breaths each','body weight',0,64,2,'Focus on proper form and controlled movements. Warrior I is great for building legs and core strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(106,20,'Tree Pose','Balance and focus pose','yoga','[\"legs\", \"core\"]','yoga mat',1,'5 breaths each','body weight',0,63,3,'Focus on proper form and controlled movements. Tree Pose is great for building legs and core strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(107,20,'Downward Dog','Classic yoga pose','yoga','[\"full body\"]','yoga mat',1,'5 breaths','body weight',0,83,4,'Focus on proper form and controlled movements. Downward Dog is great for building full body strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(108,20,'Warrior I','Standing yoga pose','yoga','[\"legs\", \"core\"]','yoga mat',1,'5 breaths each','body weight',0,73,5,'Focus on proper form and controlled movements. Warrior I is great for building legs and core strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(109,21,'Meditation','Mindfulness and relaxation','wellness','[\"mind\"]','none',1,'10 min',NULL,10,73,1,'Focus on proper form and controlled movements. Meditation is great for building mind strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(110,21,'Deep Breathing','Stress relief breathing exercise','wellness','[\"core\"]','none',1,'5 min',NULL,5,63,2,'Focus on proper form and controlled movements. Deep Breathing is great for building core strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(111,21,'Stretching','Full body flexibility routine','wellness','[\"full body\"]','none',1,'15 min',NULL,15,61,3,'Focus on proper form and controlled movements. Stretching is great for building full body strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(112,21,'Meditation','Mindfulness and relaxation','wellness','[\"mind\"]','none',1,'10 min',NULL,10,85,4,'Focus on proper form and controlled movements. Meditation is great for building mind strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(113,21,'Deep Breathing','Stress relief breathing exercise','wellness','[\"core\"]','none',1,'5 min',NULL,5,41,5,'Focus on proper form and controlled movements. Deep Breathing is great for building core strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(114,21,'Stretching','Full body flexibility routine','wellness','[\"full body\"]','none',1,'15 min',NULL,15,85,6,'Focus on proper form and controlled movements. Stretching is great for building full body strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(115,21,'Meditation','Mindfulness and relaxation','wellness','[\"mind\"]','none',1,'10 min',NULL,10,79,7,'Focus on proper form and controlled movements. Meditation is great for building mind strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(116,21,'Deep Breathing','Stress relief breathing exercise','wellness','[\"core\"]','none',1,'5 min',NULL,5,54,8,'Focus on proper form and controlled movements. Deep Breathing is great for building core strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(117,22,'Running','Cardio running exercise','cardio','[\"legs\", \"core\"]','none',1,'30 min',NULL,30,46,1,'Focus on proper form and controlled movements. Running is great for building legs and core strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(118,22,'Cycling','Stationary or outdoor cycling','cardio','[\"legs\", \"glutes\"]','bike',1,'45 min','body weight',45,57,2,'Focus on proper form and controlled movements. Cycling is great for building legs and glutes strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(119,22,'Jump Rope','High-intensity jump rope workout','cardio','[\"legs\", \"calves\", \"core\"]','jump rope',3,'2 min','body weight',6,82,3,'Focus on proper form and controlled movements. Jump Rope is great for building legs and calves and core strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(120,22,'Burpees','Full-body cardio exercise','cardio','[\"full body\"]','none',4,'15',NULL,0,66,4,'Focus on proper form and controlled movements. Burpees is great for building full body strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(121,22,'Mountain Climbers','High-intensity cardio movement','cardio','[\"core\", \"legs\", \"shoulders\"]','none',3,'30 sec',NULL,0,50,5,'Focus on proper form and controlled movements. Mountain Climbers is great for building core and legs and shoulders strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(122,22,'Running','Cardio running exercise','cardio','[\"legs\", \"core\"]','none',1,'30 min',NULL,30,36,6,'Focus on proper form and controlled movements. Running is great for building legs and core strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(123,22,'Cycling','Stationary or outdoor cycling','cardio','[\"legs\", \"glutes\"]','bike',1,'45 min','body weight',45,81,7,'Focus on proper form and controlled movements. Cycling is great for building legs and glutes strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(124,22,'Jump Rope','High-intensity jump rope workout','cardio','[\"legs\", \"calves\", \"core\"]','jump rope',3,'2 min','body weight',6,40,8,'Focus on proper form and controlled movements. Jump Rope is great for building legs and calves and core strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(125,23,'Running','Cardio running exercise','cardio','[\"legs\", \"core\"]','none',1,'30 min',NULL,30,48,1,'Focus on proper form and controlled movements. Running is great for building legs and core strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(126,23,'Cycling','Stationary or outdoor cycling','cardio','[\"legs\", \"glutes\"]','bike',1,'45 min','body weight',45,35,2,'Focus on proper form and controlled movements. Cycling is great for building legs and glutes strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(127,23,'Jump Rope','High-intensity jump rope workout','cardio','[\"legs\", \"calves\", \"core\"]','jump rope',3,'2 min','body weight',6,31,3,'Focus on proper form and controlled movements. Jump Rope is great for building legs and calves and core strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(128,23,'Burpees','Full-body cardio exercise','cardio','[\"full body\"]','none',4,'15',NULL,0,87,4,'Focus on proper form and controlled movements. Burpees is great for building full body strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(129,23,'Mountain Climbers','High-intensity cardio movement','cardio','[\"core\", \"legs\", \"shoulders\"]','none',3,'30 sec',NULL,0,53,5,'Focus on proper form and controlled movements. Mountain Climbers is great for building core and legs and shoulders strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(130,23,'Running','Cardio running exercise','cardio','[\"legs\", \"core\"]','none',1,'30 min',NULL,30,33,6,'Focus on proper form and controlled movements. Running is great for building legs and core strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(131,23,'Cycling','Stationary or outdoor cycling','cardio','[\"legs\", \"glutes\"]','bike',1,'45 min','body weight',45,50,7,'Focus on proper form and controlled movements. Cycling is great for building legs and glutes strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(132,24,'Push-ups','Classic upper body exercise','strength','[\"chest\", \"shoulders\", \"triceps\"]','none',3,'15',NULL,0,30,1,'Focus on proper form and controlled movements. Push-ups is great for building chest and shoulders and triceps strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(133,24,'Pull-ups','Upper body pulling exercise','strength','[\"back\", \"biceps\"]','pull-up bar',3,'8','body weight',0,83,2,'Focus on proper form and controlled movements. Pull-ups is great for building back and biceps strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(134,24,'Squats','Lower body compound movement','strength','[\"legs\", \"glutes\"]','none',4,'20',NULL,0,74,3,'Focus on proper form and controlled movements. Squats is great for building legs and glutes strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(135,24,'Deadlifts','Hip hinge movement','strength','[\"back\", \"legs\", \"glutes\"]','barbell',4,'8','body weight',0,32,4,'Focus on proper form and controlled movements. Deadlifts is great for building back and legs and glutes strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(136,24,'Bench Press','Chest pressing exercise','strength','[\"chest\", \"shoulders\", \"triceps\"]','barbell',4,'10','body weight',0,44,5,'Focus on proper form and controlled movements. Bench Press is great for building chest and shoulders and triceps strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(137,24,'Push-ups','Classic upper body exercise','strength','[\"chest\", \"shoulders\", \"triceps\"]','none',3,'15',NULL,0,39,6,'Focus on proper form and controlled movements. Push-ups is great for building chest and shoulders and triceps strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(138,24,'Pull-ups','Upper body pulling exercise','strength','[\"back\", \"biceps\"]','pull-up bar',3,'8','body weight',0,60,7,'Focus on proper form and controlled movements. Pull-ups is great for building back and biceps strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(139,25,'Push-ups','Classic upper body exercise','strength','[\"chest\", \"shoulders\", \"triceps\"]','none',3,'15',NULL,0,88,1,'Focus on proper form and controlled movements. Push-ups is great for building chest and shoulders and triceps strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(140,25,'Pull-ups','Upper body pulling exercise','strength','[\"back\", \"biceps\"]','pull-up bar',3,'8','body weight',0,76,2,'Focus on proper form and controlled movements. Pull-ups is great for building back and biceps strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(141,25,'Squats','Lower body compound movement','strength','[\"legs\", \"glutes\"]','none',4,'20',NULL,0,58,3,'Focus on proper form and controlled movements. Squats is great for building legs and glutes strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(142,25,'Deadlifts','Hip hinge movement','strength','[\"back\", \"legs\", \"glutes\"]','barbell',4,'8','body weight',0,89,4,'Focus on proper form and controlled movements. Deadlifts is great for building back and legs and glutes strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(143,25,'Bench Press','Chest pressing exercise','strength','[\"chest\", \"shoulders\", \"triceps\"]','barbell',4,'10','body weight',0,89,5,'Focus on proper form and controlled movements. Bench Press is great for building chest and shoulders and triceps strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(144,26,'Downward Dog','Classic yoga pose','yoga','[\"full body\"]','yoga mat',1,'5 breaths','body weight',0,72,1,'Focus on proper form and controlled movements. Downward Dog is great for building full body strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(145,26,'Warrior I','Standing yoga pose','yoga','[\"legs\", \"core\"]','yoga mat',1,'5 breaths each','body weight',0,72,2,'Focus on proper form and controlled movements. Warrior I is great for building legs and core strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(146,26,'Tree Pose','Balance and focus pose','yoga','[\"legs\", \"core\"]','yoga mat',1,'5 breaths each','body weight',0,33,3,'Focus on proper form and controlled movements. Tree Pose is great for building legs and core strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(147,26,'Downward Dog','Classic yoga pose','yoga','[\"full body\"]','yoga mat',1,'5 breaths','body weight',0,44,4,'Focus on proper form and controlled movements. Downward Dog is great for building full body strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(148,26,'Warrior I','Standing yoga pose','yoga','[\"legs\", \"core\"]','yoga mat',1,'5 breaths each','body weight',0,61,5,'Focus on proper form and controlled movements. Warrior I is great for building legs and core strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(149,26,'Tree Pose','Balance and focus pose','yoga','[\"legs\", \"core\"]','yoga mat',1,'5 breaths each','body weight',0,81,6,'Focus on proper form and controlled movements. Tree Pose is great for building legs and core strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(150,26,'Downward Dog','Classic yoga pose','yoga','[\"full body\"]','yoga mat',1,'5 breaths','body weight',0,78,7,'Focus on proper form and controlled movements. Downward Dog is great for building full body strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(151,27,'Meditation','Mindfulness and relaxation','wellness','[\"mind\"]','none',1,'10 min',NULL,10,40,1,'Focus on proper form and controlled movements. Meditation is great for building mind strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(152,27,'Deep Breathing','Stress relief breathing exercise','wellness','[\"core\"]','none',1,'5 min',NULL,5,53,2,'Focus on proper form and controlled movements. Deep Breathing is great for building core strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(153,27,'Stretching','Full body flexibility routine','wellness','[\"full body\"]','none',1,'15 min',NULL,15,82,3,'Focus on proper form and controlled movements. Stretching is great for building full body strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(154,27,'Meditation','Mindfulness and relaxation','wellness','[\"mind\"]','none',1,'10 min',NULL,10,75,4,'Focus on proper form and controlled movements. Meditation is great for building mind strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(155,27,'Deep Breathing','Stress relief breathing exercise','wellness','[\"core\"]','none',1,'5 min',NULL,5,58,5,'Focus on proper form and controlled movements. Deep Breathing is great for building core strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(156,27,'Stretching','Full body flexibility routine','wellness','[\"full body\"]','none',1,'15 min',NULL,15,87,6,'Focus on proper form and controlled movements. Stretching is great for building full body strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(157,27,'Meditation','Mindfulness and relaxation','wellness','[\"mind\"]','none',1,'10 min',NULL,10,75,7,'Focus on proper form and controlled movements. Meditation is great for building mind strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(158,28,'Running','Cardio running exercise','cardio','[\"legs\", \"core\"]','none',1,'30 min',NULL,30,36,1,'Focus on proper form and controlled movements. Running is great for building legs and core strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(159,28,'Cycling','Stationary or outdoor cycling','cardio','[\"legs\", \"glutes\"]','bike',1,'45 min','body weight',45,62,2,'Focus on proper form and controlled movements. Cycling is great for building legs and glutes strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(160,28,'Jump Rope','High-intensity jump rope workout','cardio','[\"legs\", \"calves\", \"core\"]','jump rope',3,'2 min','body weight',6,47,3,'Focus on proper form and controlled movements. Jump Rope is great for building legs and calves and core strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(161,28,'Burpees','Full-body cardio exercise','cardio','[\"full body\"]','none',4,'15',NULL,0,65,4,'Focus on proper form and controlled movements. Burpees is great for building full body strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(162,28,'Mountain Climbers','High-intensity cardio movement','cardio','[\"core\", \"legs\", \"shoulders\"]','none',3,'30 sec',NULL,0,77,5,'Focus on proper form and controlled movements. Mountain Climbers is great for building core and legs and shoulders strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(163,28,'Running','Cardio running exercise','cardio','[\"legs\", \"core\"]','none',1,'30 min',NULL,30,54,6,'Focus on proper form and controlled movements. Running is great for building legs and core strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(164,29,'Running','Cardio running exercise','cardio','[\"legs\", \"core\"]','none',1,'30 min',NULL,30,81,1,'Focus on proper form and controlled movements. Running is great for building legs and core strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(165,29,'Cycling','Stationary or outdoor cycling','cardio','[\"legs\", \"glutes\"]','bike',1,'45 min','body weight',45,78,2,'Focus on proper form and controlled movements. Cycling is great for building legs and glutes strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(166,29,'Jump Rope','High-intensity jump rope workout','cardio','[\"legs\", \"calves\", \"core\"]','jump rope',3,'2 min','body weight',6,48,3,'Focus on proper form and controlled movements. Jump Rope is great for building legs and calves and core strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(167,29,'Burpees','Full-body cardio exercise','cardio','[\"full body\"]','none',4,'15',NULL,0,46,4,'Focus on proper form and controlled movements. Burpees is great for building full body strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(168,29,'Mountain Climbers','High-intensity cardio movement','cardio','[\"core\", \"legs\", \"shoulders\"]','none',3,'30 sec',NULL,0,82,5,'Focus on proper form and controlled movements. Mountain Climbers is great for building core and legs and shoulders strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(169,29,'Running','Cardio running exercise','cardio','[\"legs\", \"core\"]','none',1,'30 min',NULL,30,73,6,'Focus on proper form and controlled movements. Running is great for building legs and core strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(170,30,'Push-ups','Classic upper body exercise','strength','[\"chest\", \"shoulders\", \"triceps\"]','none',3,'15',NULL,0,60,1,'Focus on proper form and controlled movements. Push-ups is great for building chest and shoulders and triceps strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(171,30,'Pull-ups','Upper body pulling exercise','strength','[\"back\", \"biceps\"]','pull-up bar',3,'8','body weight',0,74,2,'Focus on proper form and controlled movements. Pull-ups is great for building back and biceps strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(172,30,'Squats','Lower body compound movement','strength','[\"legs\", \"glutes\"]','none',4,'20',NULL,0,41,3,'Focus on proper form and controlled movements. Squats is great for building legs and glutes strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(173,30,'Deadlifts','Hip hinge movement','strength','[\"back\", \"legs\", \"glutes\"]','barbell',4,'8','body weight',0,37,4,'Focus on proper form and controlled movements. Deadlifts is great for building back and legs and glutes strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(174,30,'Bench Press','Chest pressing exercise','strength','[\"chest\", \"shoulders\", \"triceps\"]','barbell',4,'10','body weight',0,39,5,'Focus on proper form and controlled movements. Bench Press is great for building chest and shoulders and triceps strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(175,30,'Push-ups','Classic upper body exercise','strength','[\"chest\", \"shoulders\", \"triceps\"]','none',3,'15',NULL,0,50,6,'Focus on proper form and controlled movements. Push-ups is great for building chest and shoulders and triceps strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(176,31,'Push-ups','Classic upper body exercise','strength','[\"chest\", \"shoulders\", \"triceps\"]','none',3,'15',NULL,0,62,1,'Focus on proper form and controlled movements. Push-ups is great for building chest and shoulders and triceps strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(177,31,'Pull-ups','Upper body pulling exercise','strength','[\"back\", \"biceps\"]','pull-up bar',3,'8','body weight',0,44,2,'Focus on proper form and controlled movements. Pull-ups is great for building back and biceps strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(178,31,'Squats','Lower body compound movement','strength','[\"legs\", \"glutes\"]','none',4,'20',NULL,0,88,3,'Focus on proper form and controlled movements. Squats is great for building legs and glutes strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(179,31,'Deadlifts','Hip hinge movement','strength','[\"back\", \"legs\", \"glutes\"]','barbell',4,'8','body weight',0,86,4,'Focus on proper form and controlled movements. Deadlifts is great for building back and legs and glutes strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(180,31,'Bench Press','Chest pressing exercise','strength','[\"chest\", \"shoulders\", \"triceps\"]','barbell',4,'10','body weight',0,33,5,'Focus on proper form and controlled movements. Bench Press is great for building chest and shoulders and triceps strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(181,31,'Push-ups','Classic upper body exercise','strength','[\"chest\", \"shoulders\", \"triceps\"]','none',3,'15',NULL,0,86,6,'Focus on proper form and controlled movements. Push-ups is great for building chest and shoulders and triceps strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(182,31,'Pull-ups','Upper body pulling exercise','strength','[\"back\", \"biceps\"]','pull-up bar',3,'8','body weight',0,82,7,'Focus on proper form and controlled movements. Pull-ups is great for building back and biceps strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(183,31,'Squats','Lower body compound movement','strength','[\"legs\", \"glutes\"]','none',4,'20',NULL,0,63,8,'Focus on proper form and controlled movements. Squats is great for building legs and glutes strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(184,32,'Downward Dog','Classic yoga pose','yoga','[\"full body\"]','yoga mat',1,'5 breaths','body weight',0,49,1,'Focus on proper form and controlled movements. Downward Dog is great for building full body strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(185,32,'Warrior I','Standing yoga pose','yoga','[\"legs\", \"core\"]','yoga mat',1,'5 breaths each','body weight',0,42,2,'Focus on proper form and controlled movements. Warrior I is great for building legs and core strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(186,32,'Tree Pose','Balance and focus pose','yoga','[\"legs\", \"core\"]','yoga mat',1,'5 breaths each','body weight',0,88,3,'Focus on proper form and controlled movements. Tree Pose is great for building legs and core strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(187,32,'Downward Dog','Classic yoga pose','yoga','[\"full body\"]','yoga mat',1,'5 breaths','body weight',0,74,4,'Focus on proper form and controlled movements. Downward Dog is great for building full body strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(188,32,'Warrior I','Standing yoga pose','yoga','[\"legs\", \"core\"]','yoga mat',1,'5 breaths each','body weight',0,54,5,'Focus on proper form and controlled movements. Warrior I is great for building legs and core strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(189,32,'Tree Pose','Balance and focus pose','yoga','[\"legs\", \"core\"]','yoga mat',1,'5 breaths each','body weight',0,88,6,'Focus on proper form and controlled movements. Tree Pose is great for building legs and core strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(190,32,'Downward Dog','Classic yoga pose','yoga','[\"full body\"]','yoga mat',1,'5 breaths','body weight',0,75,7,'Focus on proper form and controlled movements. Downward Dog is great for building full body strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(191,32,'Warrior I','Standing yoga pose','yoga','[\"legs\", \"core\"]','yoga mat',1,'5 breaths each','body weight',0,60,8,'Focus on proper form and controlled movements. Warrior I is great for building legs and core strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(192,33,'Meditation','Mindfulness and relaxation','wellness','[\"mind\"]','none',1,'10 min',NULL,10,48,1,'Focus on proper form and controlled movements. Meditation is great for building mind strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(193,33,'Deep Breathing','Stress relief breathing exercise','wellness','[\"core\"]','none',1,'5 min',NULL,5,31,2,'Focus on proper form and controlled movements. Deep Breathing is great for building core strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(194,33,'Stretching','Full body flexibility routine','wellness','[\"full body\"]','none',1,'15 min',NULL,15,35,3,'Focus on proper form and controlled movements. Stretching is great for building full body strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(195,33,'Meditation','Mindfulness and relaxation','wellness','[\"mind\"]','none',1,'10 min',NULL,10,68,4,'Focus on proper form and controlled movements. Meditation is great for building mind strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(196,33,'Deep Breathing','Stress relief breathing exercise','wellness','[\"core\"]','none',1,'5 min',NULL,5,72,5,'Focus on proper form and controlled movements. Deep Breathing is great for building core strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(197,33,'Stretching','Full body flexibility routine','wellness','[\"full body\"]','none',1,'15 min',NULL,15,74,6,'Focus on proper form and controlled movements. Stretching is great for building full body strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(198,33,'Meditation','Mindfulness and relaxation','wellness','[\"mind\"]','none',1,'10 min',NULL,10,81,7,'Focus on proper form and controlled movements. Meditation is great for building mind strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(199,33,'Deep Breathing','Stress relief breathing exercise','wellness','[\"core\"]','none',1,'5 min',NULL,5,77,8,'Focus on proper form and controlled movements. Deep Breathing is great for building core strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(200,34,'Running','Cardio running exercise','cardio','[\"legs\", \"core\"]','none',1,'30 min',NULL,30,69,1,'Focus on proper form and controlled movements. Running is great for building legs and core strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(201,34,'Cycling','Stationary or outdoor cycling','cardio','[\"legs\", \"glutes\"]','bike',1,'45 min','body weight',45,82,2,'Focus on proper form and controlled movements. Cycling is great for building legs and glutes strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(202,34,'Jump Rope','High-intensity jump rope workout','cardio','[\"legs\", \"calves\", \"core\"]','jump rope',3,'2 min','body weight',6,64,3,'Focus on proper form and controlled movements. Jump Rope is great for building legs and calves and core strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(203,34,'Burpees','Full-body cardio exercise','cardio','[\"full body\"]','none',4,'15',NULL,0,52,4,'Focus on proper form and controlled movements. Burpees is great for building full body strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(204,34,'Mountain Climbers','High-intensity cardio movement','cardio','[\"core\", \"legs\", \"shoulders\"]','none',3,'30 sec',NULL,0,56,5,'Focus on proper form and controlled movements. Mountain Climbers is great for building core and legs and shoulders strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(205,34,'Running','Cardio running exercise','cardio','[\"legs\", \"core\"]','none',1,'30 min',NULL,30,57,6,'Focus on proper form and controlled movements. Running is great for building legs and core strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(206,35,'Running','Cardio running exercise','cardio','[\"legs\", \"core\"]','none',1,'30 min',NULL,30,71,1,'Focus on proper form and controlled movements. Running is great for building legs and core strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(207,35,'Cycling','Stationary or outdoor cycling','cardio','[\"legs\", \"glutes\"]','bike',1,'45 min','body weight',45,68,2,'Focus on proper form and controlled movements. Cycling is great for building legs and glutes strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(208,35,'Jump Rope','High-intensity jump rope workout','cardio','[\"legs\", \"calves\", \"core\"]','jump rope',3,'2 min','body weight',6,68,3,'Focus on proper form and controlled movements. Jump Rope is great for building legs and calves and core strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(209,35,'Burpees','Full-body cardio exercise','cardio','[\"full body\"]','none',4,'15',NULL,0,62,4,'Focus on proper form and controlled movements. Burpees is great for building full body strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(210,35,'Mountain Climbers','High-intensity cardio movement','cardio','[\"core\", \"legs\", \"shoulders\"]','none',3,'30 sec',NULL,0,54,5,'Focus on proper form and controlled movements. Mountain Climbers is great for building core and legs and shoulders strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(211,36,'Push-ups','Classic upper body exercise','strength','[\"chest\", \"shoulders\", \"triceps\"]','none',3,'15',NULL,0,77,1,'Focus on proper form and controlled movements. Push-ups is great for building chest and shoulders and triceps strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(212,36,'Pull-ups','Upper body pulling exercise','strength','[\"back\", \"biceps\"]','pull-up bar',3,'8','body weight',0,44,2,'Focus on proper form and controlled movements. Pull-ups is great for building back and biceps strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(213,36,'Squats','Lower body compound movement','strength','[\"legs\", \"glutes\"]','none',4,'20',NULL,0,77,3,'Focus on proper form and controlled movements. Squats is great for building legs and glutes strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(214,36,'Deadlifts','Hip hinge movement','strength','[\"back\", \"legs\", \"glutes\"]','barbell',4,'8','body weight',0,48,4,'Focus on proper form and controlled movements. Deadlifts is great for building back and legs and glutes strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(215,36,'Bench Press','Chest pressing exercise','strength','[\"chest\", \"shoulders\", \"triceps\"]','barbell',4,'10','body weight',0,51,5,'Focus on proper form and controlled movements. Bench Press is great for building chest and shoulders and triceps strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(216,36,'Push-ups','Classic upper body exercise','strength','[\"chest\", \"shoulders\", \"triceps\"]','none',3,'15',NULL,0,81,6,'Focus on proper form and controlled movements. Push-ups is great for building chest and shoulders and triceps strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(217,36,'Pull-ups','Upper body pulling exercise','strength','[\"back\", \"biceps\"]','pull-up bar',3,'8','body weight',0,65,7,'Focus on proper form and controlled movements. Pull-ups is great for building back and biceps strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(218,37,'Push-ups','Classic upper body exercise','strength','[\"chest\", \"shoulders\", \"triceps\"]','none',3,'15',NULL,0,83,1,'Focus on proper form and controlled movements. Push-ups is great for building chest and shoulders and triceps strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(219,37,'Pull-ups','Upper body pulling exercise','strength','[\"back\", \"biceps\"]','pull-up bar',3,'8','body weight',0,55,2,'Focus on proper form and controlled movements. Pull-ups is great for building back and biceps strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(220,37,'Squats','Lower body compound movement','strength','[\"legs\", \"glutes\"]','none',4,'20',NULL,0,44,3,'Focus on proper form and controlled movements. Squats is great for building legs and glutes strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(221,37,'Deadlifts','Hip hinge movement','strength','[\"back\", \"legs\", \"glutes\"]','barbell',4,'8','body weight',0,44,4,'Focus on proper form and controlled movements. Deadlifts is great for building back and legs and glutes strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(222,37,'Bench Press','Chest pressing exercise','strength','[\"chest\", \"shoulders\", \"triceps\"]','barbell',4,'10','body weight',0,44,5,'Focus on proper form and controlled movements. Bench Press is great for building chest and shoulders and triceps strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(223,37,'Push-ups','Classic upper body exercise','strength','[\"chest\", \"shoulders\", \"triceps\"]','none',3,'15',NULL,0,54,6,'Focus on proper form and controlled movements. Push-ups is great for building chest and shoulders and triceps strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(224,37,'Pull-ups','Upper body pulling exercise','strength','[\"back\", \"biceps\"]','pull-up bar',3,'8','body weight',0,53,7,'Focus on proper form and controlled movements. Pull-ups is great for building back and biceps strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(225,37,'Squats','Lower body compound movement','strength','[\"legs\", \"glutes\"]','none',4,'20',NULL,0,79,8,'Focus on proper form and controlled movements. Squats is great for building legs and glutes strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(226,38,'Downward Dog','Classic yoga pose','yoga','[\"full body\"]','yoga mat',1,'5 breaths','body weight',0,33,1,'Focus on proper form and controlled movements. Downward Dog is great for building full body strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(227,38,'Warrior I','Standing yoga pose','yoga','[\"legs\", \"core\"]','yoga mat',1,'5 breaths each','body weight',0,72,2,'Focus on proper form and controlled movements. Warrior I is great for building legs and core strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(228,38,'Tree Pose','Balance and focus pose','yoga','[\"legs\", \"core\"]','yoga mat',1,'5 breaths each','body weight',0,70,3,'Focus on proper form and controlled movements. Tree Pose is great for building legs and core strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(229,38,'Downward Dog','Classic yoga pose','yoga','[\"full body\"]','yoga mat',1,'5 breaths','body weight',0,40,4,'Focus on proper form and controlled movements. Downward Dog is great for building full body strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(230,38,'Warrior I','Standing yoga pose','yoga','[\"legs\", \"core\"]','yoga mat',1,'5 breaths each','body weight',0,76,5,'Focus on proper form and controlled movements. Warrior I is great for building legs and core strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(231,38,'Tree Pose','Balance and focus pose','yoga','[\"legs\", \"core\"]','yoga mat',1,'5 breaths each','body weight',0,48,6,'Focus on proper form and controlled movements. Tree Pose is great for building legs and core strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(232,39,'Meditation','Mindfulness and relaxation','wellness','[\"mind\"]','none',1,'10 min',NULL,10,53,1,'Focus on proper form and controlled movements. Meditation is great for building mind strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(233,39,'Deep Breathing','Stress relief breathing exercise','wellness','[\"core\"]','none',1,'5 min',NULL,5,78,2,'Focus on proper form and controlled movements. Deep Breathing is great for building core strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(234,39,'Stretching','Full body flexibility routine','wellness','[\"full body\"]','none',1,'15 min',NULL,15,72,3,'Focus on proper form and controlled movements. Stretching is great for building full body strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(235,39,'Meditation','Mindfulness and relaxation','wellness','[\"mind\"]','none',1,'10 min',NULL,10,88,4,'Focus on proper form and controlled movements. Meditation is great for building mind strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(236,39,'Deep Breathing','Stress relief breathing exercise','wellness','[\"core\"]','none',1,'5 min',NULL,5,53,5,'Focus on proper form and controlled movements. Deep Breathing is great for building core strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(237,39,'Stretching','Full body flexibility routine','wellness','[\"full body\"]','none',1,'15 min',NULL,15,42,6,'Focus on proper form and controlled movements. Stretching is great for building full body strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(238,40,'Running','Cardio running exercise','cardio','[\"legs\", \"core\"]','none',1,'30 min',NULL,30,67,1,'Focus on proper form and controlled movements. Running is great for building legs and core strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(239,40,'Cycling','Stationary or outdoor cycling','cardio','[\"legs\", \"glutes\"]','bike',1,'45 min','body weight',45,35,2,'Focus on proper form and controlled movements. Cycling is great for building legs and glutes strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(240,40,'Jump Rope','High-intensity jump rope workout','cardio','[\"legs\", \"calves\", \"core\"]','jump rope',3,'2 min','body weight',6,35,3,'Focus on proper form and controlled movements. Jump Rope is great for building legs and calves and core strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(241,40,'Burpees','Full-body cardio exercise','cardio','[\"full body\"]','none',4,'15',NULL,0,76,4,'Focus on proper form and controlled movements. Burpees is great for building full body strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(242,40,'Mountain Climbers','High-intensity cardio movement','cardio','[\"core\", \"legs\", \"shoulders\"]','none',3,'30 sec',NULL,0,78,5,'Focus on proper form and controlled movements. Mountain Climbers is great for building core and legs and shoulders strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(243,40,'Running','Cardio running exercise','cardio','[\"legs\", \"core\"]','none',1,'30 min',NULL,30,56,6,'Focus on proper form and controlled movements. Running is great for building legs and core strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(244,41,'Running','Cardio running exercise','cardio','[\"legs\", \"core\"]','none',1,'30 min',NULL,30,78,1,'Focus on proper form and controlled movements. Running is great for building legs and core strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(245,41,'Cycling','Stationary or outdoor cycling','cardio','[\"legs\", \"glutes\"]','bike',1,'45 min','body weight',45,69,2,'Focus on proper form and controlled movements. Cycling is great for building legs and glutes strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(246,41,'Jump Rope','High-intensity jump rope workout','cardio','[\"legs\", \"calves\", \"core\"]','jump rope',3,'2 min','body weight',6,30,3,'Focus on proper form and controlled movements. Jump Rope is great for building legs and calves and core strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(247,41,'Burpees','Full-body cardio exercise','cardio','[\"full body\"]','none',4,'15',NULL,0,80,4,'Focus on proper form and controlled movements. Burpees is great for building full body strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(248,41,'Mountain Climbers','High-intensity cardio movement','cardio','[\"core\", \"legs\", \"shoulders\"]','none',3,'30 sec',NULL,0,86,5,'Focus on proper form and controlled movements. Mountain Climbers is great for building core and legs and shoulders strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(249,42,'Push-ups','Classic upper body exercise','strength','[\"chest\", \"shoulders\", \"triceps\"]','none',3,'15',NULL,0,55,1,'Focus on proper form and controlled movements. Push-ups is great for building chest and shoulders and triceps strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(250,42,'Pull-ups','Upper body pulling exercise','strength','[\"back\", \"biceps\"]','pull-up bar',3,'8','body weight',0,81,2,'Focus on proper form and controlled movements. Pull-ups is great for building back and biceps strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(251,42,'Squats','Lower body compound movement','strength','[\"legs\", \"glutes\"]','none',4,'20',NULL,0,63,3,'Focus on proper form and controlled movements. Squats is great for building legs and glutes strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(252,42,'Deadlifts','Hip hinge movement','strength','[\"back\", \"legs\", \"glutes\"]','barbell',4,'8','body weight',0,69,4,'Focus on proper form and controlled movements. Deadlifts is great for building back and legs and glutes strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(253,42,'Bench Press','Chest pressing exercise','strength','[\"chest\", \"shoulders\", \"triceps\"]','barbell',4,'10','body weight',0,65,5,'Focus on proper form and controlled movements. Bench Press is great for building chest and shoulders and triceps strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(254,42,'Push-ups','Classic upper body exercise','strength','[\"chest\", \"shoulders\", \"triceps\"]','none',3,'15',NULL,0,84,6,'Focus on proper form and controlled movements. Push-ups is great for building chest and shoulders and triceps strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(255,43,'Push-ups','Classic upper body exercise','strength','[\"chest\", \"shoulders\", \"triceps\"]','none',3,'15',NULL,0,82,1,'Focus on proper form and controlled movements. Push-ups is great for building chest and shoulders and triceps strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(256,43,'Pull-ups','Upper body pulling exercise','strength','[\"back\", \"biceps\"]','pull-up bar',3,'8','body weight',0,85,2,'Focus on proper form and controlled movements. Pull-ups is great for building back and biceps strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(257,43,'Squats','Lower body compound movement','strength','[\"legs\", \"glutes\"]','none',4,'20',NULL,0,78,3,'Focus on proper form and controlled movements. Squats is great for building legs and glutes strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(258,43,'Deadlifts','Hip hinge movement','strength','[\"back\", \"legs\", \"glutes\"]','barbell',4,'8','body weight',0,71,4,'Focus on proper form and controlled movements. Deadlifts is great for building back and legs and glutes strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(259,43,'Bench Press','Chest pressing exercise','strength','[\"chest\", \"shoulders\", \"triceps\"]','barbell',4,'10','body weight',0,76,5,'Focus on proper form and controlled movements. Bench Press is great for building chest and shoulders and triceps strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(260,43,'Push-ups','Classic upper body exercise','strength','[\"chest\", \"shoulders\", \"triceps\"]','none',3,'15',NULL,0,46,6,'Focus on proper form and controlled movements. Push-ups is great for building chest and shoulders and triceps strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(261,44,'Downward Dog','Classic yoga pose','yoga','[\"full body\"]','yoga mat',1,'5 breaths','body weight',0,66,1,'Focus on proper form and controlled movements. Downward Dog is great for building full body strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(262,44,'Warrior I','Standing yoga pose','yoga','[\"legs\", \"core\"]','yoga mat',1,'5 breaths each','body weight',0,43,2,'Focus on proper form and controlled movements. Warrior I is great for building legs and core strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(263,44,'Tree Pose','Balance and focus pose','yoga','[\"legs\", \"core\"]','yoga mat',1,'5 breaths each','body weight',0,65,3,'Focus on proper form and controlled movements. Tree Pose is great for building legs and core strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(264,44,'Downward Dog','Classic yoga pose','yoga','[\"full body\"]','yoga mat',1,'5 breaths','body weight',0,64,4,'Focus on proper form and controlled movements. Downward Dog is great for building full body strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(265,44,'Warrior I','Standing yoga pose','yoga','[\"legs\", \"core\"]','yoga mat',1,'5 breaths each','body weight',0,68,5,'Focus on proper form and controlled movements. Warrior I is great for building legs and core strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(266,44,'Tree Pose','Balance and focus pose','yoga','[\"legs\", \"core\"]','yoga mat',1,'5 breaths each','body weight',0,83,6,'Focus on proper form and controlled movements. Tree Pose is great for building legs and core strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(267,44,'Downward Dog','Classic yoga pose','yoga','[\"full body\"]','yoga mat',1,'5 breaths','body weight',0,41,7,'Focus on proper form and controlled movements. Downward Dog is great for building full body strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(268,44,'Warrior I','Standing yoga pose','yoga','[\"legs\", \"core\"]','yoga mat',1,'5 breaths each','body weight',0,37,8,'Focus on proper form and controlled movements. Warrior I is great for building legs and core strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(269,45,'Meditation','Mindfulness and relaxation','wellness','[\"mind\"]','none',1,'10 min',NULL,10,43,1,'Focus on proper form and controlled movements. Meditation is great for building mind strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(270,45,'Deep Breathing','Stress relief breathing exercise','wellness','[\"core\"]','none',1,'5 min',NULL,5,34,2,'Focus on proper form and controlled movements. Deep Breathing is great for building core strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(271,45,'Stretching','Full body flexibility routine','wellness','[\"full body\"]','none',1,'15 min',NULL,15,58,3,'Focus on proper form and controlled movements. Stretching is great for building full body strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(272,45,'Meditation','Mindfulness and relaxation','wellness','[\"mind\"]','none',1,'10 min',NULL,10,88,4,'Focus on proper form and controlled movements. Meditation is great for building mind strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(273,45,'Deep Breathing','Stress relief breathing exercise','wellness','[\"core\"]','none',1,'5 min',NULL,5,82,5,'Focus on proper form and controlled movements. Deep Breathing is great for building core strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(274,45,'Stretching','Full body flexibility routine','wellness','[\"full body\"]','none',1,'15 min',NULL,15,59,6,'Focus on proper form and controlled movements. Stretching is great for building full body strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(275,46,'Running','Cardio running exercise','cardio','[\"legs\", \"core\"]','none',1,'30 min',NULL,30,56,1,'Focus on proper form and controlled movements. Running is great for building legs and core strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(276,46,'Cycling','Stationary or outdoor cycling','cardio','[\"legs\", \"glutes\"]','bike',1,'45 min','body weight',45,72,2,'Focus on proper form and controlled movements. Cycling is great for building legs and glutes strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(277,46,'Jump Rope','High-intensity jump rope workout','cardio','[\"legs\", \"calves\", \"core\"]','jump rope',3,'2 min','body weight',6,62,3,'Focus on proper form and controlled movements. Jump Rope is great for building legs and calves and core strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(278,46,'Burpees','Full-body cardio exercise','cardio','[\"full body\"]','none',4,'15',NULL,0,67,4,'Focus on proper form and controlled movements. Burpees is great for building full body strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(279,46,'Mountain Climbers','High-intensity cardio movement','cardio','[\"core\", \"legs\", \"shoulders\"]','none',3,'30 sec',NULL,0,47,5,'Focus on proper form and controlled movements. Mountain Climbers is great for building core and legs and shoulders strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(280,46,'Running','Cardio running exercise','cardio','[\"legs\", \"core\"]','none',1,'30 min',NULL,30,72,6,'Focus on proper form and controlled movements. Running is great for building legs and core strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(281,47,'Running','Cardio running exercise','cardio','[\"legs\", \"core\"]','none',1,'30 min',NULL,30,75,1,'Focus on proper form and controlled movements. Running is great for building legs and core strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(282,47,'Cycling','Stationary or outdoor cycling','cardio','[\"legs\", \"glutes\"]','bike',1,'45 min','body weight',45,49,2,'Focus on proper form and controlled movements. Cycling is great for building legs and glutes strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(283,47,'Jump Rope','High-intensity jump rope workout','cardio','[\"legs\", \"calves\", \"core\"]','jump rope',3,'2 min','body weight',6,39,3,'Focus on proper form and controlled movements. Jump Rope is great for building legs and calves and core strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(284,47,'Burpees','Full-body cardio exercise','cardio','[\"full body\"]','none',4,'15',NULL,0,76,4,'Focus on proper form and controlled movements. Burpees is great for building full body strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(285,47,'Mountain Climbers','High-intensity cardio movement','cardio','[\"core\", \"legs\", \"shoulders\"]','none',3,'30 sec',NULL,0,56,5,'Focus on proper form and controlled movements. Mountain Climbers is great for building core and legs and shoulders strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(286,48,'Push-ups','Classic upper body exercise','strength','[\"chest\", \"shoulders\", \"triceps\"]','none',3,'15',NULL,0,85,1,'Focus on proper form and controlled movements. Push-ups is great for building chest and shoulders and triceps strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(287,48,'Pull-ups','Upper body pulling exercise','strength','[\"back\", \"biceps\"]','pull-up bar',3,'8','body weight',0,47,2,'Focus on proper form and controlled movements. Pull-ups is great for building back and biceps strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(288,48,'Squats','Lower body compound movement','strength','[\"legs\", \"glutes\"]','none',4,'20',NULL,0,68,3,'Focus on proper form and controlled movements. Squats is great for building legs and glutes strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(289,48,'Deadlifts','Hip hinge movement','strength','[\"back\", \"legs\", \"glutes\"]','barbell',4,'8','body weight',0,46,4,'Focus on proper form and controlled movements. Deadlifts is great for building back and legs and glutes strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(290,48,'Bench Press','Chest pressing exercise','strength','[\"chest\", \"shoulders\", \"triceps\"]','barbell',4,'10','body weight',0,75,5,'Focus on proper form and controlled movements. Bench Press is great for building chest and shoulders and triceps strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(291,49,'Push-ups','Classic upper body exercise','strength','[\"chest\", \"shoulders\", \"triceps\"]','none',3,'15',NULL,0,49,1,'Focus on proper form and controlled movements. Push-ups is great for building chest and shoulders and triceps strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(292,49,'Pull-ups','Upper body pulling exercise','strength','[\"back\", \"biceps\"]','pull-up bar',3,'8','body weight',0,60,2,'Focus on proper form and controlled movements. Pull-ups is great for building back and biceps strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(293,49,'Squats','Lower body compound movement','strength','[\"legs\", \"glutes\"]','none',4,'20',NULL,0,77,3,'Focus on proper form and controlled movements. Squats is great for building legs and glutes strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(294,49,'Deadlifts','Hip hinge movement','strength','[\"back\", \"legs\", \"glutes\"]','barbell',4,'8','body weight',0,56,4,'Focus on proper form and controlled movements. Deadlifts is great for building back and legs and glutes strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(295,49,'Bench Press','Chest pressing exercise','strength','[\"chest\", \"shoulders\", \"triceps\"]','barbell',4,'10','body weight',0,74,5,'Focus on proper form and controlled movements. Bench Press is great for building chest and shoulders and triceps strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(296,49,'Push-ups','Classic upper body exercise','strength','[\"chest\", \"shoulders\", \"triceps\"]','none',3,'15',NULL,0,64,6,'Focus on proper form and controlled movements. Push-ups is great for building chest and shoulders and triceps strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(297,49,'Pull-ups','Upper body pulling exercise','strength','[\"back\", \"biceps\"]','pull-up bar',3,'8','body weight',0,52,7,'Focus on proper form and controlled movements. Pull-ups is great for building back and biceps strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(298,49,'Squats','Lower body compound movement','strength','[\"legs\", \"glutes\"]','none',4,'20',NULL,0,76,8,'Focus on proper form and controlled movements. Squats is great for building legs and glutes strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(299,50,'Downward Dog','Classic yoga pose','yoga','[\"full body\"]','yoga mat',1,'5 breaths','body weight',0,47,1,'Focus on proper form and controlled movements. Downward Dog is great for building full body strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(300,50,'Warrior I','Standing yoga pose','yoga','[\"legs\", \"core\"]','yoga mat',1,'5 breaths each','body weight',0,45,2,'Focus on proper form and controlled movements. Warrior I is great for building legs and core strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(301,50,'Tree Pose','Balance and focus pose','yoga','[\"legs\", \"core\"]','yoga mat',1,'5 breaths each','body weight',0,45,3,'Focus on proper form and controlled movements. Tree Pose is great for building legs and core strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(302,50,'Downward Dog','Classic yoga pose','yoga','[\"full body\"]','yoga mat',1,'5 breaths','body weight',0,42,4,'Focus on proper form and controlled movements. Downward Dog is great for building full body strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(303,50,'Warrior I','Standing yoga pose','yoga','[\"legs\", \"core\"]','yoga mat',1,'5 breaths each','body weight',0,34,5,'Focus on proper form and controlled movements. Warrior I is great for building legs and core strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(304,50,'Tree Pose','Balance and focus pose','yoga','[\"legs\", \"core\"]','yoga mat',1,'5 breaths each','body weight',0,88,6,'Focus on proper form and controlled movements. Tree Pose is great for building legs and core strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(305,50,'Downward Dog','Classic yoga pose','yoga','[\"full body\"]','yoga mat',1,'5 breaths','body weight',0,48,7,'Focus on proper form and controlled movements. Downward Dog is great for building full body strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(306,50,'Warrior I','Standing yoga pose','yoga','[\"legs\", \"core\"]','yoga mat',1,'5 breaths each','body weight',0,43,8,'Focus on proper form and controlled movements. Warrior I is great for building legs and core strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(307,51,'Meditation','Mindfulness and relaxation','wellness','[\"mind\"]','none',1,'10 min',NULL,10,85,1,'Focus on proper form and controlled movements. Meditation is great for building mind strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(308,51,'Deep Breathing','Stress relief breathing exercise','wellness','[\"core\"]','none',1,'5 min',NULL,5,72,2,'Focus on proper form and controlled movements. Deep Breathing is great for building core strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(309,51,'Stretching','Full body flexibility routine','wellness','[\"full body\"]','none',1,'15 min',NULL,15,45,3,'Focus on proper form and controlled movements. Stretching is great for building full body strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(310,51,'Meditation','Mindfulness and relaxation','wellness','[\"mind\"]','none',1,'10 min',NULL,10,75,4,'Focus on proper form and controlled movements. Meditation is great for building mind strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(311,51,'Deep Breathing','Stress relief breathing exercise','wellness','[\"core\"]','none',1,'5 min',NULL,5,86,5,'Focus on proper form and controlled movements. Deep Breathing is great for building core strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(312,51,'Stretching','Full body flexibility routine','wellness','[\"full body\"]','none',1,'15 min',NULL,15,76,6,'Focus on proper form and controlled movements. Stretching is great for building full body strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(313,51,'Meditation','Mindfulness and relaxation','wellness','[\"mind\"]','none',1,'10 min',NULL,10,31,7,'Focus on proper form and controlled movements. Meditation is great for building mind strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(314,52,'Running','Cardio running exercise','cardio','[\"legs\", \"core\"]','none',1,'30 min',NULL,30,87,1,'Focus on proper form and controlled movements. Running is great for building legs and core strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(315,52,'Cycling','Stationary or outdoor cycling','cardio','[\"legs\", \"glutes\"]','bike',1,'45 min','body weight',45,33,2,'Focus on proper form and controlled movements. Cycling is great for building legs and glutes strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(316,52,'Jump Rope','High-intensity jump rope workout','cardio','[\"legs\", \"calves\", \"core\"]','jump rope',3,'2 min','body weight',6,86,3,'Focus on proper form and controlled movements. Jump Rope is great for building legs and calves and core strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(317,52,'Burpees','Full-body cardio exercise','cardio','[\"full body\"]','none',4,'15',NULL,0,54,4,'Focus on proper form and controlled movements. Burpees is great for building full body strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(318,52,'Mountain Climbers','High-intensity cardio movement','cardio','[\"core\", \"legs\", \"shoulders\"]','none',3,'30 sec',NULL,0,46,5,'Focus on proper form and controlled movements. Mountain Climbers is great for building core and legs and shoulders strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(319,53,'Running','Cardio running exercise','cardio','[\"legs\", \"core\"]','none',1,'30 min',NULL,30,86,1,'Focus on proper form and controlled movements. Running is great for building legs and core strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(320,53,'Cycling','Stationary or outdoor cycling','cardio','[\"legs\", \"glutes\"]','bike',1,'45 min','body weight',45,36,2,'Focus on proper form and controlled movements. Cycling is great for building legs and glutes strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(321,53,'Jump Rope','High-intensity jump rope workout','cardio','[\"legs\", \"calves\", \"core\"]','jump rope',3,'2 min','body weight',6,80,3,'Focus on proper form and controlled movements. Jump Rope is great for building legs and calves and core strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(322,53,'Burpees','Full-body cardio exercise','cardio','[\"full body\"]','none',4,'15',NULL,0,73,4,'Focus on proper form and controlled movements. Burpees is great for building full body strength.','2025-10-20 05:12:03','2025-10-20 05:12:03'),(323,53,'Mountain Climbers','High-intensity cardio movement','cardio','[\"core\", \"legs\", \"shoulders\"]','none',3,'30 sec',NULL,0,87,5,'Focus on proper form and controlled movements. Mountain Climbers is great for building core and legs and shoulders strength.','2025-10-20 05:12:03','2025-10-20 05:12:03');
/*!40000 ALTER TABLE `WorkoutExercises` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `WorkoutPlans`
--

DROP TABLE IF EXISTS `WorkoutPlans`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `WorkoutPlans` (
  `id` int NOT NULL AUTO_INCREMENT,
  `trainerId` int NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text,
  `difficulty` enum('beginner','intermediate','advanced') NOT NULL DEFAULT 'beginner',
  `category` varchar(255) DEFAULT NULL,
  `language` varchar(255) DEFAULT NULL,
  `tags` json DEFAULT NULL,
  `isPublic` tinyint(1) NOT NULL DEFAULT '1',
  `status` enum('draft','pending','approved','rejected') NOT NULL DEFAULT 'draft',
  `estimatedDuration` int DEFAULT NULL,
  `totalExercises` int NOT NULL DEFAULT '0',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `rejectionReason` text,
  `approvedBy` int DEFAULT NULL,
  `approvedAt` datetime DEFAULT NULL,
  `rejectedBy` int DEFAULT NULL,
  `rejectedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `trainerId` (`trainerId`),
  KEY `approvedBy` (`approvedBy`),
  KEY `rejectedBy` (`rejectedBy`),
  CONSTRAINT `workoutplans_ibfk_1` FOREIGN KEY (`trainerId`) REFERENCES `Users` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `workoutplans_ibfk_2` FOREIGN KEY (`approvedBy`) REFERENCES `Users` (`id`),
  CONSTRAINT `workoutplans_ibfk_3` FOREIGN KEY (`rejectedBy`) REFERENCES `Users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=54 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `WorkoutPlans`
--

LOCK TABLES `WorkoutPlans` WRITE;
/*!40000 ALTER TABLE `WorkoutPlans` DISABLE KEYS */;
INSERT INTO `WorkoutPlans` (`id`, `trainerId`, `title`, `description`, `difficulty`, `category`, `language`, `tags`, `isPublic`, `status`, `estimatedDuration`, `totalExercises`, `createdAt`, `updatedAt`, `rejectionReason`, `approvedBy`, `approvedAt`, `rejectedBy`, `rejectedAt`) VALUES (1,12,'asdfasdfafaf','adadf','beginner','strength','','[]',1,'draft',216,2,'2025-10-18 03:29:18','2025-10-18 06:28:29',NULL,NULL,NULL,NULL,NULL),(2,12,'adfadf','test','beginner','Strength','am','[]',0,'draft',2,1,'2025-10-18 09:12:46','2025-10-18 09:13:15',NULL,NULL,NULL,NULL,NULL),(3,12,'Test workout plan','test','advanced','Stretching','en','[]',1,'draft',13,2,'2025-10-18 09:17:08','2025-10-18 09:17:08',NULL,NULL,NULL,NULL,NULL),(4,12,'Morning Cardio Blast 1','High-energy cardio workout to start your day','beginner','cardio','en','[\"morning\", \"cardio\", \"energy\"]',0,'approved',30,5,'2025-10-20 05:12:03','2025-10-20 05:12:03',NULL,NULL,NULL,NULL,NULL),(5,13,'HIIT Cardio Challenge 2','High-intensity interval training for maximum calorie burn','intermediate','cardio','en','[\"hiit\", \"cardio\", \"intense\"]',1,'draft',25,6,'2025-10-20 05:12:03','2025-10-20 05:12:03',NULL,NULL,NULL,NULL,NULL),(6,12,'Upper Body Power 3','Build strength in your upper body','intermediate','strength','en','[\"upper body\", \"strength\", \"muscle\"]',1,'approved',45,5,'2025-10-20 05:12:03','2025-10-23 03:46:03',NULL,11,'2025-10-23 03:46:03',NULL,NULL),(7,13,'Lower Body Blast 4','Intense lower body strength training','advanced','strength','en','[\"legs\", \"glutes\", \"strength\"]',1,'draft',50,8,'2025-10-20 05:12:03','2025-10-20 05:12:03',NULL,NULL,NULL,NULL,NULL),(8,12,'Morning Yoga Flow 5','Gentle yoga to start your day with energy','beginner','yoga','en','[\"morning\", \"yoga\", \"gentle\"]',1,'approved',25,8,'2025-10-20 05:12:03','2025-10-20 05:12:03',NULL,NULL,NULL,NULL,NULL),(9,13,'Stress Relief 6','Gentle movements to reduce stress and tension','beginner','wellness','en','[\"stress relief\", \"relaxation\", \"wellness\"]',1,'draft',20,5,'2025-10-20 05:12:03','2025-10-20 05:12:03',NULL,NULL,NULL,NULL,NULL),(10,12,'Morning Cardio Blast 7','High-energy cardio workout to start your day','beginner','cardio','en','[\"morning\", \"cardio\", \"energy\"]',1,'rejected',30,5,'2025-10-20 05:12:03','2025-10-23 03:46:16','Exercises need more detailed descriptions and proper form cues',NULL,NULL,11,'2025-10-23 03:46:16'),(11,13,'HIIT Cardio Challenge 8','High-intensity interval training for maximum calorie burn','intermediate','cardio','en','[\"hiit\", \"cardio\", \"intense\"]',1,'approved',25,7,'2025-10-20 05:12:03','2025-10-23 04:19:40',NULL,11,'2025-10-23 04:19:40',NULL,NULL),(12,12,'Upper Body Power 9','Build strength in your upper body','intermediate','strength','en','[\"upper body\", \"strength\", \"muscle\"]',1,'approved',45,6,'2025-10-20 05:12:03','2025-10-23 04:21:32',NULL,11,'2025-10-23 04:21:32',NULL,NULL),(13,13,'Lower Body Blast 10','Intense lower body strength training','advanced','strength','en','[\"legs\", \"glutes\", \"strength\"]',1,'approved',50,7,'2025-10-20 05:12:03','2025-10-20 05:12:03',NULL,NULL,NULL,NULL,NULL),(14,12,'Morning Yoga Flow 11','Gentle yoga to start your day with energy','beginner','yoga','en','[\"morning\", \"yoga\", \"gentle\"]',0,'approved',25,7,'2025-10-20 05:12:03','2025-10-23 04:17:01',NULL,11,'2025-10-23 04:17:01',NULL,NULL),(15,13,'Stress Relief 12','Gentle movements to reduce stress and tension','beginner','wellness','en','[\"stress relief\", \"relaxation\", \"wellness\"]',1,'approved',20,8,'2025-10-20 05:12:03','2025-10-23 04:25:02',NULL,11,'2025-10-23 04:25:02',NULL,NULL),(16,12,'Morning Cardio Blast 13','High-energy cardio workout to start your day','beginner','cardio','en','[\"morning\", \"cardio\", \"energy\"]',1,'draft',30,5,'2025-10-20 05:12:03','2025-10-20 05:12:03',NULL,NULL,NULL,NULL,NULL),(17,13,'HIIT Cardio Challenge 14','High-intensity interval training for maximum calorie burn','intermediate','cardio','en','[\"hiit\", \"cardio\", \"intense\"]',1,'approved',25,6,'2025-10-20 05:12:03','2025-10-23 04:21:51',NULL,11,'2025-10-23 04:21:51',NULL,NULL),(18,12,'Upper Body Power 15','Build strength in your upper body','intermediate','strength','en','[\"upper body\", \"strength\", \"muscle\"]',1,'approved',45,5,'2025-10-20 05:12:03','2025-10-20 05:12:03',NULL,NULL,NULL,NULL,NULL),(19,13,'Lower Body Blast 16','Intense lower body strength training','advanced','strength','en','[\"legs\", \"glutes\", \"strength\"]',1,'draft',50,5,'2025-10-20 05:12:03','2025-10-20 05:12:03',NULL,NULL,NULL,NULL,NULL),(20,12,'Morning Yoga Flow 17','Gentle yoga to start your day with energy','beginner','yoga','en','[\"morning\", \"yoga\", \"gentle\"]',0,'approved',25,5,'2025-10-20 05:12:03','2025-10-20 05:12:03',NULL,NULL,NULL,NULL,NULL),(21,13,'Stress Relief 18','Gentle movements to reduce stress and tension','beginner','wellness','en','[\"stress relief\", \"relaxation\", \"wellness\"]',1,'pending',20,8,'2025-10-20 05:12:03','2025-10-20 05:12:03',NULL,NULL,NULL,NULL,NULL),(22,12,'Morning Cardio Blast 19','High-energy cardio workout to start your day','beginner','cardio','en','[\"morning\", \"cardio\", \"energy\"]',1,'rejected',30,8,'2025-10-20 05:12:03','2025-10-23 04:25:45','Just because',NULL,NULL,11,'2025-10-23 04:25:45'),(23,13,'HIIT Cardio Challenge 20','High-intensity interval training for maximum calorie burn','intermediate','cardio','en','[\"hiit\", \"cardio\", \"intense\"]',1,'draft',25,7,'2025-10-20 05:12:03','2025-10-20 05:12:03',NULL,NULL,NULL,NULL,NULL),(24,12,'Upper Body Power 21','Build strength in your upper body','intermediate','strength','en','[\"upper body\", \"strength\", \"muscle\"]',1,'draft',45,7,'2025-10-20 05:12:03','2025-10-20 05:12:03',NULL,NULL,NULL,NULL,NULL),(25,13,'Lower Body Blast 22','Intense lower body strength training','advanced','strength','en','[\"legs\", \"glutes\", \"strength\"]',1,'approved',50,5,'2025-10-20 05:12:03','2025-10-20 05:12:03',NULL,NULL,NULL,NULL,NULL),(26,12,'Morning Yoga Flow 23','Gentle yoga to start your day with energy','beginner','yoga','en','[\"morning\", \"yoga\", \"gentle\"]',1,'approved',25,7,'2025-10-20 05:12:03','2025-10-20 05:12:03',NULL,NULL,NULL,NULL,NULL),(27,13,'Stress Relief 24','Gentle movements to reduce stress and tension','beginner','wellness','en','[\"stress relief\", \"relaxation\", \"wellness\"]',1,'approved',20,7,'2025-10-20 05:12:03','2025-10-23 04:25:57',NULL,11,'2025-10-23 04:25:57',NULL,NULL),(28,12,'Morning Cardio Blast 25','High-energy cardio workout to start your day','beginner','cardio','en','[\"morning\", \"cardio\", \"energy\"]',1,'draft',30,6,'2025-10-20 05:12:03','2025-10-20 05:12:03',NULL,NULL,NULL,NULL,NULL),(29,13,'HIIT Cardio Challenge 26','High-intensity interval training for maximum calorie burn','intermediate','cardio','en','[\"hiit\", \"cardio\", \"intense\"]',1,'approved',25,6,'2025-10-20 05:12:03','2025-10-20 05:12:03',NULL,NULL,NULL,NULL,NULL),(30,12,'Upper Body Power 27','Build strength in your upper body','intermediate','strength','en','[\"upper body\", \"strength\", \"muscle\"]',0,'draft',45,6,'2025-10-20 05:12:03','2025-10-20 05:12:03',NULL,NULL,NULL,NULL,NULL),(31,13,'Lower Body Blast 28','Intense lower body strength training','advanced','strength','en','[\"legs\", \"glutes\", \"strength\"]',1,'pending',50,8,'2025-10-20 05:12:03','2025-10-20 05:12:03',NULL,NULL,NULL,NULL,NULL),(32,12,'Morning Yoga Flow 29','Gentle yoga to start your day with energy','beginner','yoga','en','[\"morning\", \"yoga\", \"gentle\"]',1,'draft',25,8,'2025-10-20 05:12:03','2025-10-20 05:12:03',NULL,NULL,NULL,NULL,NULL),(33,13,'Stress Relief 30','Gentle movements to reduce stress and tension','beginner','wellness','en','[\"stress relief\", \"relaxation\", \"wellness\"]',1,'pending',20,8,'2025-10-20 05:12:03','2025-10-20 05:12:03',NULL,NULL,NULL,NULL,NULL),(34,12,'Morning Cardio Blast 31','High-energy cardio workout to start your day','beginner','cardio','en','[\"morning\", \"cardio\", \"energy\"]',1,'approved',30,6,'2025-10-20 05:12:03','2025-10-20 05:12:03',NULL,NULL,NULL,NULL,NULL),(35,13,'HIIT Cardio Challenge 32','High-intensity interval training for maximum calorie burn','intermediate','cardio','en','[\"hiit\", \"cardio\", \"intense\"]',0,'approved',25,5,'2025-10-20 05:12:03','2025-10-20 05:12:03',NULL,NULL,NULL,NULL,NULL),(36,12,'Upper Body Power 33','Build strength in your upper body','intermediate','strength','en','[\"upper body\", \"strength\", \"muscle\"]',0,'approved',45,7,'2025-10-20 05:12:03','2025-10-20 05:12:03',NULL,NULL,NULL,NULL,NULL),(37,13,'Lower Body Blast 34','Intense lower body strength training','advanced','strength','en','[\"legs\", \"glutes\", \"strength\"]',1,'pending',50,8,'2025-10-20 05:12:03','2025-10-20 05:12:03',NULL,NULL,NULL,NULL,NULL),(38,12,'Morning Yoga Flow 35','Gentle yoga to start your day with energy','beginner','yoga','en','[\"morning\", \"yoga\", \"gentle\"]',1,'pending',25,6,'2025-10-20 05:12:03','2025-10-20 05:12:03',NULL,NULL,NULL,NULL,NULL),(39,13,'Stress Relief 36','Gentle movements to reduce stress and tension','beginner','wellness','en','[\"stress relief\", \"relaxation\", \"wellness\"]',0,'draft',20,6,'2025-10-20 05:12:03','2025-10-20 05:12:03',NULL,NULL,NULL,NULL,NULL),(40,12,'Morning Cardio Blast 37','High-energy cardio workout to start your day','beginner','cardio','en','[\"morning\", \"cardio\", \"energy\"]',1,'draft',30,6,'2025-10-20 05:12:03','2025-10-20 05:12:03',NULL,NULL,NULL,NULL,NULL),(41,13,'HIIT Cardio Challenge 38','High-intensity interval training for maximum calorie burn','intermediate','cardio','en','[\"hiit\", \"cardio\", \"intense\"]',1,'approved',25,5,'2025-10-20 05:12:03','2025-10-20 05:12:03',NULL,NULL,NULL,NULL,NULL),(42,12,'Upper Body Power 39','Build strength in your upper body','intermediate','strength','en','[\"upper body\", \"strength\", \"muscle\"]',0,'approved',45,6,'2025-10-20 05:12:03','2025-10-20 05:12:03',NULL,NULL,NULL,NULL,NULL),(43,13,'Lower Body Blast 40','Intense lower body strength training','advanced','strength','en','[\"legs\", \"glutes\", \"strength\"]',0,'approved',50,6,'2025-10-20 05:12:03','2025-10-20 05:12:03',NULL,NULL,NULL,NULL,NULL),(44,12,'Morning Yoga Flow 41','Gentle yoga to start your day with energy','beginner','yoga','en','[\"morning\", \"yoga\", \"gentle\"]',0,'draft',25,8,'2025-10-20 05:12:03','2025-10-20 05:12:03',NULL,NULL,NULL,NULL,NULL),(45,13,'Stress Relief 42','Gentle movements to reduce stress and tension','beginner','wellness','en','[\"stress relief\", \"relaxation\", \"wellness\"]',1,'pending',20,6,'2025-10-20 05:12:03','2025-10-20 05:12:03',NULL,NULL,NULL,NULL,NULL),(46,12,'Morning Cardio Blast 43','High-energy cardio workout to start your day','beginner','cardio','en','[\"morning\", \"cardio\", \"energy\"]',1,'draft',30,6,'2025-10-20 05:12:03','2025-10-20 05:12:03',NULL,NULL,NULL,NULL,NULL),(47,13,'HIIT Cardio Challenge 44','High-intensity interval training for maximum calorie burn','intermediate','cardio','en','[\"hiit\", \"cardio\", \"intense\"]',0,'draft',25,5,'2025-10-20 05:12:03','2025-10-20 05:12:03',NULL,NULL,NULL,NULL,NULL),(48,12,'Upper Body Power 45','Build strength in your upper body','intermediate','strength','en','[\"upper body\", \"strength\", \"muscle\"]',0,'draft',45,5,'2025-10-20 05:12:03','2025-10-20 05:12:03',NULL,NULL,NULL,NULL,NULL),(49,13,'Lower Body Blast 46','Intense lower body strength training','advanced','strength','en','[\"legs\", \"glutes\", \"strength\"]',0,'draft',50,8,'2025-10-20 05:12:03','2025-10-20 05:12:03',NULL,NULL,NULL,NULL,NULL),(50,12,'Morning Yoga Flow 47','Gentle yoga to start your day with energy','beginner','yoga','en','[\"morning\", \"yoga\", \"gentle\"]',1,'draft',25,8,'2025-10-20 05:12:03','2025-10-20 05:12:03',NULL,NULL,NULL,NULL,NULL),(51,13,'Stress Relief 48','Gentle movements to reduce stress and tension','beginner','wellness','en','[\"stress relief\", \"relaxation\", \"wellness\"]',0,'approved',20,7,'2025-10-20 05:12:03','2025-10-20 05:12:03',NULL,NULL,NULL,NULL,NULL),(52,12,'Morning Cardio Blast 49','High-energy cardio workout to start your day','beginner','cardio','en','[\"morning\", \"cardio\", \"energy\"]',1,'pending',30,5,'2025-10-20 05:12:03','2025-10-20 05:12:03',NULL,NULL,NULL,NULL,NULL),(53,13,'HIIT Cardio Challenge 50','High-intensity interval training for maximum calorie burn','intermediate','cardio','en','[\"hiit\", \"cardio\", \"intense\"]',0,'pending',25,5,'2025-10-20 05:12:03','2025-10-20 05:12:03',NULL,NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `WorkoutPlans` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'axumpulse'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-10-23 19:45:23
