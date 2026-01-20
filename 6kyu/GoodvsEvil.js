function goodVsEvil(good, evil){
    const goodUnits = [1, 2, 3, 3, 4, 10];
    const evilUnits = [1, 2, 2, 2, 3, 5, 10];

    const goodCounts = good.split(' ').map(Number);
    const evilCounts = evil.split(' ').map(Number);
    
    function calculateTotal(units, counts) {
        let total = 0;
        for (let i = 0; i < counts.length; i++) {
            total += units[i] * counts[i];
        }
        return total;
    }
    const goodTotal = calculateTotal(goodUnits, goodCounts);
    const evilTotal = calculateTotal(evilUnits, evilCounts);
    if (goodTotal > evilTotal) {
        return 'Battle Result: Good triumphs over Evil';
    } else if (evilTotal > goodTotal) {
        return 'Battle Result: Evil eradicates all trace of Good';
    } else {
        return 'Battle Result: No victor on this battle field';
    }

}