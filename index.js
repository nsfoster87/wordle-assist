document.addEventListener('DOMContentLoaded', function() {
    const board = document.getElementById('board');
    const boardContainer = document.getElementById('board-container');

    function resizeBoard() {
        if (boardContainer.offsetHeight >= 420) {
            board.style.height = '420px';
            board.style.width = '350px';
        } else {
            board.style.height = boardContainer.offsetHeight + 'px';
            board.style.width = board.offsetHeight * 0.84 + 'px';
        }
    }

    // on load, set the board's width and height
    resizeBoard();

    // on resize, set the board's width and height
    window.addEventListener('resize', resizeBoard);

    function toggleColor(e) {
        const clickedTile = e.target;
        console.log(clickedTile);
        if (clickedTile.dataset.state === 'empty') {
            return;
        }
        clickedTile.dataset.animation = 'flip-in';

    }

    const tiles = document.querySelectorAll('.tile');
    let currentTile = document.querySelector('[data-state="empty"]');
    let previousTile;
    tiles.forEach(tile => tile.addEventListener('click', toggleColor));
    tiles.forEach(tile => tile.addEventListener('animationend', (e) => {
        const letter = e.target.textContent;
        const keyboardKey = document.querySelector(`#keyboard [data-key="${letter}"]`);
        if (e.target.dataset.animation === 'flip-in') {
            switch (e.target.dataset.state) {
                case 'tbd':
                    e.target.dataset.state = 'absent';
                    keyboardKey.dataset.state = 'absent';
                    break;
                case 'absent':
                    e.target.dataset.state = 'present';
                    keyboardKey.dataset.state = 'present';
                    break;
                case 'present':
                    e.target.dataset.state = 'correct';
                    keyboardKey.dataset.state = 'correct';
                    break;
                case 'correct':
                    e.target.dataset.state = 'tbd';
                    keyboardKey.dataset.state = '';
                    break;
                default:
                    break;
            }
            e.target.dataset.animation = 'flip-out';
        } else {
            e.target.dataset.animation = 'idle';
        }
    }));

    function calculateWordList() {
        console.log('enter');

        const lastRow = previousTile.parentNode;
        lastRow.dataset.locked = 'true';
        lastRow.dataset.full = 'true';
        const currentRow = currentTile.parentNode;
        currentRow.dataset.locked = 'false';

        const completeWordRows = document.querySelectorAll('[data-full="true"]');
        console.log(completeWordRows);

        let completeWords = [];
        completeWordRows.forEach(row => completeWords.push(Array.from(row.children)));
        console.log(completeWords);

        // each object in letters is a letter with a status and position in word:
        // {
        //  "j": {
        //          status: correct,
        //          position: 2
        //       },
        //  "l": {
        //          status: absent,
        //       }
        //  "n": {
        //          status: present,
        //          not: [0, 2, 4]
        //       }
        // }
        // needs to be tweaked. May be better to have positions as the objects
        // and then a separate object of presentLetters and the positions they're
        // not in

        // let letters = {};
        // completeWords.forEach(word => {
        //     word.forEach((tile, index) => {
        //         const letter = tile.textContent;
        //         console.log(letter);
        //         // if letter object doesn't exist, create one.
        //         if (!letters[letter]) { letters[letter] = {}; }
        //
        //         // set the status of the letter object to the tile status
        //         letters[letter].status = tile.dataset.state;
        //
        //         // set the position of the letter object if correct
        //         // and if incorrect, add to the 'not' position array
        //         if (letters[letter].status == 'correct') {
        //             letters[letter].position = index;
        //         } else if (letters[letter].status == 'present') {
        //             if (!letters[letter].not) { letters[letter].not = []; }
        //             letters[letter].not.push(index);
        //         }
        //     });
        // });
        // console.log(letters);

        // let masterWord = {};
        // {
        //     0: {
        //         solved: "a",
        //     },
        //     1: {
        //         solved: "p",
        //     },
        //     2: {
        //         not: ["e"],
        //     },
        //     present: ["e", "p"]
        //     absent: ["r", "s", "i", "f"]
        // }
        let masterWord = {
            0: {
                solved: "",
                not: []
            },
            1: {
                solved: "",
                not: []
            },
            2: {
                solved: "",
                not: []
            },
            3: {
                solved: "",
                not: []
            },
            4: {
                solved: "",
                not: []
            },
            present: [],
            absent: []
        };
        completeWords.forEach(word => {
            const wordArray = word.map(tile => tile.textContent);
            console.log(wordArray);

            word.forEach((tile, index) => {
                let doubleLetter = false;
                const letter = tile.textContent;
                if (tile.dataset.state === 'correct') {
                    masterWord[index].solved = letter;

                    // remove from present array IF letter isn't ALSO present separately
                    wordArray.forEach((char, charIndex) => {
                        if (char === letter && charIndex !== index && word[charIndex].dataset.state === 'present') {
                            doubleLetter = true;
                        }
                    });
                    if (!doubleLetter && masterWord.present.includes(letter)) {
                        masterWord.present.splice(indexOf(letter), 1);
                    }
                } else if (tile.dataset.state === 'present') {
                    masterWord.present.push(letter);
                    masterWord[index].not.push(letter);
                } else if (tile.dataset.state === 'absent') {
                    if (!masterWord.absent.includes(letter)) {
                        masterWord.absent.push(letter);
                    }
                }
            })
        });
        console.log(masterWord);

        // const wordTiles = Array.from(lastRow.children);
        // let word = wordTiles.reduce((word, tile) => {
        //     word += tile.textContent;
        //     return word;
        // }, '');
        // console.log(word);

    }

    function enterLetter(e) {
        const key = e.target.dataset.key;
        // needs to be updated to be able to grab from previous row
        // console.log(currentTile);
        // console.log(previousTile);
        if (key === "←") {
            console.log('backspace pressed');
            if (previousTile) {
                if (previousTile.parentNode.dataset.locked === 'false') {
                    const keyboardKey = document.querySelector(`#keyboard [data-key="${previousTile.textContent}"]`);
                    previousTile.textContent = '';
                    previousTile.dataset.state = 'empty';
                    keyboardKey.dataset.state = '';
                }
            }
        } else if (key === "↵") {
            if (previousTile && previousTile === previousTile.parentNode.lastElementChild) {
                calculateWordList();
            }
        } else {
            if (currentTile.parentNode.dataset.locked === "false") {
                currentTile.textContent = key;
                currentTile.dataset.animation = "pop";
                currentTile.dataset.state = 'tbd';
            }
        }
        const filledTiles = document.querySelectorAll('.tile:not([data-state="empty"])');
        previousTile = filledTiles[filledTiles.length - 1];
        currentTile = document.querySelector('[data-state="empty"]');
    }

    const keys = document.querySelectorAll('#keyboard button');
    keys.forEach(key => key.addEventListener('click', enterLetter));
});
