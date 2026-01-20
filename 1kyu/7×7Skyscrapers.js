function solvePuzzle(clues) {
    const N = 7;
    const PERMS = [];
    
    function generatePermutations(arr, m = []) {
        if (arr.length === 0) {
            PERMS.push(m);
        } else {
            for (let i = 0; i < arr.length; i++) {
                let curr = arr.slice();
                let next = curr.splice(i, 1);
                generatePermutations(curr.slice(), m.concat(next));
            }
        }
    }
    generatePermutations([1, 2, 3, 4, 5, 6, 7]);

    function countVisible(row) {
        let max = 0, count = 0;
        for (let i = 0; i < N; i++) {
            if (row[i] > max) {
                max = row[i];
                count++;
            }
        }
        return count;
    }

    const PERMS_DATA = PERMS.map(p => ({
        p: p,
        mask: p.map(v => 1 << (v - 1)),
        left: countVisible(p),
        right: countVisible([...p].reverse())
    }));

    function getPossiblePerms(clueLeft, clueRight) {
        return PERMS_DATA.filter(d => 
            (clueLeft === 0 || d.left === clueLeft) &&
            (clueRight === 0 || d.right === clueRight)
        );
    }

    const rowPerms = [];
    const colPerms = [];

    for (let i = 0; i < N; i++) {
        rowPerms[i] = getPossiblePerms(clues[27 - i], clues[7 + i]);
        colPerms[i] = getPossiblePerms(clues[i], clues[20 - i]);
    }

    let board = Array(N).fill(0).map(() => Array(N).fill(127));

    function solve(currentBoard, rPerms, cPerms) {
        while (true) {
            let changed = false;
            
            for (let r = 0; r < N; r++) {
                let valid = [];
                let newMasks = Array(N).fill(0);
                
                for (let k = 0; k < rPerms[r].length; k++) {
                    let pData = rPerms[r][k];
                    let match = true;
                    for (let c = 0; c < N; c++) {
                        if ((currentBoard[r][c] & pData.mask[c]) === 0) {
                            match = false;
                            break;
                        }
                    }
                    if (match) {
                        valid.push(pData);
                        for (let c = 0; c < N; c++) {
                            newMasks[c] |= pData.mask[c];
                        }
                    }
                }

                if (valid.length === 0) return null;

                if (valid.length < rPerms[r].length) {
                    rPerms[r] = valid;
                    changed = true;
                }

                for (let c = 0; c < N; c++) {
                    if (currentBoard[r][c] !== newMasks[c]) {
                        currentBoard[r][c] = newMasks[c];
                        changed = true;
                    }
                }
            }

            for (let c = 0; c < N; c++) {
                let valid = [];
                let newMasks = Array(N).fill(0);
                
                for (let k = 0; k < cPerms[c].length; k++) {
                    let pData = cPerms[c][k];
                    let match = true;
                    for (let r = 0; r < N; r++) {
                        if ((currentBoard[r][c] & pData.mask[r]) === 0) {
                            match = false;
                            break;
                        }
                    }
                    if (match) {
                        valid.push(pData);
                        for (let r = 0; r < N; r++) {
                            newMasks[r] |= pData.mask[r];
                        }
                    }
                }

                if (valid.length === 0) return null;

                if (valid.length < cPerms[c].length) {
                    cPerms[c] = valid;
                    changed = true;
                }

                for (let r = 0; r < N; r++) {
                    if (currentBoard[r][c] !== newMasks[r]) {
                        currentBoard[r][c] = newMasks[r];
                        changed = true;
                    }
                }
            }

            if (!changed) break;
        }

        let minCandidates = 8;
        let bestR = -1, bestC = -1;

        for (let r = 0; r < N; r++) {
            for (let c = 0; c < N; c++) {
                let val = currentBoard[r][c];
                let bits = 0;
                while (val) {
                    if (val & 1) bits++;
                    val >>= 1;
                }
                if (bits === 0) return null;
                if (bits > 1 && bits < minCandidates) {
                    minCandidates = bits;
                    bestR = r;
                    bestC = c;
                }
            }
        }

        if (bestR === -1) {
            return currentBoard.map(row => row.map(val => Math.log2(val) + 1));
        }

        let candidates = [];
        let mask = currentBoard[bestR][bestC];
        for (let v = 1; v <= N; v++) {
            if (mask & (1 << (v - 1))) candidates.push(1 << (v - 1));
        }

        for (let val of candidates) {
            let nextBoard = currentBoard.map(row => row.slice());
            let nextRPerms = rPerms.slice();
            let nextCPerms = cPerms.slice();
            
            nextBoard[bestR][bestC] = val;
            
            let result = solve(nextBoard, nextRPerms, nextCPerms);
            if (result) return result;
        }

        return null;
    }

    return solve(board, rowPerms, colPerms);
}