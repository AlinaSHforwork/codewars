function fleschKincaid(text){
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    const words = text.match(/\b\w+\b/g) || [];
    
    const numSentences = sentences.length;
    const numWords = words.length;
    
    let numSyllables = 0;
    
    words.forEach(word => {
        const syllableMatches = word.toLowerCase().match(/[aeiou]{1,}/g);
        if (syllableMatches) {
            numSyllables += syllableMatches.length;
        }
    });
    
    if (numSentences === 0 || numWords === 0) {
        return 0.00;
    }
    
    const avgWordsPerSentence = numWords / numSentences;
    const avgSyllablesPerWord = numSyllables / numWords;
    
    const gradeLevel = (0.39 * avgWordsPerSentence) + (11.8 * avgSyllablesPerWord) - 15.59;
    
    return parseFloat(gradeLevel.toFixed(2));  
}