function validateBattlefield(field) {
  const n = 10;
  const visited = Array.from({ length: n }, () => Array(n).fill(false));
  const ships = [];

  const dirs8 = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],          [0, 1],
    [1, -1],  [1, 0], [1, 1]
  ];

  function inBounds(x, y) {
    return x >= 0 && x < n && y >= 0 && y < n;
  }

  function dfs(x, y) {
    const stack = [[x, y]];
    const cells = [];
    while (stack.length) {
      const [cx, cy] = stack.pop();
      if (!inBounds(cx, cy) || visited[cx][cy] || field[cx][cy] === 0) continue;
      visited[cx][cy] = true;
      cells.push([cx, cy]);
      [[1,0],[-1,0],[0,1],[0,-1]].forEach(([dx, dy]) => {
        const nx = cx + dx, ny = cy + dy;
        if (inBounds(nx, ny) && !visited[nx][ny] && field[nx][ny] === 1) {
          stack.push([nx, ny]);
        }
      });
    }
    return cells;
  }

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (field[i][j] === 1 && !visited[i][j]) {
        const ship = dfs(i, j);

        for (const [x, y] of ship) {
          for (const [dx, dy] of dirs8) {
            const nx = x + dx, ny = y + dy;
            if (inBounds(nx, ny) && field[nx][ny] === 1) {
              const isSameShip = ship.some(([sx, sy]) => sx === nx && sy === ny);
              if (!isSameShip) return false;
            }
          }
        }

        const xs = ship.map(([x]) => x);
        const ys = ship.map(([, y]) => y);
        const allSameX = xs.every(v => v === xs[0]);
        const allSameY = ys.every(v => v === ys[0]);
        if (!(allSameX || allSameY)) return false;

        ships.push(ship.length);
      }
    }
  }

  const counts = {1:0, 2:0, 3:0, 4:0};
  for (const size of ships) {
    if (!(size in counts)) return false;
    counts[size]++;
  }

  return counts[4] === 1 && counts[3] === 2 && counts[2] === 3 && counts[1] === 4;
}