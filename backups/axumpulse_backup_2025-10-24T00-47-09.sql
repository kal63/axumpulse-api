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
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Contents`
--

LOCK TABLES `Contents` WRITE;
/*!40000 ALTER TABLE `Contents` DISABLE KEYS */;
INSERT INTO `Contents` (`id`, `trainerId`, `title`, `description`, `type`, `fileUrl`, `thumbnailUrl`, `duration`, `difficulty`, `category`, `language`, `tags`, `status`, `rejectionReason`, `views`, `likes`, `isPublic`, `createdAt`, `updatedAt`) VALUES (5,12,'adf','','image','/uploads/1760751628267-318908045.jpg',NULL,NULL,'beginner','cardio','en','[]','draft',NULL,0,0,0,'2025-10-18 04:40:28','2025-10-18 05:27:34'),(6,12,'aaaa','aaaa','video','/uploads/1760755250546-712748857.mp4','/uploads/1760755250567-778660909.jpg',20,'beginner','cardio','en','[]','approved',NULL,0,0,0,'2025-10-18 05:40:50','2025-10-24 02:53:08'),(7,12,'test vieo','adfadsfadsf','video','/uploads/1760767603398-507135309.mp4','/uploads/1760767603420-460654547.jpg',99,'beginner','cardio','en','[]','approved',NULL,0,0,1,'2025-10-18 09:06:43','2025-10-24 02:15:50'),(8,12,'Test content 1','','video','/uploads/1760768097479-51417858.mp4','/uploads/1760768097502-686299755.jpg',20,'intermediate','strength','am','[]','approved',NULL,0,0,1,'2025-10-18 09:14:57','2025-10-24 02:54:19'),(9,12,'Lower Body Power','Challenge yourself with bodyweight exercises that require no equipment.','video','/uploads/1761266724495-101673176.mp4',NULL,300,'advanced','yoga','en','[\"core\", \"abs\", \"stability\"]','pending',NULL,0,0,1,'2025-10-24 03:45:24','2025-10-24 03:45:24'),(10,12,'Core Strengthening Workout','Perfect for beginners looking to start their fitness journey with proper form and technique.','video','/uploads/1761266724584-892682989.mp4',NULL,220,'advanced','strength','en','[\"boxing\", \"cardio\", \"technique\"]','pending',NULL,0,0,1,'2025-10-24 03:45:24','2025-10-24 03:45:24'),(11,12,'Full Body HIIT Session','High-intensity interval training for maximum calorie burn.','video','/uploads/1761266724673-12884139.mp4',NULL,280,'intermediate','wellness','en','[\"resistance\", \"bands\", \"strength\"]','pending',NULL,0,0,1,'2025-10-24 03:45:24','2025-10-24 03:45:24'),(12,13,'Cardio Dance Workout','Learn basic boxing techniques while getting an amazing cardio workout.','video','/uploads/1761266725053-688748639.mp4',NULL,200,'advanced','cardio','en','[\"strength\", \"muscle\", \"training\"]','pending',NULL,0,0,1,'2025-10-24 03:45:25','2025-10-24 03:45:25'),(13,13,'Boxing Workout','High-intensity interval training for maximum calorie burn.','video','/uploads/1761266725111-221062487.mp4',NULL,280,'beginner','wellness','en','[\"strength\", \"muscle\", \"training\"]','pending',NULL,0,0,1,'2025-10-24 03:45:25','2025-10-24 03:45:25'),(14,13,'Core Strengthening Workout','Improve daily movement patterns with functional fitness exercises.','video','/uploads/1761266725189-75208736.mp4',NULL,220,'intermediate','strength','en','[\"boxing\", \"cardio\", \"technique\"]','pending',NULL,0,0,1,'2025-10-24 03:45:25','2025-10-24 03:45:25'),(15,12,'Boxing Workout','An intense session that will challenge your strength and push your limits.','video','/uploads/1761266802565-471177582.mp4',NULL,200,'advanced','cardio','en','[\"bodyweight\", \"no-equipment\", \"challenge\"]','pending',NULL,0,0,1,'2025-10-24 03:46:42','2025-10-24 03:46:42'),(16,12,'Tabata Training','Build lower body power and endurance with this challenging workout.','video','/uploads/1761266802633-962362191.mp4',NULL,320,'advanced','yoga','en','[\"stretching\", \"flexibility\", \"recovery\"]','pending',NULL,0,0,1,'2025-10-24 03:46:42','2025-10-24 03:46:42'),(17,12,'Pilates Core Session','Learn basic boxing techniques while getting an amazing cardio workout.','video','/uploads/1761266802760-328410251.mp4',NULL,280,'advanced','wellness','en','[\"functional\", \"movement\", \"daily\"]','pending',NULL,0,0,1,'2025-10-24 03:46:42','2025-10-24 03:46:42'),(18,13,'Pilates Core Session','Challenge yourself with bodyweight exercises that require no equipment.','video','/uploads/1761266802915-991281554.mp4',NULL,160,'intermediate','cardio','en','[\"resistance\", \"bands\", \"strength\"]','pending',NULL,0,0,1,'2025-10-24 03:46:42','2025-10-24 03:46:42'),(19,13,'Boxing Workout','Designed to improve flexibility, reduce stress, and enhance mobility.','video','/uploads/1761266802942-995064299.mp4',NULL,220,'intermediate','strength','en','[\"bodyweight\", \"no-equipment\", \"challenge\"]','pending',NULL,0,0,1,'2025-10-24 03:46:42','2025-10-24 03:46:43'),(20,13,'Resistance Band Training','A dynamic workout combining cardio and strength training for maximum results.','video','/uploads/1761266803028-527821483.mp4',NULL,240,'beginner','strength','en','[\"functional\", \"movement\", \"daily\"]','pending',NULL,0,0,1,'2025-10-24 03:46:43','2025-10-24 03:46:43');
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
  CONSTRAINT `trainers_ibfk_410` FOREIGN KEY (`applicationId`) REFERENCES `TrainerApplications` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `trainers_ibfk_411` FOREIGN KEY (`verifiedBy`) REFERENCES `Users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
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
  CONSTRAINT `userachievements_ibfk_61` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `userachievements_ibfk_62` FOREIGN KEY (`achievementId`) REFERENCES `Achievements` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
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
  CONSTRAINT `userchallengeprogress_ibfk_215` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `userchallengeprogress_ibfk_216` FOREIGN KEY (`challengeId`) REFERENCES `Challenges` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
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
  CONSTRAINT `usercontentprogress_ibfk_215` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `usercontentprogress_ibfk_216` FOREIGN KEY (`contentId`) REFERENCES `Contents` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
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
  CONSTRAINT `userexerciseprogress_ibfk_322` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `userexerciseprogress_ibfk_323` FOREIGN KEY (`workoutPlanId`) REFERENCES `WorkoutPlans` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `userexerciseprogress_ibfk_324` FOREIGN KEY (`exerciseId`) REFERENCES `WorkoutExercises` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `UserExerciseProgress`
--

