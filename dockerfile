
FROM node:20

COPY --from=docker:27-cli /usr/local/bin/docker /usr/local/bin/docker

WORKDIR /app

COPY package*.json ./
RUN npm install


COPY . .

RUN npm run build

CMD ["bash", "-lc", "npm run start:dev & node dist/src/worker.main.js"]