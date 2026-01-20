function triangle(row) {
  const n = row.length;
  if (n === 0) return '';

  const mapToNum = { 'R': 0, 'B': 1, 'G': 2 };
  const mapToChar = ['R', 'B', 'G'];

  const small = [
    [1, 0, 0],
    [1, 1, 0], 
    [1, 2, 1] 
  ];

  function binomMod3(nVal, kVal) {
    let res = 1;
    while (nVal > 0 || kVal > 0) {
      const ni = nVal % 3;
      const ki = kVal % 3;
      if (ki > ni) return 0;
      res = (res * small[ni][ki]) % 3;
      nVal = Math.floor(nVal / 3);
      kVal = Math.floor(kVal / 3);
    }
    return res;
  }

  const a = new Array(n);
  for (let i = 0; i < n; i++) a[i] = mapToNum[row[i]];

  const m = n - 1;
  let sum = 0;
  for (let i = 0; i < n; i++) {
    const c = binomMod3(m, i);
    if (c !== 0) sum = (sum + c * a[i]) % 3;
  }

  if (m % 2 === 1) sum = (sum * 2) % 3;

  return mapToChar[sum];
}