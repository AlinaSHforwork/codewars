function validateRace(moves) {
  const n = moves.length
  const seen = new Array(n + 1).fill(false); 
  let res = 0
  
  for(let i = 1; i <= moves.length; i++){
    res = i + moves[i - 1];
    if (res < 1 || res > n) return false;
    if (seen[res]) return false;
    seen[res] = true;
  }
  return true
}
