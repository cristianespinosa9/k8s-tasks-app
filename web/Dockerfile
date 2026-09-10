FROM node:20-alpine

WORKDIR /usr/src/app

COPY package.json ./
RUN npm install --omit=dev

COPY src ./src
COPY public ./public

EXPOSE 8080

USER node

CMD ["node", "src/server.js"]
