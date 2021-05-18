const { NotFound } = require('http-errors');
const User = require('./user.entity');
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
        const varName = `bestTimes.${mode}`;
        sortObj[varName] = 'asc'

        const filter = {};
        filter [varName] = {$gt : 0};

        return User.find(filter, { password: false,  __v : false})
            .limit(limit)
            .sort(sortObj)
            .exec();
    }

    async findOne(id, hidePassword) {
        const parameters = {
            __v : false
        };

        if(hidePassword){
            parameters.password = false;
        }

        const user = await User
        .findById(id, parameters)
        .exec();
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
        const user = await this.findOne(game.user);

        const isWin = game.status == GameStatus.Win;
        if(isWin){            
            user.wonGames++;

            let currentBest = user.bestTimes[game.difficulty];

            if(!currentBest){
                currentBest = Number.MAX_SAFE_INTEGER;
            }

            const newBestTime = Math.min(currentBest, (game.endTimeStamp - game.startTimeStamp)/1000);
            const bestTimesCopy = {...user.bestTimes};

            bestTimesCopy[game.difficulty] = newBestTime;
            user.bestTimes = bestTimesCopy;
            
            await user.save();        
        }      
    }

    async informGameCreated(userId){
        const user = await this.findOne(userId);
        user.totalGames++;
        await user.save();
    }

}

module.exports = new UserService();