'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		// Индекс для сортировки постов по дате
		await queryInterface.addIndex('Post', ['createdAt'], {
			name: 'posts_created_at_index'
		});

		// Индекс для связи поста с пользователем
		await queryInterface.addIndex('Post', ['userId'], {
			name: 'posts_user_id_index'
		});

		// Индекс для гостя
		await queryInterface.addIndex('Post', ['guestId'], {
			name: 'posts_guest_id_index'
		});

		await queryInterface.addIndex('Post', ['categoryId'], {
			name: 'posts_category_id_index'
		});
	},

	async down(queryInterface, Sequelize) {
		// При откате удаляем индексы (по имени)
		await queryInterface.removeIndex('Post', 'posts_created_at_index');
		await queryInterface.removeIndex('Post', 'posts_user_id_index');
		await queryInterface.removeIndex('Post', 'posts_guest_id_index');
		await queryInterface.removeIndex('Post', 'posts_category_id_index');
	}
};