const { Issuer } = require('../models/users');

class IssuerController {
    async getAllIssuers(req, res) {
        try {
            const issuers = await Issuer.findAll({ order: [['name', 'ASC']] });
            return res.status(200).json({ success: true, issuers });
        } catch (e) {
            return res.status(500).json({ error: e.message, success: false });
        }
    }

    async createIssuer(req, res) {
        const { name, ogrn, inn } = req.body;
        if (!name || !ogrn || !inn) {
            return res.status(400).json({ error: 'name, ogrn и inn обязательны', success: false });
        }
        try {
            const issuer = await Issuer.create({ name, ogrn, inn });
            return res.status(201).json({ success: true, issuer });
        } catch (e) {
            return res.status(500).json({ error: e.message, success: false });
        }
    }

    async updateIssuer(req, res) {
        const { id } = req.params;
        const { name, ogrn, inn } = req.body;
        try {
            const issuer = await Issuer.findByPk(id);
            if (!issuer) return res.status(404).json({ error: 'Issuer не найден', success: false });
            await issuer.update({ name, ogrn, inn });
            return res.status(200).json({ success: true, issuer });
        } catch (e) {
            return res.status(500).json({ error: e.message, success: false });
        }
    }

    async deleteIssuer(req, res) {
        const { id } = req.params;
        try {
            const issuer = await Issuer.findByPk(id);
            if (!issuer) return res.status(404).json({ error: 'Issuer не найден', success: false });
            // Проверить, есть ли связанные лицензии?
            const licenseCount = await License.count({ where: { issuedId: id } });
            if (licenseCount > 0) {
                return res.status(400).json({ error: 'Нельзя удалить issuer, у которого есть лицензии', success: false });
            }
            await issuer.destroy();
            return res.status(200).json({ success: true });
        } catch (e) {
            return res.status(500).json({ error: e.message, success: false });
        }
    }
}

module.exports = IssuerController;