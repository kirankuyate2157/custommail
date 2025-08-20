const express = require('express');
const bodyParser = require('body-parser');
const emailRoutes = require('./routes/email.routes');
require('dotenv').config();

const app = express();
app.use(bodyParser.json());

app.use('/api/email', emailRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
