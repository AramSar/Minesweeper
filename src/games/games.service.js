const { BadRequest, Forbidden, NotFound } = require('http-errors');
const Game = require('./game.entity');
const { GameStatus, Difficulty } = require("../commons/utilities/constants");
const UserService = require("../users/users.service");

class GameService {
    async create(userId, difficulty) {

        const dimentions = getDimentions(difficulty);

        const mineCount = difficulty == Difficulty.Easy ? 10 :
            difficulty == Difficulty.Medium ? 40 :
                difficulty == Difficulty.Hard ? 99 : 0;

        if (!mineCount || !dimentions) {
            throw new BadRequest();
        }

        const mineSet = new Set();

        while (mineSet.size < mineCount) {
            mineSet.add(Math.floor(Math.random() * dimentions[0] * dimentions[1]))
        }

        console.log(mineSet);

        const payload = {
            difficulty: difficulty,
            user: userId,
            opened: [],
            mines: Array(...mineSet),
            status: GameStatus.InProgress,
            startTimeStamp: Date.now(),
        }

        const game = new Game(payload);
        const { _id } = await game.save();

        console.log("FINAL GAME", payload);
        await UserService.informGameCreated(userId);
        return { id: _id, dimentions, mineCount };
    }

    async openCell(gameId, userId, cell) {
        const game = await Game.findById(gameId).exec();
        console.log(game);

        if(!game){
            throw new NotFound("Game not found");
        }

        if (game.user != userId) {
            throw new Forbidden()
        }

        if(game.status != GameStatus.InProgress){
            throw new BadRequest("Game already ended");
        }

        const dim = getDimentions(game.difficulty);   
        
        if(cell[0] < 0 || cell[1] < 0 || cell[0] >= dim[0] || cell[1] >= dim[1]){
            throw new BadRequest("Invalid argument provided");
        }
        
        const cellNumber = toCellNumber(dim, cell);
        if (game.opened.includes(cellNumber)) {
            throw new BadRequest("Cell is already opened");
        }

        game.opened.push(cellNumber);
        const board = generateCompleteBoard(dim, game.mines);
        const value = getCellValue(board, cell);
        let len = game.opened.length;

        const result = {
            Cells: [{ Cell: cell, Value: value }],
            Status: GameStatus.InProgress,
        }

        if (value == 0) {
            openZeros(board, game.opened, cell);
        }
        else if (value == -1) {
            result.Status = GameStatus.Lose;
            game.status = 2;

            for(let bomb of game.mines){
                if(bomb != cellNumber){
                    result.Cells.push({Cell : toCell(dim, bomb), Value: -1});
                }
            }
        }

        if (result.Status == GameStatus.InProgress && game.opened.length + game.mines.length == dim[0] * dim[1]) {
            result.Status = GameStatus.Win;
            game.status = GameStatus.Win;
        }

        if (result.Status != GameStatus.InProgress) {
            game.endTimeStamp = Date.now();
            await UserService.informGameResult(game);
        }

        await game.save();

        for (; len < game.opened.length; len++) {
            const cell = toCell(dim, game.opened[len]);
            result.Cells.push({ Cell: cell, Value: getCellValue(board, cell) });
        }

        return result;
    }

    async getFullBoard(gameId, userId) {
        const game = await Game.findById(gameId).exec();

        if (game?.userId !== userId) {
            throw new Forbidden();
        }

        const board = generateCompleteBoard(game.dimentions, game.mines);
        for (let i = 0; i < game.dimentions[0]; i++) {
            for (let j = 0; j < game.dimentions[1]; j++) {
                if (!game.opened.includes(toCellNumber([i, j]))) {
                    board[i][j] = null;
                }
            }
        }

        return board;
    }
}


function getDimentions(difficulty) {
    return difficulty == Difficulty.Easy ? [9, 9] :
        difficulty == Difficulty.Medium ? [16, 16] :
            difficulty == Difficulty.Hard ? [16, 30] : 0;
}

function getNeighbors(dim, cell) {
    const result = [];

    for (let i of [-1, 0, 1]) {
        for (let j of [-1, 0, 1]) {
            if (i === 0 && j === 0) {
                continue;
            }
            const cell1 = [cell[0] + i, cell[1] + j];
            if (cell1[0] < 0 || cell1[1] < 0 || cell1[0] >= dim[0] || cell1[1] >= dim[1]) {
                continue;
            }
            result.push(cell1);
        }
    }
    return result;
}

function toCellNumber(dim, cell) {
    return cell[0] * dim[1] + cell[1];
}

function toCell(dim, num) {
    const c = num % dim[1];
    return [(num - c) / dim[1], c];
}

function generateCompleteBoard(dim, mines) {
    const board = new Array(dim[0]).fill(0).map(() => new Array(dim[1]).fill(0));
    for (let m of mines) {
        const cell = toCell(dim, m);
        const neighbors = getNeighbors(dim, cell);
        //console.log("cell", cell);
        //console.log("Board", board);
        const row = board[cell[0]];
        board[cell[0]][cell[1]] = -1;
        for (let n of neighbors) {

            if(board[n[0]][n[1]] != 1){
                board[n[0]][n[1]]++;
            }           
        }
    }
    return board;
}

function getCellValue(board, cell) {
    return board[cell[0]][cell[1]];
}

function openZeros(board, openedCells, cell) {

    console.log("FIRST Here", cell);

    if (getCellValue(board, cell) != 0) {
        return;
    }
    console.log("Here", cell);
    console.log("Board",board);
    const dim = [board.length, board[0].length];
    const neighbors = getNeighbors(dim, cell);
    for (let n of neighbors) {
        const cellNum = toCellNumber(dim,n);
        if (openedCells.includes(cellNum)) {
            continue;
        }
        openedCells.push(cellNum);
        openZeros(board, openedCells, n);
    }
}

module.exports = new GameService();