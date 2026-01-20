import functools
import itertools

try:
    DuplicateFromError
except NameError:
    class DuplicateFromError(Exception): pass
    class DuplicateSelectError(Exception): pass
    class DuplicateGroupByError(Exception): pass
    class DuplicateOrderByError(Exception): pass

class Query:
    def __init__(self):
        self._data = []
        self._where_clauses = []
        self._having_clauses = []
        self._group_by_funcs = []
        self._select_func = None
        self._order_by_func = None
        
        self._has_from = False
        self._has_select = False
        self._has_group_by = False
        self._has_order_by = False

    def select(self, func=None):
        if self._has_select:
            raise DuplicateSelectError
        self._has_select = True
        self._select_func = func
        return self

    def from_(self, *args):
        if self._has_from:
            raise DuplicateFromError
        self._has_from = True
        
        if len(args) == 0:
            self._data = []
        elif len(args) == 1:
            self._data = args[0]
        else:
            self._data = [list(x) for x in itertools.product(*args)]
        return self

    def where(self, *funcs):
        self._where_clauses.append(funcs)
        return self

    def group_by(self, *funcs):
        if self._has_group_by:
            raise DuplicateGroupByError
        self._has_group_by = True
        self._group_by_funcs = list(funcs)
        return self

    def having(self, *funcs):
        self._having_clauses.append(funcs)
        return self

    def order_by(self, func):
        if self._has_order_by:
            raise DuplicateOrderByError
        self._has_order_by = True
        self._order_by_func = func
        return self

    def _apply_filters(self, data, clauses):
        result = []
        for item in data:
            keep_item = True
            for clause_group in clauses:
                if not any(f(item) for f in clause_group):
                    keep_item = False
                    break
            if keep_item:
                result.append(item)
        return result

    def _apply_grouping(self, data, group_funcs):
        if not group_funcs:
            return data
        
        current_func = group_funcs[0]
        groups = {}
        
        for item in data:
            key = current_func(item)
            if key not in groups:
                groups[key] = []
            groups[key].append(item)
            
        result = []
        for key, subgroup in groups.items():
            result.append([key, self._apply_grouping(subgroup, group_funcs[1:])])
            
        return result

    def execute(self):
        result = list(self._data)

        if self._where_clauses:
            result = self._apply_filters(result, self._where_clauses)

        if self._group_by_funcs:
            result = self._apply_grouping(result, self._group_by_funcs)

        if self._having_clauses:
            result = self._apply_filters(result, self._having_clauses)

        if self._select_func:
            result = [self._select_func(item) for item in result]

        if self._order_by_func:
            result.sort(key=functools.cmp_to_key(self._order_by_func))

        return result

def query():
    return Query()