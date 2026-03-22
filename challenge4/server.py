import os
import socketserver
from Crypto.Util.number import getPrime, bytes_to_long

class ChallengeHandler(socketserver.BaseRequestHandler):
    def handle(self):
        try:
            self.request.sendall(b"\n\x1b[1;32m\xf0\x9f\x94\x90 Welcome to Secure RSA Service\x1b[0m\n")
            self.request.sendall(b"We use strong primes to secure our encryption \xf0\x9f\x98\x8e\n\n")
            
            flag = os.environ.get('FLAG', 'ctf{test_flag_from_env_var}')
            m = bytes_to_long(flag.encode())
            
            # The vulnerability: p = 2!
            p = 2
            q = getPrime(1024)
            n = p * q
            e = 65537
            c = pow(m, e, n)
            
            self.request.sendall(f"n = {n}\n".encode())
            self.request.sendall(f"e = {e}\n".encode())
            self.request.sendall(f"c = {c}\n\n".encode())
            
            self.request.sendall(b"Decrypt the message and submit the flag:\n> ")
            
            user_input = self.request.recv(1024).decode().strip()
            
            if user_input == flag:
                self.request.sendall(b"\n\x1b[1;32mCorrect! You found the vulnerability!\x1b[0m\n")
            else:
                self.request.sendall(b"\n\x1b[1;31mIncorrect flag.\x1b[0m\n")
                
        except Exception as e:
            pass

class ThreadedTCPServer(socketserver.ThreadingMixIn, socketserver.TCPServer):
    pass

if __name__ == "__main__":
    HOST, PORT = "0.0.0.0", 1337
    socketserver.TCPServer.allow_reuse_address = True
    server = ThreadedTCPServer((HOST, PORT), ChallengeHandler)
    print(f"Starting server on port {PORT}...")
    server.serve_forever()
