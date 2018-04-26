'use strict';
const express = require('express');
const path = require('path');
const PORT = process.env.PORT || 5000;

// from heroku base
const app = express();
app
    .use(express.static(path.join(__dirname, 'res'))) // allow this content to be statically accessed
    // .set('views', path.join(__dirname, 'views'))
    // .set('view engine', 'ejs')
    .get('*', (req, res) => res.send('index.html'));

app.listen(PORT, () => console.log(`Listening on ${ PORT }`));
