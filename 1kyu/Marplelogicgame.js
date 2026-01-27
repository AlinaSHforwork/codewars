function solve(clues) {
  const possibilities = new Int32Array(20).fill(31);
  const toId = c => c.charCodeAt(0) - 65;
  const toRow = id => Math.floor(id / 5);
  const parsedClues = clues.map(clue => {
    const s1 = clue[0], s2 = clue[1], s3 = clue[2];
    
    // Type: Same Column "A^B"
    if (s2 === '^') return { type: 'SAME', a: toId(s1), b: toId(s3) };
    
    // Type: Left Of "A<B"
    if (s2 === '<') return { type: 'LEFT', a: toId(s1), b: toId(s3) };
    
    // Type: Next To "ABA" (s1 == s3)
    if (s1 === s3) return { type: 'NEXT', a: toId(s1), b: toId(s2) };
    
    // Type: Between "ABC"
    return { type: 'BETWEEN', a: toId(s1), b: toId(s2), c: toId(s3) };
  });
  
  let changed = true;
  while (changed) {
    changed = false;
    // --- A. APPLY CLUE CONSTRAINTS ---
    for (const rule of parsedClues) {
      const { type, a, b, c } = rule;
      const maskA = possibilities[a];
      const maskB = possibilities[b];
      
      let newMaskA = 0, newMaskB = 0, newMaskC = 0;

      if (type === 'SAME') {
        const intersection = maskA & maskB;
        if (maskA !== intersection) { possibilities[a] = intersection; changed = true; }
        if (maskB !== intersection) { possibilities[b] = intersection; changed = true; }
      } 
      else if (type === 'LEFT') { // A < B
        // Filter A: Can only keep col 'i' if B has a col 'j' > 'i'
        for (let i = 0; i < 5; i++) {
          if ((maskA >> i) & 1) {
            // Check if B has any bit > i
            if (maskB & ~((1 << (i + 1)) - 1)) newMaskA |= (1 << i);
          }
        }
        // Filter B: Can only keep col 'j' if A has a col 'i' < 'j'
        for (let j = 0; j < 5; j++) {
          if ((maskB >> j) & 1) {
            // Check if A has any bit < j
            if (maskA & ((1 << j) - 1)) newMaskB |= (1 << j);
          }
        }
        if (possibilities[a] !== newMaskA) { possibilities[a] = newMaskA; changed = true; }
        if (possibilities[b] !== newMaskB) { possibilities[b] = newMaskB; changed = true; }
      }
      else if (type === 'NEXT') { // |colA - colB| == 1
        // Filter A: Keep 'i' if B has 'i-1' or 'i+1'
        for (let i = 0; i < 5; i++) {
          if ((maskA >> i) & 1) {
            if (((maskB >> (i - 1)) & 1) || ((maskB >> (i + 1)) & 1)) newMaskA |= (1 << i);
          }
        }
        // Filter B
        for (let i = 0; i < 5; i++) {
          if ((maskB >> i) & 1) {
            if (((maskA >> (i - 1)) & 1) || ((maskA >> (i + 1)) & 1)) newMaskB |= (1 << i);
          }
        }
        if (possibilities[a] !== newMaskA) { possibilities[a] = newMaskA; changed = true; }
        if (possibilities[b] !== newMaskB) { possibilities[b] = newMaskB; changed = true; }
      }
      else if (type === 'BETWEEN') { // A..B..C or C..B..A
        const maskC = possibilities[c];
        
        // We verify every combination of valid columns for A, B, C
        // and build up the allowed masks based on valid triplets.
        for (let colB = 1; colB < 4; colB++) { // B can't be 0 or 4
          if (!((maskB >> colB) & 1)) continue;
          
          let validB = false;
          
          for (let colA = 0; colA < 5; colA++) {
             if (!((maskA >> colA) & 1)) continue;
             if (colA === colB) continue;

             for (let colC = 0; colC < 5; colC++) {
                if (!((maskC >> colC) & 1)) continue;
                if (colC === colB || colC === colA) continue;
                
                // Check Between Logic
                if ((colA < colB && colB < colC) || (colC < colB && colB < colA)) {
                   validB = true;
                   newMaskA |= (1 << colA);
                   newMaskC |= (1 << colC);
                }
             }
          }
          if (validB) newMaskB |= (1 << colB);
        }
        
        if (possibilities[a] !== newMaskA) { possibilities[a] = newMaskA; changed = true; }
        if (possibilities[b] !== newMaskB) { possibilities[b] = newMaskB; changed = true; }
        if (possibilities[c] !== newMaskC) { possibilities[c] = newMaskC; changed = true; }
      }
    }

    // --- B. APPLY ROW CONSTRAINTS (Sudoku Rules) ---
    // Rule 1: Fixed cells eliminate options for others in same row
    // Rule 2: If a column is only possible for one letter in a row, it must be that letter
    for (let r = 0; r < 4; r++) {
      const rowStart = r * 5;
      const rowEnd = rowStart + 5;
      
      // 1. Find columns already taken (mask has exactly 1 bit set)
      let takenMask = 0;
      for (let i = rowStart; i < rowEnd; i++) {
        // checks if power of 2 (only 1 bit set)
        if ((possibilities[i] & (possibilities[i] - 1)) === 0) {
          takenMask |= possibilities[i];
        }
      }
      
      // Remove taken columns from neighbors
      for (let i = rowStart; i < rowEnd; i++) {
        // If this cell is not yet fixed
        if ((possibilities[i] & (possibilities[i] - 1)) !== 0) {
           const old = possibilities[i];
           possibilities[i] &= ~takenMask;
           if (possibilities[i] !== old) changed = true;
        }
      }

      // 2. Hidden Singles (Column uniqueness within row)
      for (let col = 0; col < 5; col++) {
        let count = 0;
        let lastSeenOwner = -1;
        const colBit = 1 << col;
        
        for (let i = rowStart; i < rowEnd; i++) {
          if ((possibilities[i] & colBit) !== 0) {
            count++;
            lastSeenOwner = i;
          }
        }
        
        if (count === 1) {
          if (possibilities[lastSeenOwner] !== colBit) {
            possibilities[lastSeenOwner] = colBit;
            changed = true;
          }
        }
      }
    }
  }

  // CONSTRUCT SOLUTION STRING
  // Grid is 4x5. We fill a 20-char array by position.
  const grid = new Array(20);
  for (let i = 0; i < 20; i++) {
    // Find the column index from the bitmask (should be power of 2 now)
    const col = Math.log2(possibilities[i]);
    const row = toRow(i);
    const pos = row * 5 + col;
    grid[pos] = String.fromCharCode(i + 65);
  }
  return grid.join('');
}
