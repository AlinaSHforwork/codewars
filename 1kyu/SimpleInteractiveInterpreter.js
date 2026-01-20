function isNumeric(n){
  return !isNaN(parseFloat(n)) && isFinite(n);
}

function Interpreter(){
  this.vars = {};
  this.functions = {};
}

Interpreter.prototype.tokenize = function(program){
  if (program === "") return [];
  var regex = /\s*(=>|[-+*\/\%=\(\)]|[A-Za-z_][A-Za-z0-9_]*|[0-9]*\.?[0-9]+)\s*/g;
  return program.split(regex).filter(function(s){ return !s.match(/^\s*$/); });
};

Interpreter.prototype.input = function(expr){
  var tokens = this.tokenize(expr);
  if (tokens.length === 0) return '';

  var pos = 0;
  var self = this;

  function peek(){ return tokens[pos]; }
  function next(){ return tokens[pos++]; }
  function eof(){ return pos >= tokens.length; }

  if (tokens[0] === 'fn'){
    var sep = tokens.indexOf('=>');
    if (sep === -1) throw "Error";
    if (sep < 2) throw "Error";
    var name = tokens[1];
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) throw "Error";
    if (name in self.vars) throw "Error";
    var args = tokens.slice(2, sep);
    var seen = {};
    for (var i = 0; i < args.length; i++){
      if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(args[i])) throw "Error";
      if (args[i] in seen) throw "Error";
      seen[args[i]] = true;
    }
    var bodyTokens = tokens.slice(sep + 1);
    if (bodyTokens.length === 0) throw "Error";
    for (var i = 0; i < bodyTokens.length; i++){
      var t = bodyTokens[i];
      if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(t)){
        if (!(t in seen) && !(t in self.functions)) throw "Error";
      }
    }
    self.functions[name] = { args: args.slice(), body: bodyTokens.slice() };
    return '';
  }

  function parseExpression(){
    return parseAssignment();
  }

  function parseAssignment(){
    var save = pos;
    if (!eof() && /^[A-Za-z_][A-Za-z0-9_]*$/.test(peek())){
      var id = peek();
      if (tokens[pos+1] === '='){
        next(); next();
        var val = parseAssignment();
        if (id in self.functions) throw "Error";
        self.vars[id] = val;
        return val;
      }
    }
    pos = save;
    return parseAddSub();
  }

  function parseAddSub(){
    var val = parseMulDiv();
    while (!eof() && (peek() === '+' || peek() === '-')){
      var op = next();
      var right = parseMulDiv();
      if (op === '+') val = val + right;
      else val = val - right;
    }
    return val;
  }

  function parseMulDiv(){
    var val = parseFactor();
    while (!eof() && (peek() === '*' || peek() === '/' || peek() === '%')){
      var op = next();
      var right = parseFactor();
      if (op === '*') val = val * right;
      else if (op === '/') val = val / right;
      else val = val % right;
    }
    return val;
  }

  function parseFactor(){
    if (eof()) throw "Error";
    var t = peek();

    if (t === '('){
      next();
      var v = parseExpression();
      if (peek() !== ')') throw "Error";
      next();
      return v;
    }

    if (/^[0-9]*\.?[0-9]+$/.test(t)){
      next();
      return parseFloat(t);
    }

    if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(t)){
      var name = t;
      if (name in self.functions){
        next();
        var fdef = self.functions[name];
        var argVals = [];
        for (var i = 0; i < fdef.args.length; i++){
          if (eof()) throw "Error";
          var v = parseExpression();
          argVals.push(v);
        }
        var child = new Interpreter();
        for (var k in self.functions) if (self.functions.hasOwnProperty(k))
          child.functions[k] = { args: self.functions[k].args.slice(), body: self.functions[k].body.slice() };
        for (var j = 0; j < fdef.args.length; j++){
          child.vars[fdef.args[j]] = argVals[j];
        }
        var bodyExpr = fdef.body.join(' ');
        var result = child.input(bodyExpr);
        if (result === '') throw "Error";
        return result;
      } else {
        next();
        if (!(name in self.vars)) throw "Error";
        return self.vars[name];
      }
    }

    throw "Error";
  }

  var result = parseExpression();
  if (!eof()) throw "Error";
  return result;
};