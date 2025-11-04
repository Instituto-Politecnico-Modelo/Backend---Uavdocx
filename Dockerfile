FROM node:18-alpine AS builder

WORKDIR /src/app

COPY package*.json ./
RUN npm install

COPY . . 

RUN npm install -g typescript
RUN tsc 

FROM node:18-alpine

WORKDIR /src/app


COPY --from=builder /src/app/dist ./dist
COPY --from=builder /src/app/package*.json ./

RUN npm install --only=production

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "dist/app.js"]
