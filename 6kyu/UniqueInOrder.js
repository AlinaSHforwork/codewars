var uniqueInOrder=function(iterable){
  //your code here - remember iterable can be a string or an array
    let result = [];
    let prev = null;
    for (let item of iterable) {
        if (item !== prev) {
            result.push(item);
            prev = item;
        }
    }
    return result;
}
