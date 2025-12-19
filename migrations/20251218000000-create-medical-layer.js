'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Helpers
    async function getExistingTables() {
      const tables = await queryInterface.showAllTables();
      return new Set((tables || []).map((t) => String(t).toLowerCase()));
    }

    async function ensureTable(tableName, createFn) {
      const existing = await getExistingTables();
      if (existing.has(String(tableName).toLowerCase())) {
        console.log(`Table ${tableName} already exists, skipping create.`);
        return;
      }
      await createFn();
      console.log(`Created table ${tableName}.`);
    }

    // 1) users: add isMedical flag (keep existing camelCase column style)
    try {
      const usersInfo = await queryInterface.describeTable('users');
      if (!usersInfo.isMedical) {
        await queryInterface.addColumn('users', 'isMedical', {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false
        });
        await queryInterface.addIndex('users', ['isMedical'], { name: 'users_is_medical_idx' });
        console.log('Added users.isMedical');
      } else {
        console.log('users.isMedical already exists, skipping.');
      }
    } catch (e) {
      // Some environments may have Users instead of users
      const usersInfo = await queryInterface.describeTable('Users');
      if (!usersInfo.isMedical) {
        await queryInterface.addColumn('Users', 'isMedical', {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false
        });
        await queryInterface.addIndex('Users', ['isMedical'], { name: 'users_is_medical_idx' });
        console.log('Added Users.isMedical');
      } else {
        console.log('Users.isMedical already exists, skipping.');
      }
    }

    // 2) Medical professional application workflow (mirrors TrainerApplications + CertificationFiles)
    await ensureTable('medical_professional_applications', async () => {
      await queryInterface.createTable('medical_professional_applications', {
        id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
        userId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          unique: true,
          references: { model: 'users', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        professionalType: {
          type: Sequelize.ENUM('doctor', 'nurse', 'health_coach', 'nutritionist'),
          allowNull: false
        },
        specialties: { type: Sequelize.JSON, allowNull: false, defaultValue: [] },
        yearsOfExperience: { type: Sequelize.INTEGER, allowNull: true },
        bio: { type: Sequelize.TEXT, allowNull: true },
        languages: { type: Sequelize.JSON, allowNull: false, defaultValue: [] },
        licenseInfo: { type: Sequelize.JSON, allowNull: false, defaultValue: {} },
        portfolio: { type: Sequelize.JSON, allowNull: false, defaultValue: [] },
        socialMedia: { type: Sequelize.JSON, allowNull: false, defaultValue: {} },
        preferences: { type: Sequelize.JSON, allowNull: false, defaultValue: {} },
        status: {
          type: Sequelize.ENUM('pending', 'under_review', 'approved', 'rejected'),
          allowNull: false,
          defaultValue: 'pending'
        },
        rejectionReason: { type: Sequelize.TEXT, allowNull: true },
        adminNotes: { type: Sequelize.TEXT, allowNull: true },
        submittedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
        reviewedAt: { type: Sequelize.DATE, allowNull: true },
        reviewedBy: { type: Sequelize.INTEGER, allowNull: true, references: { model: 'users', key: 'id' } },
        createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.NOW },
        updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.NOW }
      });

      await queryInterface.addIndex('medical_professional_applications', ['status'], {
        name: 'medical_professional_applications_status_idx'
      });
      await queryInterface.addIndex('medical_professional_applications', ['submittedAt'], {
        name: 'medical_professional_applications_submitted_at_idx'
      });
    });

    await ensureTable('medical_credential_files', async () => {
      await queryInterface.createTable('medical_credential_files', {
        id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
        applicationId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'medical_professional_applications', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        fileName: { type: Sequelize.STRING(255), allowNull: false },
        fileUrl: { type: Sequelize.STRING(500), allowNull: false },
        fileType: { type: Sequelize.STRING(80), allowNull: false },
        fileSize: { type: Sequelize.INTEGER, allowNull: false },
        createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.NOW },
        updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.NOW }
      });

      await queryInterface.addIndex('medical_credential_files', ['applicationId'], {
        name: 'medical_credential_files_application_id_idx'
      });
    });

    await ensureTable('medical_professionals', async () => {
      await queryInterface.createTable('medical_professionals', {
        userId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          primaryKey: true,
          references: { model: 'users', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        professionalType: {
          type: Sequelize.ENUM('doctor', 'nurse', 'health_coach', 'nutritionist'),
          allowNull: false
        },
        bio: { type: Sequelize.TEXT, allowNull: true },
        specialties: { type: Sequelize.JSON, allowNull: false, defaultValue: [] },
        verified: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
        applicationId: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: 'medical_professional_applications', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        verifiedAt: { type: Sequelize.DATE, allowNull: true },
        verifiedBy: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: 'users', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.NOW },
        updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.NOW }
      });

      await queryInterface.addIndex('medical_professionals', ['verified'], { name: 'medical_professionals_verified_idx' });
      await queryInterface.addIndex('medical_professionals', ['applicationId'], { name: 'medical_professionals_application_id_idx' });
    });

    // 3) User medical profile (PHI)
    await ensureTable('user_medical_profiles', async () => {
      await queryInterface.createTable('user_medical_profiles', {
        id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
        userId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          unique: true,
          references: { model: 'users', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        conditions: { type: Sequelize.JSON, allowNull: false, defaultValue: [] },
        medications: { type: Sequelize.JSON, allowNull: false, defaultValue: [] },
        allergies: { type: Sequelize.JSON, allowNull: false, defaultValue: [] },
        surgeries: { type: Sequelize.JSON, allowNull: false, defaultValue: [] },
        pregnancyStatus: { type: Sequelize.STRING(32), allowNull: true },
        contraindications: { type: Sequelize.JSON, allowNull: false, defaultValue: [] },
        notes: { type: Sequelize.TEXT, allowNull: true },
        updatedBy: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: 'users', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.NOW },
        updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.NOW }
      });
      await queryInterface.addIndex('user_medical_profiles', ['userId'], {
        unique: true,
        name: 'user_medical_profiles_user_id_unique'
      });
    });

    // 4) Intake forms + responses
    await ensureTable('intake_forms', async () => {
      await queryInterface.createTable('intake_forms', {
        id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
        version: { type: Sequelize.STRING(16), allowNull: false },
        schema: { type: Sequelize.JSON, allowNull: false, defaultValue: {} },
        status: { type: Sequelize.ENUM('draft', 'published'), allowNull: false, defaultValue: 'draft' },
        publishedAt: { type: Sequelize.DATE, allowNull: true },
        createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.NOW },
        updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.NOW }
      });
      await queryInterface.addIndex('intake_forms', ['status'], { name: 'intake_forms_status_idx' });
    });

    await ensureTable('intake_responses', async () => {
      await queryInterface.createTable('intake_responses', {
        id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
        userId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'users', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        formId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'intake_forms', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT'
        },
        answers: { type: Sequelize.JSON, allowNull: false, defaultValue: {} },
        createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.NOW },
        updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.NOW }
      });
      await queryInterface.addIndex('intake_responses', ['userId'], { name: 'intake_responses_user_id_idx' });
      await queryInterface.addIndex('intake_responses', ['formId'], { name: 'intake_responses_form_id_idx' });
    });

    // 5) Triage rules + runs
    await ensureTable('triage_rules', async () => {
      await queryInterface.createTable('triage_rules', {
        id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
        name: { type: Sequelize.STRING(128), allowNull: false },
        version: { type: Sequelize.STRING(16), allowNull: false },
        severity: { type: Sequelize.ENUM('low', 'medium', 'high', 'critical'), allowNull: false },
        status: { type: Sequelize.ENUM('draft', 'published', 'retired'), allowNull: false, defaultValue: 'draft' },
        definition: { type: Sequelize.JSON, allowNull: false, defaultValue: {} },
        publishedBy: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: 'users', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        publishedAt: { type: Sequelize.DATE, allowNull: true },
        createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.NOW },
        updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.NOW }
      });
      await queryInterface.addIndex('triage_rules', ['status'], { name: 'triage_rules_status_idx' });
      await queryInterface.addIndex('triage_rules', ['severity'], { name: 'triage_rules_severity_idx' });
    });

    await ensureTable('triage_runs', async () => {
      await queryInterface.createTable('triage_runs', {
        id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
        userId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'users', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        intakeResponseId: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: 'intake_responses', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        inputs: { type: Sequelize.JSON, allowNull: false, defaultValue: {} },
        ruleHits: { type: Sequelize.JSON, allowNull: false, defaultValue: [] },
        riskLevel: { type: Sequelize.ENUM('low', 'medium', 'high', 'critical'), allowNull: false },
        disposition: { type: Sequelize.ENUM('ok', 'book_consult', 'urgent_care'), allowNull: false },
        messages: { type: Sequelize.JSON, allowNull: false, defaultValue: [] },
        createdByType: { type: Sequelize.ENUM('ai', 'medical'), allowNull: false, defaultValue: 'ai' },
        createdBy: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: 'users', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.NOW },
        updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.NOW }
      });
      await queryInterface.addIndex('triage_runs', ['userId'], { name: 'triage_runs_user_id_idx' });
      await queryInterface.addIndex('triage_runs', ['disposition'], { name: 'triage_runs_disposition_idx' });
      await queryInterface.addIndex('triage_runs', ['riskLevel'], { name: 'triage_runs_risk_level_idx' });
    });

    // 6) Q&A
    await ensureTable('medical_questions', async () => {
      await queryInterface.createTable('medical_questions', {
        id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
        userId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'users', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        triageRunId: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: 'triage_runs', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        text: { type: Sequelize.TEXT, allowNull: false },
        tags: { type: Sequelize.JSON, allowNull: false, defaultValue: [] },
        status: { type: Sequelize.ENUM('open', 'answered', 'closed'), allowNull: false, defaultValue: 'open' },
        createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.NOW },
        updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.NOW }
      });
      await queryInterface.addIndex('medical_questions', ['userId'], { name: 'medical_questions_user_id_idx' });
      await queryInterface.addIndex('medical_questions', ['status'], { name: 'medical_questions_status_idx' });
    });

    await ensureTable('medical_answers', async () => {
      await queryInterface.createTable('medical_answers', {
        id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
        questionId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'medical_questions', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        responderId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'users', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT'
        },
        text: { type: Sequelize.TEXT, allowNull: false },
        visibility: { type: Sequelize.ENUM('user', 'user_trainer', 'internal'), allowNull: false, defaultValue: 'user' },
        createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.NOW },
        updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.NOW }
      });
      await queryInterface.addIndex('medical_answers', ['questionId'], { name: 'medical_answers_question_id_idx' });
      await queryInterface.addIndex('medical_answers', ['responderId'], { name: 'medical_answers_responder_id_idx' });
    });

    await ensureTable('medical_attachments', async () => {
      await queryInterface.createTable('medical_attachments', {
        id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
        ownerId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'users', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        entityType: {
          type: Sequelize.ENUM('question', 'answer', 'consult_note', 'medical_application'),
          allowNull: false
        },
        entityId: { type: Sequelize.INTEGER, allowNull: false },
        fileName: { type: Sequelize.STRING(255), allowNull: false },
        fileUrl: { type: Sequelize.STRING(500), allowNull: false },
        fileType: { type: Sequelize.STRING(80), allowNull: false },
        fileSize: { type: Sequelize.INTEGER, allowNull: false },
        createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.NOW },
        updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.NOW }
      });
      await queryInterface.addIndex('medical_attachments', ['ownerId'], { name: 'medical_attachments_owner_id_idx' });
      await queryInterface.addIndex('medical_attachments', ['entityType', 'entityId'], {
        name: 'medical_attachments_entity_idx'
      });
    });

    // 7) Consults
    await ensureTable('consult_slots', async () => {
      await queryInterface.createTable('consult_slots', {
        id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
        providerId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'users', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        startAt: { type: Sequelize.DATE, allowNull: false },
        endAt: { type: Sequelize.DATE, allowNull: false },
        type: { type: Sequelize.ENUM('quick', 'full', 'follow_up'), allowNull: false },
        timezone: { type: Sequelize.STRING(64), allowNull: true },
        status: { type: Sequelize.ENUM('open', 'closed'), allowNull: false, defaultValue: 'open' },
        createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.NOW },
        updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.NOW }
      });
      await queryInterface.addIndex('consult_slots', ['providerId'], { name: 'consult_slots_provider_id_idx' });
      await queryInterface.addIndex('consult_slots', ['startAt'], { name: 'consult_slots_start_at_idx' });
      await queryInterface.addIndex('consult_slots', ['status'], { name: 'consult_slots_status_idx' });
    });

    await ensureTable('consult_bookings', async () => {
      await queryInterface.createTable('consult_bookings', {
        id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
        userId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'users', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        slotId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'consult_slots', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        status: {
          type: Sequelize.ENUM('booked', 'canceled', 'completed', 'no_show'),
          allowNull: false,
          defaultValue: 'booked'
        },
        canceledAt: { type: Sequelize.DATE, allowNull: true },
        cancelReason: { type: Sequelize.TEXT, allowNull: true },
        createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.NOW },
        updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.NOW }
      });
      await queryInterface.addIndex('consult_bookings', ['userId'], { name: 'consult_bookings_user_id_idx' });
      await queryInterface.addIndex('consult_bookings', ['slotId'], { unique: true, name: 'consult_bookings_slot_id_unique' });
      await queryInterface.addIndex('consult_bookings', ['status'], { name: 'consult_bookings_status_idx' });
    });

    await ensureTable('consult_notes', async () => {
      await queryInterface.createTable('consult_notes', {
        id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
        bookingId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          unique: true,
          references: { model: 'consult_bookings', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        providerId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'users', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        soap: { type: Sequelize.JSON, allowNull: false, defaultValue: {} },
        diagnoses: { type: Sequelize.JSON, allowNull: false, defaultValue: [] },
        recommendations: { type: Sequelize.JSON, allowNull: false, defaultValue: [] },
        followUps: { type: Sequelize.JSON, allowNull: false, defaultValue: [] },
        constraints: { type: Sequelize.JSON, allowNull: false, defaultValue: {} },
        summaryShared: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
        summaryVersion: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
        createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.NOW },
        updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.NOW }
      });
      await queryInterface.addIndex('consult_notes', ['providerId'], { name: 'consult_notes_provider_id_idx' });
    });

    // 8) Health data & alerts
    await ensureTable('health_data_points', async () => {
      await queryInterface.createTable('health_data_points', {
        id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
        userId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'users', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        metric: {
          type: Sequelize.ENUM('hr', 'bp_systolic', 'bp_diastolic', 'glucose', 'sleep', 'steps', 'hrv', 'weight'),
          allowNull: false
        },
        value: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
        unit: { type: Sequelize.STRING(16), allowNull: true },
        source: { type: Sequelize.STRING(64), allowNull: true },
        capturedAt: { type: Sequelize.DATE, allowNull: false },
        createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.NOW },
        updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.NOW }
      });
      await queryInterface.addIndex('health_data_points', ['userId', 'capturedAt'], { name: 'health_data_points_user_time_idx' });
      await queryInterface.addIndex('health_data_points', ['metric'], { name: 'health_data_points_metric_idx' });
    });

    await ensureTable('health_data_rollups', async () => {
      await queryInterface.createTable('health_data_rollups', {
        id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
        userId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'users', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        metric: { type: Sequelize.STRING(32), allowNull: false },
        periodDate: { type: Sequelize.DATEONLY, allowNull: false },
        agg: { type: Sequelize.JSON, allowNull: false, defaultValue: {} },
        createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.NOW },
        updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.NOW }
      });
      await queryInterface.addIndex('health_data_rollups', ['userId', 'metric', 'periodDate'], {
        unique: true,
        name: 'health_data_rollups_user_metric_date_unique'
      });
    });

    await ensureTable('health_alerts', async () => {
      await queryInterface.createTable('health_alerts', {
        id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
        userId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'users', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        triggerSource: { type: Sequelize.ENUM('threshold', 'triage', 'manual'), allowNull: false },
        severity: { type: Sequelize.ENUM('info', 'warn', 'high'), allowNull: false, defaultValue: 'info' },
        message: { type: Sequelize.TEXT, allowNull: false },
        status: { type: Sequelize.ENUM('open', 'ack', 'closed'), allowNull: false, defaultValue: 'open' },
        assignedTo: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: 'users', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.NOW },
        updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.NOW }
      });
      await queryInterface.addIndex('health_alerts', ['userId'], { name: 'health_alerts_user_id_idx' });
      await queryInterface.addIndex('health_alerts', ['status'], { name: 'health_alerts_status_idx' });
      await queryInterface.addIndex('health_alerts', ['assignedTo'], { name: 'health_alerts_assigned_to_idx' });
    });
  },

  async down(queryInterface, Sequelize) {
    // Drop in reverse dependency order
    const dropIfExists = async (name) => {
      const tables = await queryInterface.showAllTables();
      const existing = new Set((tables || []).map((t) => String(t).toLowerCase()));
      if (!existing.has(String(name).toLowerCase())) return;
      await queryInterface.dropTable(name);
    };

    await dropIfExists('health_alerts');
    await dropIfExists('health_data_rollups');
    await dropIfExists('health_data_points');

    await dropIfExists('consult_notes');
    await dropIfExists('consult_bookings');
    await dropIfExists('consult_slots');

    await dropIfExists('medical_attachments');
    await dropIfExists('medical_answers');
    await dropIfExists('medical_questions');

    await dropIfExists('triage_runs');
    await dropIfExists('triage_rules');

    await dropIfExists('intake_responses');
    await dropIfExists('intake_forms');

    await dropIfExists('user_medical_profiles');
    await dropIfExists('medical_professionals');
    await dropIfExists('medical_credential_files');
    await dropIfExists('medical_professional_applications');

    // Remove users.isMedical (best-effort)
    try {
      const usersInfo = await queryInterface.describeTable('users');
      if (usersInfo.isMedical) {
        try {
          await queryInterface.removeIndex('users', 'users_is_medical_idx');
        } catch (e) {}
        await queryInterface.removeColumn('users', 'isMedical');
      }
    } catch (e) {
      const usersInfo = await queryInterface.describeTable('Users');
      if (usersInfo.isMedical) {
        try {
          await queryInterface.removeIndex('Users', 'users_is_medical_idx');
        } catch (e2) {}
        await queryInterface.removeColumn('Users', 'isMedical');
      }
    }
  }
};


