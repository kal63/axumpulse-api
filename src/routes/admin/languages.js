const express = require('express');
const router = express.Router();
const { ok, err } = require('../../utils/errors');
const { Language } = require('../../models');

// GET /api/v1/admin/languages
router.get('/', async (req, res) => {
    try {
        console.log('Getting languages...');
        console.log('Language model loaded');

        const languages = await Language.findAll({
            order: [['name', 'ASC']]
        });
        console.log('Languages found:', languages.length);
        ok(res, { items: languages });
    } catch (error) {
        console.error('Languages error:', error);
        err(res, error);
    }
});

// POST /api/v1/admin/languages
router.post('/', async (req, res) => {
    try {
        const payload = req.body || {};
        const created = await Language.create(payload);
        ok(res, { language: created });
    } catch (error) {
        err(res, error);
    }
});

// PUT /api/v1/admin/languages/:id
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const language = await Language.findByPk(id);
        if (!language) {
            return err(res, { code: 'NOT_FOUND', message: 'Language not found' }, 404);
        }

        await language.update(req.body || {});
        ok(res, { language });
    } catch (error) {
        err(res, error);
    }
});

// POST /api/v1/admin/languages/:id/toggle
router.post('/:id/toggle', async (req, res) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;

        const language = await Language.findByPk(id);
        if (!language) {
            return err(res, { code: 'NOT_FOUND', message: 'Language not found' }, 404);
        }

        language.isActive = isActive;
        await language.save();

        ok(res, { language });
    } catch (error) {
        err(res, error);
    }
});

// DELETE /api/v1/admin/languages/:id
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const language = await Language.findByPk(id);
        if (!language) {
            return err(res, { code: 'NOT_FOUND', message: 'Language not found' }, 404);
        }

        await language.destroy();
        ok(res, { deleted: true });
    } catch (error) {
        err(res, error);
    }
});

module.exports = router;



