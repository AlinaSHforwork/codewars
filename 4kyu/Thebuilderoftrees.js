if (typeof Person === 'undefined') {
  function Person(name, sex) {
    this.name = name;
    this.sex = sex || '';
    this.parent = undefined;
    this.children = [];
  }
}

function interpret(description) {
  const people = new Map();
  let anonCounter = 0;
  const siblingsGraph = new Map();

  const getPerson = (name) => {
    if (!people.has(name)) {
      const p = new Person(name, '');
      if (p.parent === null) p.parent = undefined;
      if (!Array.isArray(p.children)) p.children = [];
      if (p.sex === undefined) p.sex = '';
      people.set(name, p);
    }
    return people.get(name);
  };

  const addSiblingEdge = (a, b) => {
    if (!siblingsGraph.has(a)) siblingsGraph.set(a, new Set());
    if (!siblingsGraph.has(b)) siblingsGraph.set(b, new Set());
    siblingsGraph.get(a).add(b);
    siblingsGraph.get(b).add(a);
  };

  const createAnonParent = () => {
    anonCounter += 1;
    const anon = getPerson(`__anon_parent_${anonCounter}`);
    anon._isAnon = true;
    if (anon.parent === null) anon.parent = undefined;
    if (!Array.isArray(anon.children)) anon.children = [];
    return anon;
  };

  const setSex = (person, sex, force) => {
    if (!person) return;
    if (force) {
      person.sex = sex;
      return;
    }
    if (person.sex === '') person.sex = sex;
  };

  const isAncestor = (ancestor, child) => {
    let current = child.parent;
    while (current) {
      if (current === ancestor) return true;
      current = current.parent;
    }
    return false;
  };

  const setParent = (parent, child) => {
    if (!parent || !child) return;
    if (isAncestor(child, parent)) return;
    const oldParent = child.parent;
    if (oldParent !== undefined && oldParent !== parent) {
      if (!(oldParent && oldParent._isAnon)) return;
      if (oldParent && oldParent._isAnon && !(parent && parent._isAnon)) {
        const moving = Array.isArray(oldParent.children) ? oldParent.children.slice() : [];
        if (!Array.isArray(parent.children)) parent.children = [];
        for (const s of moving) {
          if (!parent.children.includes(s)) parent.children.push(s);
          s.parent = parent;
        }
        oldParent.children = [];
      } else {
        if (Array.isArray(oldParent.children)) {
          const idx = oldParent.children.indexOf(child);
          if (idx !== -1) oldParent.children.splice(idx, 1);
        }
      }
    }
    if (!Array.isArray(parent.children)) parent.children = [];
    if (!parent.children.includes(child)) parent.children.push(child);
    child.parent = parent;
  };

  const updateSiblingRelation = (siblings, isExpr, hasExpr) => {
    if (!Array.isArray(siblings) || siblings.length < 2) return;
    for (let i = 0; i < siblings.length; i++) {
      for (let j = i + 1; j < siblings.length; j++) {
        addSiblingEdge(siblings[i].name, siblings[j].name);
      }
    }
    const existingParent = siblings.map(s => s.parent).find(p => p !== undefined && p !== null);
    if (existingParent) {
      siblings.forEach(s => setParent(existingParent, s));
      return;
    }
    const anon = createAnonParent();
    siblings.forEach(s => setParent(anon, s));
  };

  const splitNames = (namesPart) => {
    if (!namesPart) return [];
    return namesPart
      .replace(/[.]+$/,'')
      .split(/\s*,\s*and\s*|\s+and\s*|\s*,\s*/)
      .map(n => n.trim())
      .filter(n => n.length > 0);
  };

  const processExpression = (expression) => {
    if (!expression || typeof expression !== 'string') return;
    const isExpression = expression.includes(' is ');
    const hasExpression = expression.includes(' has ');
    let parts = expression.split(isExpression ? ' is ' : ' has ');
    if (parts.length < 2) return;
    let leftName = parts[0].trim();
    let rightPart = parts.slice(1).join(isExpression ? ' is ' : ' has ').trim();
    if (!leftName || !rightPart) return;
    const leftPerson = getPerson(leftName);
    const relationMatch = rightPart.match(/^(?:the\s+|a\s+|(\d+)\s+)?(mother|father|brother|sister|son|daughter|sons|daughters|brothers|sisters)(?: of|\,\s*)/i);
    if (!relationMatch) return;
    const relation = relationMatch[2].toLowerCase();
    let namesPart = rightPart.substring(relationMatch.index + relationMatch[0].length).trim();
    const nameList = splitNames(namesPart);
    const rightPeople = nameList.map(name => getPerson(name));
    if (rightPeople.length === 0) return;
    switch (relation) {
      case 'father':
        if (isExpression) {
          setSex(leftPerson, 'm', true);
          rightPeople.forEach(child => setParent(leftPerson, child));
        } else if (hasExpression) {
          rightPeople.forEach(parent => {
            setSex(parent, 'm', true);
            setParent(parent, leftPerson);
          });
        }
        break;
      case 'mother':
        if (isExpression) {
          setSex(leftPerson, 'f', true);
          rightPeople.forEach(child => setParent(leftPerson, child));
        } else if (hasExpression) {
          rightPeople.forEach(parent => {
            setSex(parent, 'f', true);
            setParent(parent, leftPerson);
          });
        }
        break;
      case 'sons':
        if (hasExpression) {
          rightPeople.forEach(child => {
            setSex(child, 'm', false);
            setParent(leftPerson, child);
          });
        } else {
          setSex(leftPerson, 'm', false);
          rightPeople.forEach(child => {
            setSex(child, 'm', false);
            setParent(leftPerson, child);
          });
        }
        break;
      case 'daughters':
        if (hasExpression) {
          rightPeople.forEach(child => {
            setSex(child, 'f', false);
            setParent(leftPerson, child);
          });
        } else {
          setSex(leftPerson, 'f', false);
          rightPeople.forEach(child => {
            setSex(child, 'f', false);
            setParent(leftPerson, child);
          });
        }
        break;
      case 'son':
      case 'daughter':
        if (isExpression) {
          if (rightPeople.length !== 1) break;
          const parent = rightPeople[0];
          setParent(parent, leftPerson);
          setSex(leftPerson, relation === 'son' ? 'm' : 'f', true);
        } else if (hasExpression) {
          rightPeople.forEach(child => {
            setSex(child, relation === 'son' ? 'm' : 'f', false);
            setParent(leftPerson, child);
          });
        }
        if (hasExpression && (rightPart.includes('mother') || rightPart.includes('father'))) {
          const parent = rightPeople[0];
          if (parent) setSex(parent, rightPart.includes('mother') ? 'f' : 'm', true);
        }
        break;
      case 'brother':
      case 'sister':
      case 'brothers':
      case 'sisters': {
        if (isExpression) {
          setSex(leftPerson, (relation === 'brother' || relation === 'brothers') ? 'm' : 'f', true);
        }
        if (hasExpression) {
          const rightSex = (relation === 'sister' || relation === 'sisters') ? 'f' : 'm';
          rightPeople.forEach(person => setSex(person, rightSex, false));
        }
        const allSiblings = [leftPerson, ...rightPeople];
        updateSiblingRelation(allSiblings, isExpression, hasExpression);
        break;
      }
    }
  };

  description.forEach(processExpression);

  const all = Array.from(people.values());
  all.forEach(p => {
    if (p.parent === null) p.parent = undefined;
    if (!Array.isArray(p.children)) p.children = [];
  });

  for (const person of all) {
    if (person.parent !== undefined && person.parent !== null && !(person.parent && person.parent._isAnon)) {
      const rootParent = person.parent;
      const queue = [person.name];
      const comp = new Set();
      while (queue.length) {
        const cur = queue.shift();
        if (comp.has(cur)) continue;
        comp.add(cur);
        const neigh = siblingsGraph.get(cur);
        if (!neigh) continue;
        for (const n of neigh) {
          if (!comp.has(n)) queue.push(n);
        }
      }
      const ordered = Array.from(comp).map(n => getPerson(n));
      for (const p of ordered) {
        setParent(rootParent, p);
      }
    }
  }

  for (const p of Array.from(people.values())) {
    if (p._isAnon && Array.isArray(p.children) && p.children.length === 0) {
      people.delete(p.name);
    }
  }

  const allAfter = Array.from(people.values());
  allAfter.forEach(p => {
    if (p.parent === null) p.parent = undefined;
    if (!Array.isArray(p.children)) p.children = [];
  });

  const noParent = allAfter.filter(p => p.parent === undefined);
  let root = noParent.find(p => Array.isArray(p.children) && p.children.length > 0) || noParent[0] || allAfter[0];

  const sortChildrenIteratively = (rootNode) => {
    if (!rootNode) return;
    const stack = [rootNode];
    const visitedNodes = new Set();
    while (stack.length) {
      const node = stack.pop();
      if (!node || visitedNodes.has(node)) continue;
      visitedNodes.add(node);
      if (Array.isArray(node.children) && node.children.length > 0) {
        node.children.sort((a, b) => a.name.localeCompare(b.name));
        for (let i = node.children.length - 1; i >= 0; i--) stack.push(node.children[i]);
      }
    }
  };

  if (root) sortChildrenIteratively(root);
  return root;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = interpret;
}