FROM node:20-alpine

WORKDIR /usr/src/app

COPY package.json ./
RUN npm install --omit=dev

COPY index.js ./

EXPOSE 3000

USER node

CMD ["sh", "-c", "set -a && [ -f /vault/secrets/db.env ] && . /vault/secrets/db.env; exec node index.js"]
