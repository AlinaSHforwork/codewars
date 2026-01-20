function threeDots(gameMap) {
  const rows = gameMap.split('\n')
  const H = rows.length
  const W = rows[0].length
  const len = H * W
  const walls = new Uint8Array(len)
  const starts = [0, 0, 0]
  const targets = [0, 0, 0]
  const tCoords = [0, 0, 0, 0, 0, 0]

  for (let r = 0; r < H; r++) {
    for (let c = 0; c < W; c++) {
      const char = rows[r][c]
      const idx = r * W + c
      if (char === 'R') starts[0] = idx
      else if (char === 'G') starts[1] = idx
      else if (char === 'Y') starts[2] = idx
      else if (char === 'r') { targets[0] = idx; tCoords[0] = r; tCoords[1] = c; }
      else if (char === 'g') { targets[1] = idx; tCoords[2] = r; tCoords[3] = c; }
      else if (char === 'y') { targets[2] = idx; tCoords[4] = r; tCoords[5] = c; }
      
      if ('*+|-'.includes(char)) walls[idx] = 1
    }
  }

  const getH = (p0, p1, p2) => {
    return (
      Math.abs(((p0 / W) | 0) - tCoords[0]) + Math.abs((p0 % W) - tCoords[1]) +
      Math.abs(((p1 / W) | 0) - tCoords[2]) + Math.abs((p1 % W) - tCoords[3]) +
      Math.abs(((p2 / W) | 0) - tCoords[4]) + Math.abs((p2 % W) - tCoords[5])
    )
  }

  const pq = []
  const push = (item) => {
    pq.push(item)
    let i = pq.length - 1
    while (i > 0) {
      const p = (i - 1) >>> 1
      if (pq[p].f <= pq[i].f) break
      const t = pq[i]; pq[i] = pq[p]; pq[p] = t;
      i = p
    }
  }
  const pop = () => {
    if (pq.length === 0) return null
    const res = pq[0]
    const last = pq.pop()
    if (pq.length > 0) {
      pq[0] = last
      let i = 0, l = pq.length
      while (true) {
        let left = (i << 1) + 1, right = left + 1, swap = null
        if (left < l && pq[left].f < pq[i].f) swap = left
        if (right < l && pq[right].f < (swap === null ? pq[i].f : pq[left].f)) swap = right
        if (swap === null) break
        const t = pq[i]; pq[i] = pq[swap]; pq[swap] = t;
        i = swap
      }
    }
    return res
  }

  const startH = getH(starts[0], starts[1], starts[2])
  push({ p: starts, path: '', g: 0, f: startH })
  
  const visited = new Set()
  visited.add(starts.join(','))

  const offsets = [-W, W, -1, 1]
  const arrows = ['↑', '↓', '←', '→']

  while (pq.length > 0) {
    const { p, path, g } = pop()

    if (p[0] === targets[0] && p[1] === targets[1] && p[2] === targets[2]) return path

    for (let i = 0; i < 4; i++) {
      const off = offsets[i]
      const nextP = [p[0], p[1], p[2]]
      let changed = false

      for (let j = 0; j < 3; j++) {
        const curr = p[j]
        const next = curr + off
        
        if (i >= 2) { 
           if (((curr / W) | 0) !== ((next / W) | 0)) continue 
        }
        
        if (next >= 0 && next < len && !walls[next]) {
          nextP[j] = next
          if (next !== curr) changed = true
        }
      }

      if (!changed) continue

      const key = nextP[0] + ',' + nextP[1] + ',' + nextP[2]
      if (!visited.has(key)) {
        visited.add(key)
        const newG = g + 1
        push({ p: nextP, path: path + arrows[i], g: newG, f: newG + getH(nextP[0], nextP[1], nextP[2]) })
      }
    }
  }
  return ''
}