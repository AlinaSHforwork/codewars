def tribonacci(signature, n):
    if n == 0:
        return []
    elif n <= 3:
        return signature[:n]
    else:
        while len(signature) < n:
            next_value = signature[-1] + signature[-2] + signature[-3]
            signature.append(next_value)
        return signature