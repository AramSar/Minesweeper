const { BadRequest, Forbidden } = require('http-errors');
const Game = require('./game.entity');
const mongoose = require('mongoose');
const { GameStatus, Difficulty } = require("../commons/utilities/constants");
const UserService = requre("../users/users.service");

class GameService {
    async create(userId, difficulty) {

        const dimentions = getDimentions(difficulty);

        const mineCount = difficulty == Difficulty.Easy ?  10: 
                          difficulty == Difficulty.Medium ? 40 :
                          difficulty == Difficulty.Hard ? 99 : 0;
        
        if(!mineCount || !dimentions)
        {
            throw new BadRequest();
        }

        const mineSet = new Set();

        while(mineSet.length < mineCount)
        {
            mineSet.push(Math.floor(Math.random()*siz[0]*dimentions[1]))
        }

        const payload = {
            difficulty : difficulty,
            user : userId,
            opened : [],
            mines : mineSet,
            status : GameStatus.InProgress,
            startTimeStamp : Date.now().getTime(),
        }

        const game = new Game(payload);
        const { _id }  = await game.save();
        return { id: _id, dimentions };
    }

    async openCell(gameId, userId, cell){
        const game = await Game.findById(gameId).exec();
        if(game?.userId !== userId){
            throw new Forbidden()
        }
        const cellNumber = toCellNumber(cell);
        
        if(game.opened.includes(cellNumber)){
            throw new BadRequest();
        }
        
        game.opened.push(cellNumber);
        const board = generateCompleteBoard(game.dimentions, game.mines);
        const value = getCellValue(game.dimentions, game.mines, cell);
        let len = game.opened.length;
        
        const result = {
            Cells : [{Cell : cell, Value : value}],
            Status : GameStatus.InProgress,
        }

        if(value == 0){
            openZeros(board, game.opened, cell);
        }
        else if(value == -1) {
            result.Status = GameStatus.Lose;
            game.status = 2;
        }
        
        if(result.Status == GameStatus.InProgress && game.opened.length + game.mines.length == game.dimentions[0] * game.dimentions[1]){
            result.Status = GameStatus.Win;
            game.status = GameStatus.Win;
        }

        if(result.Status != GameStatus.InProgress){
            game.endTimeStamp = Date.now().getTime();
            await UserService.informGameResult(game);
        }
              
        await game.save();

        for(;len<game.opened.length;len++){
            const cell = toCell(game.opened[len]);
            result.Cells.push( { Cell : cell, Value : getCellValue(board, cell) } );
        }

        return result;
    }

    async getFullBoard(gameId, userId){
        const game = await Game.findById(gameId).exec();

        if(game?.userId !== userId){
            throw new Forbidden();
        }

        const board = generateCompleteBoard(game.dimentions, game.mines);
        for(let i = 0;i<game.dimentions[0];i++){
            for(let j = 0; j<game.dimentions[1];j++){
                if(!game.opened.includes(toCellNumber([i,j]))){
                    board[i][j] = null;
                }
            }
        }

        return board;
    }
}


function getDimentions(difficulty){
    return difficulty == 1 ? [9,9] : 
           difficulty == 2 ? [16,16] :
           difficulty == 3 ? [30,16] : 0;
}

function getNeighbors(dim, cell){
    const result = [];

    for(let i of [-1,0,1]){
        for(let j of [-1,0,1]){
            if(i === 0 && j === 0){
                continue;
            }
            const cell1 = [cell[0] + i, cell[0] + j];
            if(cell1[0] < 0 || cell1[1] < 0 || cell1[0] >= dim[0] || cell1[1] >= dim[1]){
                continue;
            }
            result.push(cell1);
        }
    }
    return result;
}

function toCellNumber(dim, cell){
    return cell[0] * dim[1] + cell[1]; 
}

function toCell(dim, num){
    const c = num % dim[1];
    return [ (num - c)/dim[1] ,c]; 
}

function generateCompleteBoard(dim, mines){
    const board = new Array(dim[0]).fill(0).map(() => new Array(dim[1]).fill(0));
    for(let m of mines){
        const cell =  toCell(m);
        const neighbors = getNeighbors(dim, cell);
        board[cell[0]][cell[1]] = -1;
        for (let n of neighbors){
            board[n[0]][n[1]]++;
        }
    }
    return board;
}

function getCellValue(board, cell){
    return board[cell[0]][cell[1]];
}

function openZeros(board,openedCells, cell){
    if(getCellValue(board, cell) != 0){
        return;
    }

    const neighbors = getNeighbors([board.length,board[0].length], cell);
    for(let n in neighbors){
        const cellNum = toCellNumber(n);
        if(openedCells.includes(cellNum)){
            continue;
        }
        openedCells.push();
        openZeros(board, openedCells, n);
    }
}

module.exports = new GameService();