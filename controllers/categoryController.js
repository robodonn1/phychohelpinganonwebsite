const { PostCategory } = require('../models/posts');

class CategoryController {
    async getAllCategories(req, res) {
        try {
            const categories = await PostCategory.findAll({ order: [['name', 'ASC']] });
            return res.status(200).json({ success: true, categories });
        } catch (e) {
            return res.status(500).json({ error: e.message, success: false });
        }
    }

    async createCategory(req, res) {
        const { name, linkName, type } = req.body;
        if (!name || !linkName || !type) {
            return res.status(400).json({ error: 'name, linkName и type обязательны', success: false });
        }
        try {
            const category = await PostCategory.create({ name, linkName, type });
            return res.status(201).json({ success: true, category });
        } catch (e) {
            return res.status(500).json({ error: e.message, success: false });
        }
    }

    async updateCategory(req, res) {
        const { id } = req.params;
        const { name, linkName, type } = req.body;
        try {
            const category = await PostCategory.findByPk(id);
            if (!category) return res.status(404).json({ error: 'Категория не найдена', success: false });
            await category.update({ name, linkName, type });
            return res.status(200).json({ success: true, category });
        } catch (e) {
            return res.status(500).json({ error: e.message, success: false });
        }
    }

    async deleteCategory(req, res) {
        const { id } = req.params;
        try {
            const category = await PostCategory.findByPk(id);
            if (!category) return res.status(404).json({ error: 'Категория не найдена', success: false });
            await category.destroy();
            return res.status(200).json({ success: true });
        } catch (e) {
            return res.status(500).json({ error: e.message, success: false });
        }
    }
}

module.exports = CategoryController;