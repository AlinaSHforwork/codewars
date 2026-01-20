def solve(clues):
    # Clues format: (column_clues, row_clues)
    col_clues, row_clues = clues
    n_rows = len(row_clues)
    n_cols = len(col_clues)

    # --- 1. Helper to generate all valid permutations for a single line ---
    def get_permutations(length, line_clues):
        # Memoization cache could be added here, but usually not needed for 15x15
        results = []
        
        def backtrack(index, clue_idx, current_line):
            # Base case: All clues placed
            if clue_idx == len(line_clues):
                # Fill remainder with 0s
                results.append(current_line + [0] * (length - index))
                return

            # Recursive step
            block_len = line_clues[clue_idx]
            
            # Identify bounds for placing this block
            # Minimum space needed for remaining blocks + gaps
            remaining_blocks = line_clues[clue_idx+1:]
            min_remaining_space = sum(remaining_blocks) + len(remaining_blocks)
            
            # The range of valid start positions for the current block
            # We must leave enough room at the end for the remaining clues
            max_start = length - min_remaining_space - block_len
            
            for start in range(index, max_start + 1):
                # Create the segment: 0s (gap) + 1s (block) + 0 (mandatory separator if not last)
                # Note: The mandatory separator 0 is handled by the next recursive call's index
                
                # Gap size = start - index
                gap = [0] * (start - index)
                block = [1] * block_len
                
                # Logic to add mandatory separator 0 after block if not the last block
                next_index = start + block_len
                if clue_idx < len(line_clues) - 1:
                    # Must have at least one 0 after this block
                    # We append it now effectively or force the next loop to start +1
                    if next_index < length:
                        backtrack(next_index + 1, clue_idx + 1, current_line + gap + block + [0])
                else:
                    # Last block
                    backtrack(next_index, clue_idx + 1, current_line + gap + block)

        backtrack(0, 0, [])
        return results

    # Pre-calculate all possibilities for every row and column based *only* on clues
    # Format: rows_possibilities[i] is a list of all valid arrays (e.g. [0,1,1,0...]) for row i
    rows_possibilities = [get_permutations(n_cols, c) for c in row_clues]
    cols_possibilities = [get_permutations(n_rows, c) for c in col_clues]

    # --- 2. The Solver (Propagation + Backtracking) ---
    def search(r_poss, c_poss):
        
        # Keep iterating until no changes occur (Constraint Propagation)
        while True:
            changed = False
            
            # --- PROCESS ROWS ---
            # For each row, find the common cells (intersection) in all remaining possibilities
            # If a row has only 1 possibility, that IS the row.
            # If a row has valid options [0, 1, 0] and [0, 1, 1], we know index 0 is 0 and index 1 is 1.
            
            # We compute the 'known' state of the grid from rows to filter columns
            row_knowns = [] 
            
            for r in range(n_rows):
                possible_rows = r_poss[r]
                if not possible_rows: return None # Contradiction: No valid moves left
                
                # Optimization: If only 1 option, we know it exactly
                if len(possible_rows) == 1:
                    row_knowns.append(possible_rows[0])
                    continue

                # Find intersection
                # Zip all possibilities for this row: [(0,0), (1,1), (0,1)] -> column tuples
                # If all elements in a tuple are same, that cell is known.
                common = []
                for i in range(n_cols):
                    val = possible_rows[0][i]
                    if all(p[i] == val for p in possible_rows):
                        common.append(val)
                    else:
                        common.append(-1) # Unknown
                row_knowns.append(common)

            # --- PROCESS COLUMNS ---
            # Filter column possibilities based on what we learned from rows
            for c in range(n_cols):
                current_opts = c_poss[c]
                new_opts = []
                for opt in current_opts:
                    # Check if this column option matches all known row cells at this column index
                    valid = True
                    for r in range(n_rows):
                        known_val = row_knowns[r][c] # What rows say this cell must be
                        if known_val != -1 and known_val != opt[r]:
                            valid = False
                            break
                    if valid:
                        new_opts.append(opt)
                
                if len(new_opts) < len(current_opts):
                    c_poss[c] = new_opts
                    changed = True
                if not new_opts: return None # Contradiction

            # Check if solved (all rows have exactly 1 option)
            if all(len(p) == 1 for p in r_poss):
                # Return the grid tuple
                return tuple(tuple(p[0]) for p in r_poss)

            # --- PROCESS COLUMNS (Reverse) ---
            # Now do the same: calculate knowns from columns to filter rows
            col_knowns = []
            for c in range(n_cols):
                possible_cols = c_poss[c]
                if len(possible_cols) == 1:
                    col_knowns.append(possible_cols[0])
                    continue
                
                common = []
                for i in range(n_rows):
                    val = possible_cols[0][i]
                    if all(p[i] == val for p in possible_cols):
                        common.append(val)
                    else:
                        common.append(-1)
                col_knowns.append(common)
            
            # Filter Row possibilities based on known column cells
            for r in range(n_rows):
                current_opts = r_poss[r]
                new_opts = []
                for opt in current_opts:
                    valid = True
                    for c in range(n_cols):
                        known_val = col_knowns[c][r]
                        if known_val != -1 and known_val != opt[c]:
                            valid = False
                            break
                    if valid:
                        new_opts.append(opt)
                
                if len(new_opts) < len(current_opts):
                    r_poss[r] = new_opts
                    changed = True
                if not new_opts: return None

            if not changed:
                break
        
        # --- 3. Guessing (Backtracking) ---
        # If we are here, propagation stalled but puzzle isn't solved.
        # Find the row with the fewest possibilities (> 1) to minimize branching factor.
        min_len = float('inf')
        best_r = -1
        
        for r in range(n_rows):
            l = len(r_poss[r])
            if 1 < l < min_len:
                min_len = l
                best_r = r
        
        if best_r == -1: return None # Should not happen if logic is correct
        
        # Try each possibility for this row
        for hypothesis in r_poss[best_r]:
            # Create deep copies of possibilities to pass to recursive step
            new_r_poss = list(r_poss)
            new_c_poss = list(c_poss)
            
            # Force the hypothesis
            new_r_poss[best_r] = [hypothesis]
            
            result = search(new_r_poss, new_c_poss)
            if result is not None:
                return result
                
        return None

    return search(rows_possibilities, cols_possibilities)