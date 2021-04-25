const { NotFound } = require('http-errors');
const User = require('./user.entity');
const mongoose = require('mongoose');
const { GameStatus } = require('../commons/utilities/constants');

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

    async informGameResult(game){
        const user = await findOne(game.userId);
        const isWin = game.status == GameStatus.Win;
        if(isWin){
            user.wonGames++;           
        }
        user.totalGames++;
        let currentBest = user.bestTimes[game.difficulty];

        if(!currentBest){
            currentBest = Number.MAX_SAFE_INTEGER;
        }
        
        user.bestTimes[game.difficulty] = Math.min(currentBest, (game.endTimeStamp - game.startTimeStamp)/1000);
        await user.save();
    }
}

module.exports = new UserService();