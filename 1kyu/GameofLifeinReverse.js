function findPredecessor(goal) {
  const M = goal.length;
  const N = goal[0].length;
  const H = M + 2; 
  const W = N + 2;

  const grid = [];
  for (let r = 0; r < H; r++) {
    grid.push(new Array(W).fill(0));
  }

  // Safe accessor for the predecessor grid neighbors
  function getVal(r, c) {
    if (r < 0 || r >= H || c < 0 || c >= W) return 0;
    return grid[r][c];
  }

  /**
   * Validates if the cell at PREDECESSOR grid[r][c] evolves to the required state.
   * * @param {number} r - Row index in predecessor
   * @param {number} c - Col index in predecessor
   * @returns {boolean} - True if valid or out of bounds (ignore), False if invalid
   */
  function checkEvolution(r, c) {
    // GUARD: If we are checking a cell outside the predecessor grid, 
    // strictly return true. The "infinite" outer world is implicitly handled 
    // by the boundary conditions of the cells *inside* the grid.
    if (r < 0 || r >= H || c < 0 || c >= W) return true;

    // 1. Calculate Neighbors for cell (r, c)
    // We sum the 8 surrounding cells.
    let neighbors = 0;
    for (let i = r - 1; i <= r + 1; i++) {
      for (let j = c - 1; j <= c + 1; j++) {
        if (i === r && j === c) continue;
        neighbors += getVal(i, j);
      }
    }

    // 2. Determine the Next State based on Conway's Rules
    // grid[r][c] is safe here because of the GUARD above.
    const isAlive = grid[r][c] === 1;
    const nextState = isAlive 
      ? (neighbors === 2 || neighbors === 3 ? 1 : 0) 
      : (neighbors === 3 ? 1 : 0);

    // 3. Determine the Required State
    // The inner M x N block must match the 'goal'.
    // The outer border (rows 0, H-1 and cols 0, W-1) must be 0 (Dead).
    let requiredState = 0;
    
    // Map grid coordinates to goal coordinates
    // grid(1,1) maps to goal(0,0)
    if (r >= 1 && r <= M && c >= 1 && c <= N) {
      requiredState = goal[r - 1][c - 1];
    }
    
    return nextState === requiredState;
  }

  function solve(idx) {
    // Base Case: If we have assigned a value to every cell in the grid
    if (idx === H * W) return true;

    const r = Math.floor(idx / W);
    const c = idx % W;

    // Try both states: 0 (Dead) and 1 (Alive)
    for (const val of [0, 1]) {
      grid[r][c] = val;

      // --- CONSTRAINT PROPAGATION ---
      // We can validate a cell (tr, tc) as soon as its 3x3 neighborhood is fully defined.
      // The last neighbor of (tr, tc) to be filled is (tr+1, tc+1).
      // Therefore, when we fill (r, c), we act as the bottom-right neighbor 
      // completing the neighborhood for (r-1, c-1).

      // 1. Primary Check: Validate the cell to the top-left
      if (!checkEvolution(r - 1, c - 1)) continue;

      // 2. Right Edge Check: 
      // If we are at the last column, the cell (r-1, c) will get no more 
      // neighbors to its right. validate it now.
      if (c === W - 1) {
        if (!checkEvolution(r - 1, c)) continue;
      }

      // 3. Bottom Edge Check:
      // If we are at the last row, the cell (r, c-1) will get no more 
      // neighbors below it. Validate it now.
      if (r === H - 1) {
        if (!checkEvolution(r, c - 1)) continue;
      }

      // 4. Corner Check:
      // If we are at the very last cell, validate it.
      if (r === H - 1 && c === W - 1) {
        if (!checkEvolution(r, c)) continue;
      }

      // Recurse
      if (solve(idx + 1)) return true;
    }

    // Backtrack
    grid[r][c] = 0; 
    return false;
  }

  // Start the backtracking search
  if (solve(0)) {
    return grid;
  } else {
    return null;
  }
}
