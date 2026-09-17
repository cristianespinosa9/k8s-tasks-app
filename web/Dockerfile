FROM node:20-alpine

WORKDIR /usr/src/app

COPY package.json ./
RUN npm install --omit=dev \
    && rm -rf /usr/local/lib/node_modules/npm \
               /usr/local/bin/npm \
               /usr/local/bin/npx \
               /usr/local/bin/corepack \
               /opt/yarn-v*

COPY src ./src
COPY public ./public

EXPOSE 8080

USER node

CMD ["node", "src/server.js"]
