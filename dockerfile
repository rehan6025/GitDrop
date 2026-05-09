FROM node:20

WORKDIR /app

COPY package*.json ./
RUN npm install


COPY . .

RUN npm run build

CMD ["bash", "-lc", "npm run start:prod & node dist/src/worker.main.js"]