function dblLinear(n) {
  const arr = [1];
  let i1 = 0;
  let i2 = 0;

  while (arr.length <= n) {
    const n1 = arr[i1] * 2 + 1;
    const n2 = arr[i2] * 3 + 1;

    if (n1 < n2) {
      arr.push(n1);
      i1 += 1;
    } else if (n1 === n2) {
      arr.push(n1);
      i1 += 1;
      i2 += 1;
    } else {
      arr.push(n2);
      i2 += 1;
    }
  }

  return arr.pop();
}