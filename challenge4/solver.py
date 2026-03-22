from Crypto.Util.number import long_to_bytes

def solve(n, e, c):
    # Vulnerability: p is clearly 2 because an odd prime * another prime would make n odd.
    # But since p=2, n is even!
    if n % 2 != 0:
        print("Wait, n is not even, this is not the Two is Prime challenge.")
        return None
        
    p = 2
    q = n // 2
    
    phi = (p - 1) * (q - 1)
    
    # Calculate modular inverse
    d = pow(e, -1, phi)
    
    m = pow(c, d, n)
    return long_to_bytes(m)

if __name__ == "__main__":
    print("Replace n, e, c with the ones from the server")
    # n = ...
    # e = 65537
    # c = ...
    # print(solve(n, e, c).decode())
