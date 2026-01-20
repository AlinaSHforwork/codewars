function alphabetPosition(text) {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz';
    let result = [];

    for (let char of text.toLowerCase()) {
        let index = alphabet.indexOf(char);
        if (index !== -1) {
            result.push(index + 1);
        }
    }

    return result.join(' ');
}