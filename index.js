document.addEventListener('DOMContentLoaded', function() {
    const board = document.getElementById('board');
    const boardContainer = document.getElementById('board-container');
    const tiles = document.querySelectorAll('.tile:not([data-modal="true"])');
    const modalClickTiles = document.querySelectorAll('[data-modal="true"]');
    const infoButton = document.getElementById('help-button');
    const MINUTES_TIL_COOKIE_EXPIRES = 5; // for testing
    const DAYS_TIL_COOKIE_EXPIRES = 14;

    let currentTile = document.querySelector('[data-state="empty"]');
    let previousTile = null;

    function resizeBoard() {
        if (boardContainer.offsetHeight >= 420) {
            board.style.height = '420px';
            board.style.width = '350px';
        } else {
            board.style.height = boardContainer.offsetHeight + 'px';
            board.style.width = boardContainer.offsetHeight * 0.84 + 'px';
        }
    }

    // on load, set the board's width and height
    resizeBoard();

    // reset modal to top after hiding
    $('#wordListModal').on('hide.bs.modal', () => {
        console.log('hiding modal');
        $('.modal-body').scrollTop(0);
    });

    function showInstructions() {
        $('#gameHelpModal').modal();
    }

    // if user is visiting for the first time, populate instruction modal
    if (document.cookie == '') {
        showInstructions();
    }
    const d = new Date();
    d.setTime(d.getTime() + DAYS_TIL_COOKIE_EXPIRES*24*60*60*1000);
    const expires = "expires=" + d.toUTCString();
    document.cookie = 'visited=true;' + expires + ';path=/';
    console.log(document.cookie);

    // show instructions when info button is clicked
    infoButton.addEventListener('click', showInstructions);

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

    // consolidate this and the above method if possible
    modalClickTiles.forEach(tile => tile.addEventListener('click', toggleColor));
    modalClickTiles.forEach(tile => tile.addEventListener('animationend', (e) => {
        const letter = e.target.textContent;
        if (e.target.dataset.animation === 'flip-in') {
            switch (e.target.dataset.state) {
                case 'absent':
                    e.target.dataset.state = 'present';
                    break;
                case 'present':
                    e.target.dataset.state = 'correct';
                    break;
                case 'correct':
                    e.target.dataset.state = 'absent';
                    break;
                default:
                    break;
            }
            e.target.dataset.animation = 'flip-out';
        } else {
            e.target.dataset.animation = 'idle';
        }
    }))

    function calculateWordList() {
        if (previousTile) {
            const lastRow = previousTile.parentNode;
            lastRow.dataset.locked = 'true';
            lastRow.dataset.full = 'true';
        }
        if (currentTile) {
            const currentRow = currentTile.parentNode;
            currentRow.dataset.locked = 'false';
        }
        // ISSUE
        // data-full is not true if multiple rows are entered at the same time
        // before the 'show words' button is pressed
        // move to 'enter' button functionality
        const completeWordRows = document.querySelectorAll('[data-full="true"]');

        let completeWords = [];
        completeWordRows.forEach(row => completeWords.push(Array.from(row.children)));
        console.log({completeWords});

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
                // get all the siblings of the current tile
                let siblings = [];
                if (tile.parentNode) {
                    let sibling = tile.parentNode.firstElementChild;
                    while (sibling) {
                        if (sibling !== tile) {
                            siblings.push(sibling);
                        }
                        sibling = sibling.nextElementSibling;
                    }
                }

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
                    if (!masterWord.present.includes(letter)) {
                        masterWord.present.push(letter);
                    }
                    masterWord[index].not.push(letter);
                } else if (tile.dataset.state === 'absent') {
                    if (!masterWord.absent.includes(letter)) {
                        // if a 'present' sibling has the same letter, don't add to absent array
                        const hasPresentSibling = siblings.some(sibling =>
                            sibling.textContent == letter && sibling.dataset.state == 'present');
                        if (!hasPresentSibling) {
                            masterWord.absent.push(letter);
                        }
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
        let wordCount = 0;
        let wordEl;
        newWordList.forEach(word => {
            if (wordCount % 5 == 0) {
                if (wordCount != 0) {
                    modalBody.appendChild(wordEl);
                }
                wordEl = document.createElement('p');
                wordEl.textContent = word;
            } else {
                wordEl.textContent += word;
            }
            // for any word that is not the last word, add a comma
            if (wordCount !== newWordList.length - 1) {
                wordEl.textContent += ", ";
            }
            wordCount++;
        });
        if (wordEl) {
            modalBody.appendChild(wordEl);
        }
        $('#wordListModal').modal();
    }

    document.getElementById('show-words').addEventListener('click', calculateWordList);

    function enterLetter(e) {
        // if the grid is full, only allow backspace to be pressed.
        if (!currentTile && e.code !== 'Backspace' && e.target.dataset.key !== "←") { return; }

        // if using a keyboard, only allow valid letters and backspace to do anything
        const regex = /Key\w/i;
        const backspace = /Backspace/;
        let keyboardKey;
        if (e.type === 'click') {
            key = e.target.dataset.key;
            keyboardKey = e.target;
        } else if (regex.test(e.code) || backspace.test(e.code)){
            key = e.key;
            keyboardKey = document.querySelector(`#keyboard [data-key="${key}"]`);
        } else {
            return;
        }

        if (key === "←" || key === 'Backspace') {
            // if there is no previous tile, backspace should do nothing
            if (previousTile) {
                // if user is on the first tile of a new row, typing backspace will unlock
                // and edit the previous row
                if (previousTile.parentNode.dataset.locked === 'true' &&
                    (!currentTile || currentTile === currentTile.parentNode.firstElementChild)) {
                        previousTile.parentNode.dataset.locked = 'false';
                        previousTile.parentNode.dataset.full = 'false';
                    }

                // if previous row is not locked, delete the previous tile and update keyboard key color
                if (previousTile.parentNode.dataset.locked === 'false') {
                    const keyboardKey = document.querySelector(`#keyboard [data-key="${previousTile.textContent}"]`);
                    previousTile.textContent = '';
                    previousTile.dataset.state = 'empty';
                    keyboardKey.dataset.state = '';
                    updateKeyColor(keyboardKey);
                }
            }
        // for any valid letter key other than backspace:
        } else {
            // only do something if the current row is 'unlocked'
            if (currentTile.parentNode.dataset.locked === "false") {
                currentTile.textContent = key;
                currentTile.dataset.animation = "pop";
                currentTile.dataset.state = 'absent';
                updateKeyColor(keyboardKey);
            }
        }

        // calculate the new previousTile and currentTile
        // const filledTiles = document.querySelectorAll('.tile:not([data-state="empty"])');
        const filledTiles = Array.from(tiles).filter(tile => tile.dataset.state !== 'empty');
        console.log({filledTiles});
        previousTile = filledTiles[filledTiles.length - 1];
        currentTile = document.querySelector('[data-state="empty"]');

        if (previousTile && previousTile === previousTile.parentNode.lastElementChild) {
            previousTile.parentNode.dataset.locked = 'true';
            previousTile.parentNode.dataset.full = 'true';
            if (currentTile) {
                currentTile.parentNode.dataset.locked = 'false';
            }
        }
    }

    const keys = document.querySelectorAll('#keyboard button');
    // stop the enter button from triggering a click event on the keyboard buttons
    keys.forEach(key => key.addEventListener('keydown', function(e) {
        if (e.code === 'Enter') {
            e.preventDefault();
        }
    }));
    keys.forEach(key => key.addEventListener('click', enterLetter));
    document.addEventListener('keyup', enterLetter);

});
