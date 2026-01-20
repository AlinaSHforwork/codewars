function mostMoney(students) {
    let maxAmount = -1;
    let richestStudent = "";
    let allSame = false;
    let firstAmount = null;
  
    for (let student of students) {
        let total = (student.fives * 5) + (student.tens * 10) + (student.twenties * 20);

        if (firstAmount === null) {
            firstAmount = total;
        } else if (total !== firstAmount) {
            allSame = false;
        }

        if (total > maxAmount) {
            maxAmount = total;
            richestStudent = student.name;
            allSame = false;
        } else if (total === maxAmount) {
            allSame = true;
        }
    }

    return allSame ? "all" : richestStudent;
}