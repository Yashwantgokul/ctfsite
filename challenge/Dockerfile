FROM ubuntu:22.04

# Prevent interactive prompts during apt install
ENV DEBIAN_FRONTEND=noninteractive

# Install necessary packages
RUN apt-get update && \
    apt-get install -y openssh-server sudo vim && \
    apt-get clean

# Setup SSH
RUN mkdir /var/run/sshd

# Create walter user
RUN useradd -ms /bin/bash walter && \
    echo 'walter:12345678' | chpasswd

# Setup sudo vulnerability
RUN echo "walter ALL=(ALL) NOPASSWD: /usr/bin/vim" > /etc/sudoers.d/walter && \
    chmod 0440 /etc/sudoers.d/walter

# Copy entrypoint script
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN sed -i 's/\r$//' /usr/local/bin/entrypoint.sh && \
    chmod +x /usr/local/bin/entrypoint.sh

# Expose SSH port
EXPOSE 22

# Start securely via entrypoint
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
