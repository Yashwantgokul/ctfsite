FROM node:20-slim

# Install system dependencies
RUN apt-get update && apt-get install -y curl git && rm -rf /var/lib/apt/lists/*

# Install Foundry (for Anvil)
RUN curl -L https://foundry.paradigm.xyz | bash
ENV PATH="/root/.foundry/bin:${PATH}"
RUN foundryup

WORKDIR /app

# Install Node.js dependencies
COPY package.json ./
RUN npm install

# Copy challenge files
COPY server.js .
COPY Vault.sol .

# Copy and set up entrypoint
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN sed -i 's/\r$//' /usr/local/bin/entrypoint.sh && chmod +x /usr/local/bin/entrypoint.sh

# Expose NC port (1337) and RPC port (8545)
EXPOSE 1337
EXPOSE 8545

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
