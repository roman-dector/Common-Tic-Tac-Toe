const CryptoJS = require("crypto-js");
const secureRandom = require("secure-random");
const rl = require("readline-sync");
const math = require("mathjs");

class HelpTable {
    constructor(gameMoves) {
        this.gameMoves = gameMoves;
        this.n = (gameMoves.length - 1) / 2;
    }

    #splitOpponents(move) {
        let moveIndex = this.gameMoves.indexOf(move), sortedMoves = [];
        this.gameMoves.map((obj, ind) => {
            if (ind < moveIndex) {sortedMoves.push(obj)}});
        sortedMoves.unshift(...this.gameMoves.slice(moveIndex+1,))
        let winningMoves = sortedMoves.slice(0,this.n), losingMoves = sortedMoves.slice(-this.n,);

        return {"losingMoves": losingMoves, "winningMoves": winningMoves};
    }

    getMoveStatus(move1, move2) {
        let opponents = this.#splitOpponents(move1);
        let losingMoves = opponents["losingMoves"], winningMoves = opponents["winningMoves"];
        if (move1 == move2)
            return "Draw"
        else if (losingMoves.includes(move2))
            return "Win"
        else
            return "Lose"
    }

    #makeTable() {
        let table = {}, gameMoves = this.gameMoves
        gameMoves.forEach(move => {table[move] = {}});

        gameMoves.forEach(move1 => {
            gameMoves.forEach(move2 => {
                table[move1][move2] = this.getMoveStatus(move1, move2);
            })
        })

        return table
    }

    printTable() {
        return console.table(this.#makeTable())
    }
};


class HashKey {
    constructor() {
        this.hashKey = secureRandom.randomBuffer(64).toString("hex")
    }
};


class HashedMove extends HashKey {
    constructor(move) {
        super();
        this.move = move,
        this.hashedMove = CryptoJS.HmacSHA256(move,this.hashKey).toString();
    }
};


class WinRule extends HelpTable {
    constructor(playerMove, computerMove, gameMoves) {
        super(gameMoves);
        this.move1 = playerMove;
        this.move2 = computerMove;
    }

    printRoundResult() {
        console.log(
`Your move: ${this.move1}\n
Computer move: ${this.move2}\n
${this.getMoveStatus(this.move1, this.move2) != "Draw" ? 
"You " + this.getMoveStatus(this.move1, this.move2) : "Draw"}!\n`
        );
    }
};


function checkArgs(gameMoves) {
    let lengthOfArgs = gameMoves.length;

    if (lengthOfArgs % 2 == 0)
        return [false, "\x1b[31mYou should provide an odd number of arguments.\x1b[0m"]
    else if (lengthOfArgs < 3)
        return [false, "\x1b[31mYou should provide an number of arguments is greater than or equal to 3.\x1b[0m"]
    else if (lengthOfArgs != new Set(gameMoves).size)
        return [false, "\x1b[31mArguments mustn't repeat.\x1b[0m"]

    else return [true, ""]
};


function getPlayerMove(gameMoves) {
    console.log("Available moves:")
    gameMoves.map((obj, ind) => console.log(`${ind+1} - ${obj}`))
    return rl.question(`0 - exit\n? - help\nEnter your move: `);
};


function handlePlayerMove(helpTable, hashedMove) {
    let playerMoveIndex = getPlayerMove(helpTable.gameMoves);

    switch (playerMoveIndex) {
        case "0":
            return;
        case "?":
            helpTable.printTable();
            handlePlayerMove(helpTable, hashedMove)
            break;
        default:
            if (!math.hasNumericValue(playerMoveIndex) || parseInt(playerMoveIndex) > helpTable.gameMoves.length)
                return handlePlayerMove(helpTable, hashedMove);

            let playerMove = helpTable.gameMoves[playerMoveIndex];
            let winRule = new WinRule(playerMove, hashedMove.move, helpTable.gameMoves);
            winRule.printRoundResult();
            console.log("HMAC key:\n" + hashedMove.hashKey + "\n");

            if (winRule.getMoveStatus(playerMove, hashedMove.move) == "Draw")
                makeOneRound(helpTable);
    }
};


function makeOneRound(helpTable) {
    let computerMove = helpTable.gameMoves[Math.floor(Math.random() * 5)];
    let hashedMove = new HashedMove(computerMove);

    console.log("HMAC:\n" + hashedMove.hashedMove);

    handlePlayerMove(helpTable, hashedMove);
};


function startGame() {
    let gameMoves = process.argv.slice(2);
    let argStatus = checkArgs(gameMoves);

    if (!argStatus[0])
        return console.log("\x1b[31mSorry.\x1b[0m " + argStatus[1] + "\n\x1b[33mFor example:\x1b[0m rock paper lizard Spock scissors\n");

    makeOneRound(new HelpTable(gameMoves));
};


startGame();

//var arr = process.argv.slice(2);
//console.log(new HelpTable(arr).printTable());

