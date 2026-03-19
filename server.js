require('dotenv').config({ path: './settings.env' });
const cookieParser = require('cookie-parser');
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const sequelize = require('./models');
const path = require('node:path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`); // Логируем все запросы
    next();
});

app.use(helmet({ hsts: false }));
app.use(rateLimit({
    windowMs: 60 * 1000,
    max: 200,
    message: {
        error: "Сервер нагружен попробуйте позже",
    },
}));

app.use(cors({
    origin: 'https://psycheapost.vercel.app',
    credentials: true,
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded());

app.use('/serverFiles', (req, res, next) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
}, express.static(path.join(__dirname, 'serverFiles')));

app.use('/posts', require('./routes/posts'));
app.use('/users', require('./routes/users'));
app.use('/reviews', require('./routes/reviews'));
app.use('/admin', require('./routes/admin'))


app.use((req, res) => {
    res.status(404).json({ error: 'Маршрут не найден', success: false });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Внутренняя ошибка сервера', success: false });
});

app.listen(PORT, async () => {
    await sequelize.authenticate();
    console.log('http://localhost:' + PORT);
});

//config/config.json
// {
//     "development": {
//         "username": "root",
//             "password": null,
//                 "database": "database_development",
//                     "host": "127.0.0.1",
//                         "dialect": "sqlite",
//                             "storage": "database.sqlite"
//     },
//     "test": {
//         "username": "root",
//             "password": null,
//                 "database": "database_test",
//                     "host": "127.0.0.1",
//                         "dialect": "sqlite"
//     },
//     "production": {
//         "username": "root",
//             "password": null,
//                 "database": "database_production",
//                     "host": "127.0.0.1",
//                         "dialect": "sqlite"
//     }
// }
