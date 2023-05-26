FROM node:19.1

WORKDIR /app

ARG TOKEN
ENV JOE_TOKEN=${TOKEN}
ENV BOT_PREFIX=.

COPY . .

RUN npm ci

RUN npm run build

CMD node ./build/index.js