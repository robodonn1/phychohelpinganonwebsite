const express = require('express');
const bcrypt = require('bcrypt');

const app = express();

app.listen(3000, async () => {
    const passwrodHash = await bcrypt.hash('UserPassword1!', 10);
    console.log(passwrodHash);
})