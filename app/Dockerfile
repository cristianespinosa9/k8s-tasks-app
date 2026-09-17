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

EXPOSE 3000

USER node

CMD ["sh", "-c", "set -a && [ -f /vault/secrets/db.env ] && . /vault/secrets/db.env; exec node src/server.js"]
