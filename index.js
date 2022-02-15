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
        if (e.target.dataset.animation === 'flip-in') {
            switch (e.target.dataset.state) {
                case 'tbd':
                    e.target.dataset.state = 'absent';
                    break;
                case 'absent':
                    e.target.dataset.state = 'present';
                    break;
                case 'present':
                    e.target.dataset.state = 'correct';
                    break;
                case 'correct':
                    e.target.dataset.state = 'tbd';
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
    }

    function enterLetter(e) {
        const key = e.target.dataset.key;
        // needs to be updated to be able to grab from previous row
        console.log(currentTile);
        console.log(previousTile);
        if (key === "←") {
            console.log('backspace pressed');
            if (previousTile) {
                previousTile.textContent = '';
                previousTile.dataset.state = 'empty';
            }
        } else if (key === "↵") {
            calculateWordList();
        } else {
            currentTile.textContent = key;
            currentTile.dataset.animation = "pop";
            currentTile.dataset.state = 'tbd';
        }
        const filledTiles = document.querySelectorAll('.tile:not([data-state="empty"])');
        previousTile = filledTiles[filledTiles.length - 1];
        currentTile = document.querySelector('[data-state="empty"]');
    }

    const keys = document.querySelectorAll('#keyboard button');
    keys.forEach(key => key.addEventListener('click', enterLetter));
});
