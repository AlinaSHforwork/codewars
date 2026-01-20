function makeOp(opName) {
  return function (account, amount) {
    var op = account[opName];
    if (typeof op !== 'function') {
      throw new TypeError(opName + ' is not a function on the given account');
    }
    var boundOp = op.bind(account);
    return this.gateway.doOperation(amount, boundOp);
  }
}

function OnlineBank() {
  this.gateway = new Gateway();
}

OnlineBank.prototype.deposit = makeOp('deposit');
