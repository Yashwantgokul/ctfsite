FROM node:18-bullseye-slim

RUN apt-get update && \
    apt-get install -y --no-install-recommends ffmpeg && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json .
RUN npm install --production

COPY . .

RUN mkdir -p uploads outputs && \
    chmod +x entrypoint.sh

EXPOSE 80

ENTRYPOINT ["./entrypoint.sh"]
