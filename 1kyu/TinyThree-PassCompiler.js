function Compiler () {};

Compiler.prototype.compile = function (program) {
  return this.pass3(this.pass2(this.pass1(program)));
};

Compiler.prototype.tokenize = function (program) {
  // Turn a program string into an array of tokens.  Each token
  // is either '[', ']', '(', ')', '+', '-', '*', '/', a variable
  // name or a number (as a string)
  var regex = /\s*([-+*/\(\)\[\]]|[A-Za-z]+|[0-9]+)\s*/g;
  return program.replace(regex, ":$1").substring(1).split(':').map( function (tok) {
    return isNaN(tok) ? tok : tok|0;
  });
};

Compiler.prototype.pass1 = function (program) {
  var tokens = this.tokenize(program);
  var pos = 0;

  function peek() { return tokens[pos]; }
  function next() { return tokens[pos++]; }

  if (next() !== '[') throw new Error("expected [");
  var args = [];
  while (peek() !== ']') {
    args.push(next());
  }
  next(); 

  function argIndex(name) {
    for (var i = 0; i < args.length; i++) if (args[i] === name) return i;
    return -1;
  }

  function parseExpression() {
    var node = parseTerm();
    while (peek() === '+' || peek() === '-') {
      var op = next();
      var right = parseTerm();
      node = { op: op, a: node, b: right };
    }
    return node;
  }

  function parseTerm() {
    var node = parseFactor();
    while (peek() === '*' || peek() === '/') {
      var op = next();
      var right = parseFactor();
      node = { op: op, a: node, b: right };
    }
    return node;
  }

  function parseFactor() {
    var tok = peek();
    if (tok === '(') {
      next(); 
      var node = parseExpression();
      if (next() !== ')') throw new Error("expected )");
      return node;
    } else {
      tok = next();
      if (typeof tok === 'number') {
        return { op: 'imm', n: tok };
      } else {
        var idx = argIndex(tok);
        if (idx >= 0) return { op: 'arg', n: idx };
        return { op: 'imm', n: 0 };
      }
    }
  }

  var ast = parseExpression();
  return ast;
};

Compiler.prototype.pass2 = function (x) {
  if (!x) return x;
  if (x.op === 'imm' || x.op === 'arg') return x;

  x.a = this.pass2(x.a);
  x.b = this.pass2(x.b);

  if (x.a && x.b && x.a.op === 'imm' && x.b.op === 'imm') {
    var a = x.a.n, b = x.b.n, res;
    if (x.op === '+') res = a + b;
    else if (x.op === '-') res = a - b;
    else if (x.op === '*') res = a * b;
    else if (x.op === '/') res = a / b;
    return { op: 'imm', n: res };
  }
  return x;
};

Compiler.prototype.pass3 = function (x) {
  if (x.op === 'imm') {
    return ["IM " + x.n];
  } else if (x.op === 'arg') {
    return ["AR " + x.n];
  } else {
    var codeA = this.pass3(x.a);
    var codeB = this.pass3(x.b);

    var opInstr;
    if (x.op === '+') opInstr = "AD";
    else if (x.op === '-') opInstr = "SU";
    else if (x.op === '*') opInstr = "MU";
    else opInstr = "DI";
    
    return codeA.concat(["PU"]).concat(codeB).concat(["SW", "PO", opInstr]);
  }
};