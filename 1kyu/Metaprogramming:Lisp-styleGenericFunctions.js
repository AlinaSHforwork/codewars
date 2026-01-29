// Global stack to manage method invocation state for callNextMethod
var _genericStack = [];

function callNextMethod(context, ...args) {
  var state = _genericStack[_genericStack.length - 1];
  
  if (!state) {
    throw new Error("callNextMethod called outside of a generic function");
  }

  // Handle 'around' methods
  if (state.phase === 'around') {
    state.aroundIndex++;
    if (state.aroundIndex < state.aroundMethods.length) {
      return state.aroundMethods[state.aroundIndex].fn.apply(context, args);
    } else {
      // End of 'around' chain.
      // Must have 'primary' methods to continue, otherwise we fail HERE (in 'around').
      if (state.primaryMethods.length === 0) {
        throw "No next method found for " + state.name + " in around";
      }
      
      // Switch to Core (Before -> Primary -> After)
      state.phase = 'primary'; 
      return executeCore(state, context, args);
    }
  } 
  // Handle 'primary' methods
  else if (state.phase === 'primary') {
    state.primaryIndex++;
    if (state.primaryIndex < state.primaryMethods.length) {
      return state.primaryMethods[state.primaryIndex].fn.apply(context, args);
    } else {
      throw "No next method found for " + state.name + " in primary";
    }
  } else {
     throw "No next method found for " + state.name + " in " + state.phase;
  }
}

function executeCore(state, context, args) {
  // 1. Run all 'before' methods (most specific to least specific)
  for (var i = 0; i < state.beforeMethods.length; i++) {
    state.beforeMethods[i].fn.apply(context, args);
  }

  // 2. Run the 'primary' chain via callNextMethod recursion
  // This effectively calls the first primary method.
  var result = callNextMethod(context, ...args);

  // 3. Run all 'after' methods (least specific to most specific)
  for (var i = 0; i < state.afterMethods.length; i++) {
    state.afterMethods[i].fn.apply(context, args);
  }

  return result;
}

// Calculates specificity score.
// Returns [Level, Depth] or false.
function getMatchScore(arg, type) {
  if (type === '*') return [5, 0];
  
  if (arg === null) {
    return type === 'null' ? [3, 0] : false;
  }
  
  if (arg === undefined) {
    return type === 'undefined' ? [4, 0] : false;
  }

  // 1. a.constructor.name === t
  if (arg.constructor && arg.constructor.name === type) {
    return [1, 0];
  }

  // 2. Prototype chain walk
  if (typeof arg === 'object' || typeof arg === 'function') {
    var depth = 0;
    var proto = Object.getPrototypeOf(arg);
    while (proto) {
      if (proto.constructor && proto.constructor.name === type) {
        return [2, depth];
      }
      proto = Object.getPrototypeOf(proto);
      depth++;
    }
  }

  // 4. typeof a === t
  if (typeof arg === type) {
    return [4, 0];
  }

  return false;
}

// Compares two methods based on specificity.
// Returns < 0 if m1 is more specific.
function compareMethods(m1, m2, args) {
  for (var i = 0; i < args.length; i++) {
    var s1 = getMatchScore(args[i], m1.discriminators[i]);
    var s2 = getMatchScore(args[i], m2.discriminators[i]);
    
    if (s1[0] !== s2[0]) return s1[0] - s2[0];
    if (s1[1] !== s2[1]) return s1[1] - s2[1];
  }
  return 0;
}

function defgeneric(name) {
  var methods = [];
  var cache = {};
  var version = 0;

  var generic = function (...args) {
    var methodToRun = generic.findMethod.apply(this, args);
    return methodToRun.apply(this, args);
  };
  
  generic.defmethod = function (discriminatorStr, fn, combination) {
    combination = combination || 'primary';
    var discriminators = discriminatorStr.split(',').map(function(s) { return s.trim(); });
    
    // Replace existing method
    methods = methods.filter(function(m) {
      return !(m.discriminatorStr === discriminatorStr && m.combination === combination);
    });

    methods.push({
      discriminators: discriminators,
      discriminatorStr: discriminatorStr,
      fn: fn,
      combination: combination
    });
    
    version++;
    return generic;
  };
  
  generic.removeMethod = function (discriminatorStr, combination) {
    combination = combination || 'primary';
    var initialLen = methods.length;
    methods = methods.filter(function(m) {
      return !(m.discriminatorStr === discriminatorStr && m.combination === combination);
    });
    
    if (methods.length !== initialLen) version++;
    return generic;
  };

  generic.findMethod = function (...args) {
    // Create cache key
    var keyParts = args.map(function(a) {
        if (a === null) return 'null';
        if (a === undefined) return 'undefined';
        if (typeof a === 'object' || typeof a === 'function') return a.constructor.name;
        return typeof a;
    });
    var cacheKey = version + "|" + keyParts.join(',');

    if (cache[cacheKey]) return cache[cacheKey];

    // Find applicable methods
    var applicable = methods.filter(function(m) {
      if (m.discriminators.length !== args.length) return false;
      for (var i = 0; i < args.length; i++) {
        if (!getMatchScore(args[i], m.discriminators[i])) return false;
      }
      return true;
    });

    if (applicable.length === 0) {
       var errArgs = args.map(function(a) {
          if (a === null) return 'null'; 
          return (typeof a === 'object' || typeof a === 'function') ? a.constructor.name : typeof a;
       }).join(',');
       
       return function() {
         throw "No method found for " + name + " with args: " + errArgs;
       };
    }

    // Sort by specificity
    applicable.sort(function(a, b) {
      return compareMethods(a, b, args);
    });

    var arounds = applicable.filter(m => m.combination === 'around');
    var primaries = applicable.filter(m => m.combination === 'primary');
    var befores = applicable.filter(m => m.combination === 'before');
    var afters = applicable.filter(m => m.combination === 'after');

    // If no arounds and no primaries, throw error
    if (primaries.length === 0 && arounds.length === 0) {
      var errArgs = args.map(function(a) {
          if (a === null) return 'null'; 
          return (typeof a === 'object' || typeof a === 'function') ? a.constructor.name : typeof a;
       }).join(',');
       return function() { throw "No method found for " + name + " with args: " + errArgs; };
    }

    // After methods run least-specific to most-specific
    afters.reverse();

    var effectiveMethod = function(...runArgs) {
      var state = {
        name: name,
        phase: 'around',
        aroundMethods: arounds,
        primaryMethods: primaries,
        beforeMethods: befores,
        afterMethods: afters,
        aroundIndex: -1,
        primaryIndex: -1
      };

      _genericStack.push(state);
      try {
        if (arounds.length > 0) {
          return callNextMethod(this, ...runArgs);
        } else {
          // No arounds, skip directly to core
          state.phase = 'primary';
          return executeCore(state, this, runArgs);
        }
      } finally {
        _genericStack.pop();
      }
    };

    cache[cacheKey] = effectiveMethod;
    return effectiveMethod;
  };

  return generic;
};
