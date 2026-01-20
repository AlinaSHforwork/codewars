function lettersToNumbers(s) {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz'
  let sum = 0
  for (let i = 0 ; i < s.length; i++){
    let char = s[i]
    let lower = char.toLowerCase()
    const pos = alphabet.indexOf(lower) + 1
    if (char === lower){
      sum += pos
    }
    if (char !== lower){
      sum += 2 * pos
    }
    if(!isNaN(char) && char !== ' '){
      sum += Number(char)  
    }
  }
  return sum
}