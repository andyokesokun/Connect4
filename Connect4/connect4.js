/** Connect Four
 *
 * Player 1 and 2 alternate turns. On each turn, a piece is dropped down a
 * column until a player gets four-in-a-row (horiz, vert, or diag) or until
 * board fills (tie)
 */

const arMindGameCatalog = [
  {
    name: 'Echo Trace',
    skills: 'Working memory, selective attention',
    loop: 'Observe a short path of AR glyphs, then reproduce it after a delay.',
    novelty: 'Path shifts with room geometry and ambient movement.'
  },
  {
    name: 'Phantom Shelf',
    skills: 'Object recall, inhibition control',
    loop: 'Memorize virtual object placements on real shelves, then pick only the target set.',
    novelty: 'Distractor objects mimic user habits and recent gaze behavior.'
  },
  {
    name: 'Pulse Lantern',
    skills: 'Sustained attention, rhythm memory',
    loop: 'Track pulse timing across floating lanterns and tap when hidden pulse aligns.',
    novelty: 'Uses environmental light/noise to alter tempo and challenge.'
  },
  {
    name: 'Mirror Scout',
    skills: 'Spatial memory, task switching',
    loop: 'Follow mirrored directional cues around the room while alternating rule sets.',
    novelty: 'Direction logic inverts based on player movement speed.'
  }
];

function renderCatalog() {
  const host = document.getElementById('catalog-cards');
  host.innerHTML = arMindGameCatalog.map(game => `
    <article class="card">
      <h3>${game.name}</h3>
      <p><strong>Targets:</strong> ${game.skills}</p>
      <p><strong>Core loop:</strong> ${game.loop}</p>
      <p><strong>Differentiator:</strong> ${game.novelty}</p>
    </article>
  `).join('');
}

class EchoTraceGame {
  constructor(size = 3) {
    this.size = size;
    this.sequence = [];
    this.userStep = 0;
    this.grid = document.getElementById('focus-grid');
    this.status = document.getElementById('focus-status');
    this.locked = true;
    this.makeGrid();
  }

  makeGrid() {
    this.grid.innerHTML = '';
    this.grid.style.gridTemplateColumns = `repeat(${this.size}, 72px)`;

    for (let i = 0; i < this.size * this.size; i++) {
      const cell = document.createElement('button');
      cell.className = 'focus-cell';
      cell.type = 'button';
      cell.dataset.index = i;
      cell.addEventListener('click', () => this.handleTap(i));
      this.grid.append(cell);
    }
  }

  async startRound() {
    this.locked = true;
    this.userStep = 0;
    this.sequence.push(this.randomCell());
    this.status.textContent = `Watch ${this.sequence.length} signal${this.sequence.length > 1 ? 's' : ''}...`;
    await this.playSequence();
    this.locked = false;
    this.status.textContent = 'Now repeat the sequence.';
  }

  randomCell() {
    return Math.floor(Math.random() * this.size * this.size);
  }

  async playSequence() {
    for (const index of this.sequence) {
      this.flashCell(index, 420);
      await this.delay(650);
    }
  }

  flashCell(index, ms) {
    const cell = this.grid.children[index];
    cell.classList.add('active');
    setTimeout(() => cell.classList.remove('active'), ms);
  }

  async handleTap(index) {
    if (this.locked) return;

    this.flashCell(index, 180);

    if (index !== this.sequence[this.userStep]) {
      this.status.textContent = `Miss! You reached length ${this.sequence.length}. Tap start to retry.`;
      this.sequence = [];
      this.locked = true;
      return;
    }

    this.userStep += 1;
    if (this.userStep === this.sequence.length) {
      this.status.textContent = 'Nice! Next round loading...';
      this.locked = true;
      await this.delay(700);
      this.startRound();
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

class Game {
  constructor(p1, p2, height = 6, width = 7) {
    this.players = [p1, p2];
    this.height = height;
    this.width = width;
    this.currPlayer = p1;
    this.makeBoard();
    this.makeHtmlBoard();
    this.gameOver = false;
  }

  makeBoard() {
    this.board = [];
    for (let y = 0; y < this.height; y++) {
      this.board.push(Array.from({ length: this.width }));
    }
  }

  makeHtmlBoard() {
    const board = document.getElementById('board');
    board.innerHTML = '';

    const top = document.createElement('tr');
    top.setAttribute('id', 'column-top');

    this.handleGameClick = this.handleClick.bind(this);
    top.addEventListener('click', this.handleGameClick);

    for (let x = 0; x < this.width; x++) {
      const headCell = document.createElement('td');
      headCell.setAttribute('id', x);
      top.append(headCell);
    }

    board.append(top);

    for (let y = 0; y < this.height; y++) {
      const row = document.createElement('tr');

      for (let x = 0; x < this.width; x++) {
        const cell = document.createElement('td');
        cell.setAttribute('id', `${y}-${x}`);
        row.append(cell);
      }

      board.append(row);
    }
  }

  findSpotForCol(x) {
    for (let y = this.height - 1; y >= 0; y--) {
      if (!this.board[y][x]) {
        return y;
      }
    }
    return null;
  }

  placeInTable(y, x) {
    const piece = document.createElement('div');
    piece.classList.add('piece');
    piece.style.backgroundColor = this.currPlayer.color;
    piece.style.top = -50 * (y + 2);

    const spot = document.getElementById(`${y}-${x}`);
    spot.append(piece);
  }

  endGame(msg) {
    alert(msg);
    const top = document.querySelector('#column-top');
    top.removeEventListener('click', this.handleGameClick);
  }

  handleClick(evt) {
    const x = +evt.target.id;

    const y = this.findSpotForCol(x);
    if (y === null) {
      return;
    }

    this.board[y][x] = this.currPlayer;
    this.placeInTable(y, x);

    if (this.board.every(row => row.every(cell => cell))) {
      return this.endGame('Tie!');
    }

    if (this.checkForWin()) {
      this.gameOver = true;
      return this.endGame(`The ${this.currPlayer.color} player won!`);
    }

    this.currPlayer =
      this.currPlayer === this.players[0] ? this.players[1] : this.players[0];
  }

  checkForWin() {
    const _win = cells =>
      cells.every(
        ([y, x]) =>
          y >= 0 &&
          y < this.height &&
          x >= 0 &&
          x < this.width &&
          this.board[y][x] === this.currPlayer
      );

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const horiz = [[y, x], [y, x + 1], [y, x + 2], [y, x + 3]];
        const vert = [[y, x], [y + 1, x], [y + 2, x], [y + 3, x]];
        const diagDR = [[y, x], [y + 1, x + 1], [y + 2, x + 2], [y + 3, x + 3]];
        const diagDL = [[y, x], [y + 1, x - 1], [y + 2, x - 2], [y + 3, x - 3]];

        if (_win(horiz) || _win(vert) || _win(diagDR) || _win(diagDL)) {
          return true;
        }
      }
    }
  }
}

class Player {
  constructor(color) {
    this.color = color;
  }
}

renderCatalog();

const echoTrace = new EchoTraceGame();
document.getElementById('start-focus').addEventListener('click', () => echoTrace.startRound());

document.getElementById('start-game').addEventListener('click', () => {
  const p1 = new Player(document.getElementById('p1-color').value || 'teal');
  const p2 = new Player(document.getElementById('p2-color').value || 'tomato');
  new Game(p1, p2);
});
