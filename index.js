document.addEventListener('DOMContentLoaded', function() {
    const board = document.getElementById('board');
    const boardContainer = document.getElementById('board-container');
    const tiles = document.querySelectorAll('.tile');

    let currentTile = document.querySelector('[data-state="empty"]');
    let previousTile = null;

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
        if (clickedTile.dataset.state === 'empty') {
            return;
        }
        clickedTile.dataset.animation = 'flip-in';
    }

    function updateKeyColor(key) {
        const associatedTiles = Array.from(tiles).filter(tile => tile.textContent == key.textContent);
        if (associatedTiles.length == 0) {
            key.dataset.state = '';
        } else if (associatedTiles.length == 1) {
            key.dataset.state = associatedTiles[0].dataset.state;
        } else {
            // correct letters should take precendence over 'present' letters
            // and present letters should take precendence over 'absent' letters
            let finalState = 'absent';
            associatedTiles.forEach(tile => {
                if (tile.dataset.state == 'correct') {
                    finalState = 'correct';
                }
                if (finalState != 'correct') {
                    if (tile.dataset.state == 'present') {
                        finalState = 'present';
                    }
                    if (finalState != 'present') {
                        if (tile.dataset.state == 'absent') {
                            finalState = 'absent';
                        }
                    }
                }
            });
            key.dataset.state = finalState;
        }
    }

    tiles.forEach(tile => tile.addEventListener('click', toggleColor));
    tiles.forEach(tile => tile.addEventListener('animationend', (e) => {
        const letter = e.target.textContent;
        const keyboardKey = document.querySelector(`#keyboard [data-key="${letter}"]`);
        if (e.target.dataset.animation === 'flip-in') {
            switch (e.target.dataset.state) {
                case 'absent':
                    e.target.dataset.state = 'present';
                    updateKeyColor(keyboardKey);
                    break;
                case 'present':
                    e.target.dataset.state = 'correct';
                    updateKeyColor(keyboardKey);
                    break;
                case 'correct':
                    e.target.dataset.state = 'absent';
                    updateKeyColor(keyboardKey);
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
        const lastRow = previousTile.parentNode;
        lastRow.dataset.locked = 'true';
        lastRow.dataset.full = 'true';
        const currentRow = currentTile.parentNode;
        currentRow.dataset.locked = 'false';

        const completeWordRows = document.querySelectorAll('[data-full="true"]');

        let completeWords = [];
        completeWordRows.forEach(row => completeWords.push(Array.from(row.children)));

        // masterword object
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
                        masterWord.present.splice(masterWord.present.indexOf(letter), 1);
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
        newWordList = completeWordList.filter(word => {
            for (letter in word) {
                // if letter is solved...
                if (masterWord[letter].solved != "") {
                    // ...but is not present at the index of the current word, return false
                    if (word[letter] != masterWord[letter].solved) {
                        // console.log(`${word} removed: index ${letter} should be "${masterWord[letter].solved}"`);
                        return false;
                    }
                // if letter is not solved...
                } else {
                    // if the letter at the current index of word is known to not be at that index of masterWord
                    if (masterWord[letter].not.includes(word[letter])) {
                        // console.log(`${word} removed: index ${letter} should not be "${word[letter]}"`);
                        return false;
                    }
                    // if the letter at the current index of word is known to be absent
                    if (masterWord.absent.includes(word[letter])) {
                        // console.log(`${word} removed: ${word[letter]} should not be in word`);
                        return false;
                    }
                }
            }
            // if a letter should be present but is NOT in the word:
            for (letter in masterWord.present) {
                // if the letter is solved, ignore this index in word
                // when searching for presence
                let checkindex = [];
                for (let i = 0; i < 5; i++) {
                    if (masterWord[i].solved == '') {
                        checkindex.push(i);
                    }
                }
                let present = false;
                for (i in checkindex) {
                    if (word[checkindex[i]] == masterWord.present[letter]) {
                        present = true;
                    }
                }
                // if the letter isn't present at any unsolved space, return false
                if (!present) {
                    // console.log(`${word} removed: ${masterWord.present[letter]} should be present`);
                    return false;
                }
            }
            // console.log(`${word} kept`);
            return true;
        });
        console.log(newWordList);
        // console.log(newWordList.length);
        const modalBody = document.querySelector('.modal-body');
        const modalTitle = document.getElementById('wordListModalTitle');
        modalBody.innerHTML = '';
        modalTitle.textContent = `Available Words (${newWordList.length})`;
        newWordList.forEach(word => {
            const wordEl = document.createElement('p');
            wordEl.textContent = word;
            modalBody.appendChild(wordEl);
        })
        $('#wordListModal').modal();
    }

    function enterLetter(e) {
        const key = e.target.dataset.key;
        const keyboardKey = document.querySelector(`#keyboard [data-key="${key}"]`);
        if (key === "←") {
            if (previousTile) {
                if (previousTile.parentNode.dataset.locked === 'false') {
                    const keyboardKey = document.querySelector(`#keyboard [data-key="${previousTile.textContent}"]`);
                    previousTile.textContent = '';
                    previousTile.dataset.state = 'empty';
                    keyboardKey.dataset.state = '';
                    updateKeyColor(keyboardKey);
                }
            }
        } else if (key === "↵") {
            // only allow enter to react if user has filled entire row
            if (previousTile && previousTile === previousTile.parentNode.lastElementChild) {
                calculateWordList();
            }
        } else {
            if (currentTile.parentNode.dataset.locked === "false") {
                currentTile.textContent = key;
                currentTile.dataset.animation = "pop";
                currentTile.dataset.state = 'absent';
                updateKeyColor(keyboardKey);
            }
        }

        // calculate the new previousTile and currentTile
        const filledTiles = document.querySelectorAll('.tile:not([data-state="empty"])');
        previousTile = filledTiles[filledTiles.length - 1];
        currentTile = document.querySelector('[data-state="empty"]');
    }

    const keys = document.querySelectorAll('#keyboard button');
    keys.forEach(key => key.addEventListener('click', enterLetter));

    // TODO
    // add functionality for typing

    // TODO
    // allow backspace to work to delete previous line if current line is empty.

    // Reading the file

});
