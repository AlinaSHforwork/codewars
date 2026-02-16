function linkUp(gamemap){
  let grid = gamemap.trim().split('\n').map(r => r.trim().split(/\s+/));
  const H = 8, W = 8;
  
  // Map all card positions
  let pieces = {};
  for(let r=0; r<H; r++) {
    for(let c=0; c<W; c++) {
      let k = grid[r][c];
      if(!pieces[k]) pieces[k] = [];
      pieces[k].push({r,c});
    }
  }

  //Check if cell is empty
  const isE = (r, c) => {
    if (r < 0 || r >= H || c < 0 || c >= W) return true;
    return grid[r][c] === null;
  };

  //Check if a straight line between two points is clear
  const line = (r1, c1, r2, c2) => {
    if (r1 === r2) {
      let min = Math.min(c1, c2), max = Math.max(c1, c2);
      for (let k = min + 1; k < max; k++) if (!isE(r1, k)) return false;
      return true;
    }
    if (c1 === c2) {
      let min = Math.min(r1, r2), max = Math.max(r1, r2);
      for (let k = min + 1; k < max; k++) if (!isE(k, c1)) return false;
      return true;
    }
    return false;
  };

  //Check if two points can be connected
  const check = (r1, c1, r2, c2) => {
    // 0 Turns (Straight line)
    if ((r1===r2 || c1===c2) && line(r1,c1,r2,c2)) return true;
    
    // 1 Turn (L-shape)
    // Corner 1: (r1, c2)
    if (isE(r1,c2) && line(r1,c1,r1,c2) && line(r2,c2,r1,c2)) return true;
    // Corner 2: (r2, c1)
    if (isE(r2,c1) && line(r1,c1,r2,c1) && line(r2,c2,r2,c1)) return true;
    
    // 2 Turns (Z-shape or U-shape)
    // Scan horizontal lines (including virtual borders -1 and W)
    for (let c = -1; c <= W; c++) {
      // Path: (r1,c1) -> (r1,c) -> (r2,c) -> (r2,c2)
      // The two corners (r1,c) and (r2,c) must be empty.
      if (isE(r1,c) && isE(r2,c) && line(r1,c1,r1,c) && line(r1,c,r2,c) && line(r2,c2,r2,c)) return true;
    }
    // Scan vertical lines (including virtual borders -1 and H)
    for (let r = -1; r <= H; r++) {
      // Path: (r1,c1) -> (r,c1) -> (r,c2) -> (r2,c2)
      if (isE(r,c1) && isE(r,c2) && line(r1,c1,r,c1) && line(r,c1,r,c2) && line(r,c2,r2,c2)) return true;
    }
    return false;
  };

  // Backtracking Solver
  const solve = (moves) => {
    if(moves.length === 32) return moves;
    
    let candidates = [];
    
    // Find all currently valid pairs
    for (let k in pieces) {
      let ps = pieces[k].filter(p => grid[p.r][p.c] !== null);
      for (let i = 0; i < ps.length; i++) {
        for (let j = i + 1; j < ps.length; j++) {
          let p1 = ps[i], p2 = ps[j];
          if (check(p1.r, p1.c, p2.r, p2.c)) {
            candidates.push({
              p1, p2, k,
              d: Math.abs(p1.r - p2.r) + Math.abs(p1.c - p2.c)
            });
          }
        }
      }
    }

    if (candidates.length === 0) return null; 

    // Sort by distance ascending
    candidates.sort((a, b) => a.d - b.d);

    for (let cand of candidates) {
      // Apply Move
      grid[cand.p1.r][cand.p1.c] = null;
      grid[cand.p2.r][cand.p2.c] = null;
      
      let res = solve([...moves, [[cand.p1.r, cand.p1.c], [cand.p2.r, cand.p2.c]]]);
      if (res) return res;
      
      // Backtrack
      grid[cand.p1.r][cand.p1.c] = cand.k;
      grid[cand.p2.r][cand.p2.c] = cand.k;
    }
    
    return null;
  };

  return solve([]);
}
