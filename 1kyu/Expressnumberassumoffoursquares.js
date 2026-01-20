const fourSquares = function(n) {
  if (n === 0n) return [0n, 0n, 0n, 0n];
  
  let mul = 1n;
  while ((n & 3n) === 0n) {
    n >>= 2n;
    mul <<= 1n;
  }

  const res = [];
  if ((n & 7n) === 7n) {
    res.push(1n);
    n -= 1n;
  }

  const pow = (b, e, m) => {
    let r = 1n;
    b %= m;
    while (e > 0n) {
      if (e & 1n) r = (r * b) % m;
      b = (b * b) % m;
      e >>= 1n;
    }
    return r;
  };

  const isP = (p) => {
    if (p < 2n) return false;
    if (p === 2n || p === 3n) return true;
    if (!(p & 1n)) return false;
    let d = p - 1n, s = 0n;
    while (!(d & 1n)) { d >>= 1n; s++; }
    const bases = [2n, 3n, 5n, 7n, 11n];
    for (const a of bases) {
      if (p <= a) break;
      let x = pow(a, d, p);
      if (x === 1n || x === p - 1n) continue;
      let c = false;
      for (let r = 0n; r < s - 1n; r++) {
        x = (x * x) % p;
        if (x === p - 1n) { c = true; break; }
      }
      if (!c) return false;
    }
    return true;
  };

  const sqrt = (v) => {
    if (v < 0n) throw "Neg";
    if (v < 2n) return v;
    let x = v, y = (x + v / x) >> 1n;
    while (y < x) { x = y; y = (x + v / x) >> 1n; }
    return x;
  };

  const sum2 = (p) => {
    let z = 2n;
    while (pow(z, (p - 1n) >> 1n, p) !== p - 1n) z++;
    let x = pow(z, (p - 1n) >> 2n, p);
    let b = p, a = x, l = sqrt(p);
    while (a > l) {
      let r = b % a;
      b = a; a = r;
    }
    return [a, sqrt(p - a * a)];
  };

  let a = sqrt(n);
  while (true) {
    let r = n - a * a;
    if (r === 0n) {
      res.push(a);
      break;
    }
    
    // Check if remainder is a perfect square
    let sr = sqrt(r);
    if (sr * sr === r) {
      res.push(a, sr);
      break;
    }

    // Check if remainder is prime p = 1 mod 4
    if ((r & 3n) === 1n && isP(r)) {
      res.push(a, ...sum2(r));
      break;
    }

    // Check if remainder is 2*prime (for n = 3 mod 8 cases)
    if ((r & 7n) === 2n) {
        let h = r >> 1n;
        if (isP(h)) { // h must be 1 mod 4 if r=2 mod 8
            let [u, v] = sum2(h);
            res.push(a, u + v, u > v ? u - v : v - u);
            break;
        }
    }
    a--;
  }

  while (res.length < 4) res.push(0n);
  return res.map(x => x * mul);
};
