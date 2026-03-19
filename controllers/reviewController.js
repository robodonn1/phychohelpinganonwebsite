const { Review } = require("../models/users");


class ReviewController {
    async createReview(req, res) {
        const { reviewText } = req.body;

        try {
            if (!reviewText) return res.status(400).json({
                error: "Введите текст отзыва",
                success: false,
            });
            if (/<[^>]*>/.test(reviewText)) return res.status(400).json({
                error: "Не используйте специальные символы при введении заголовка",
                success: false,
            });

            const newReview = await Review.create({
                id: crypto.randomUUID(),
                userId: req.user.id,
                text: reviewText,
            });

            return res.status(200).json({
                success: true,
                review: newReview,
            });
        } catch (e) {
            return res.status(500).json({
                error: e.message,
                success: false,
            });
        }
    }

    async getReviews(req, res) {
        try {
            const reviews = await Review.findAll({
                order: [['createdAt', 'DESC']],
                limit: 20,
            });

            return res.status(200).json({
                success: true,
                reviews: reviews,
            });
        } catch (e) {
            return res.status(500).json({
                erroe: e.message,
                success: false,
            });
        }
    }

    async getAllReviews(req, res) {
        try {
            const reviews = await Review.findAll();

            return res.status(200).json({
                success: true,
                reviews,
            });
        } catch (e) {
            return res.status(500).json({
                error: e.message,
                success: false,
            });
        }
    }

    async deleteReview(req, res) {
        const reviewId = req.params.reviewId;
        try {
            const curReview = await Review.findByPk(reviewId);

            if (req.user.id != curReview.userId && req.user.role != 'admin') return res.status(403).json({
                error: "Вы не можете удалить этот отзыв",
                success: false,
            });

            await curReview.destroy();

            return res.status(200).json({
                success: true,
            });
        } catch (e) {
            return res.status(500).json({
                error: e.message,
                success: false,
            });
        }
    }
}

module.exports = new ReviewController;