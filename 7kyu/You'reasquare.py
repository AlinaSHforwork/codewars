def is_square(n):    
    if n < 0:
        return False
    i = 0
    while i * i < n:
        i += 1
    return i * i == n