function isIsogram(str){
  str = str.toLowerCase()
  const counters = {}
  let bool = true
  for (let i = 0; i < str.length; i++){
    if (counters[str[i]] === undefined){
      counters[str[i]] = 0 
    }
    counters[str[i]] += 1
  }
  
  for (const key in counters){    
      if (counters[key] > 1){
        bool = false
      }
  }
  return bool
}