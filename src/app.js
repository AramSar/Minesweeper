require('dotenv').config({
    path: process.env.NODE_ENV === 'test' ? '.env.test' : '.env'
});
require('./db-connection');
const express = require('express');
const app = express();
const users = require('./users/users.controller');
const auth = require('./auth/auth.controller');
const { handleError } = require('./commons/middlewares/error-handler.middleware');
const { jwtMiddleware } = require('./commons/middlewares/auth.middleware');
const cors = require('cors');

app.use(cors());
app.use(express.urlencoded({ extended: false }))
app.use(express.json())

app.use(jwtMiddleware.unless({
    path: [
        '/auth/login',
        { url: '/users', methods: ['POST'] }
    ]
}));

app.use('/users', users);
app.use('/auth', auth);

app.use(handleError);

module.exports = app;