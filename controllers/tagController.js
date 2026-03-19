const { Tag } = require('../models/posts');
const crypto = require('crypto');

class TagController {
    async getAllTags(req, res) {
        try {
            const tags = await Tag.findAll({ order: [['name', 'ASC']] });
            return res.status(200).json({ success: true, tags });
        } catch (e) {
            return res.status(500).json({ error: e.message, success: false });
        }
    }

    async createTag(req, res) {
        const { name, slug } = req.body;
        if (!name || !slug) {
            return res.status(400).json({ error: 'name и slug обязательны', success: false });
        }
        try {
            const tag = await Tag.create({ name, slug });
            return res.status(201).json({ success: true, tag });
        } catch (e) {
            return res.status(500).json({ error: e.message, success: false });
        }
    }

    async updateTag(req, res) {
        const { id } = req.params;
        const { name, slug } = req.body;
        try {
            const tag = await Tag.findByPk(id);
            if (!tag) return res.status(404).json({ error: 'Тег не найден', success: false });
            await tag.update({ name, slug });
            return res.status(200).json({ success: true, tag });
        } catch (e) {
            return res.status(500).json({ error: e.message, success: false });
        }
    }

    async deleteTag(req, res) {
        const { id } = req.params;
        try {
            const tag = await Tag.findByPk(id);
            if (!tag) return res.status(404).json({ error: 'Тег не найден', success: false });
            await tag.destroy();
            return res.status(200).json({ success: true });
        } catch (e) {
            return res.status(500).json({ error: e.message, success: false });
        }
    }
}

module.exports = TagController;