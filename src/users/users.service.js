const { NotFound } = require('http-errors');
const User = require('./user.entity');
const mongoose = require('mongoose');

class UserService {
    async create(payload) {
        const user = new User(payload);
        const { _id, firstName, lastName, username }  = await user.save();
        return { id: _id, firstName, lastName, username }
    }

    findAll(mode) {
        const limit = 10

        const sortObj = {};
        sortObj[`bestTimes.${mode}`] = 'asc'

        return User.find({}, { password: false })
            .limit(limit)
            .sort(sortObj)
            .exec();
    }

    async findOne(id) {
        const user = await User.findById(id).exec();
        if (!user) {
            throw new NotFound(`User with id ${id} not found.`);
        }
        return user;
    }

    async delete(id) {
        const user = await this.findOne(id);
        return await user.remove();
    }
}

module.exports = new UserService();