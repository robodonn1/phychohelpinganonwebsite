const { Reaction } = require('../models/posts');

class ReactionController {
    async getAllReactions(req, res) {
        try {
            const reactions = await Reaction.findAll();
            return res.status(200).json({ success: true, reactions });
        } catch (e) {
            return res.status(500).json({ error: e.message, success: false });
        }
    }

    async createReaction(req, res) {
        const { name, slug } = req.body;
        if (!name || !slug) {
            return res.status(400).json({ error: 'name и slug обязательны', success: false });
        }
        try {
            const reaction = await Reaction.create({ name, slug });
            return res.status(201).json({ success: true, reaction });
        } catch (e) {
            return res.status(500).json({ error: e.message, success: false });
        }
    }

    async updateReaction(req, res) {
        const { id } = req.params;
        const { name, slug } = req.body;
        try {
            const reaction = await Reaction.findByPk(id);
            if (!reaction) return res.status(404).json({ error: 'Реакция не найдена', success: false });
            await reaction.update({ name, slug });
            return res.status(200).json({ success: true, reaction });
        } catch (e) {
            return res.status(500).json({ error: e.message, success: false });
        }
    }

    async deleteReaction(req, res) {
        const { id } = req.params;
        try {
            const reaction = await Reaction.findByPk(id);
            if (!reaction) return res.status(404).json({ error: 'Реакция не найдена', success: false });
            await reaction.destroy();
            return res.status(200).json({ success: true });
        } catch (e) {
            return res.status(500).json({ error: e.message, success: false });
        }
    }
}

module.exports = ReactionController;