FROM ubuntu:22.04

# Prevent interactive prompts during apt-get
ENV DEBIAN_FRONTEND=noninteractive

# Install SSH and gcc
RUN apt-get update && apt-get install -y openssh-server gcc sudo && apt-get clean

# Create ctf user
RUN useradd -d /home/ctf -m -s /bin/bash ctf && \
    echo "ctf:ctf" | chpasswd

WORKDIR /home/ctf

# SSH configuration
RUN mkdir -p /var/run/sshd

# Ensure SSH allows password authentication
RUN echo "PasswordAuthentication yes" >> /etc/ssh/sshd_config

# Injection of codebase
COPY vuln.c /tmp/vuln.c
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN sed -i 's/\r$//' /usr/local/bin/entrypoint.sh && chmod +x /usr/local/bin/entrypoint.sh

# Compile the binary with no protections (-fno-stack-protector, -no-pie, -z execstack)
# We ignore the warnings for using gets()
RUN gcc /tmp/vuln.c -o /home/ctf/vuln -fno-stack-protector -no-pie -z execstack -Wno-deprecated-declarations || true

# Move source instead of cleanup
RUN mv /tmp/vuln.c /home/ctf/vuln.c && \
    chown ctf:ctf /home/ctf/vuln.c

# Set permissions (SUID root allows executing the binary to read root-owned flag.txt)
RUN chown root:ctf /home/ctf/vuln && \
    chmod 4755 /home/ctf/vuln

EXPOSE 22

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
