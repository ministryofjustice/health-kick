FROM node:10.15-alpine

WORKDIR /home/node

COPY . .
RUN yarn install --frozen-lockfile

# Bake-in production environment variables
ENV NODE_ENV=production

CMD [ "node", "server.js" ]
EXPOSE 3003
