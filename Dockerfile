FROM node:18.18-bullseye-slim as builder

ARG BUILD_NUMBER
ARG GIT_REF

ENV BUILD_NUMBER=${BUILD_NUMBER}
ENV GIT_REF=${GIT_REF}

RUN test -n "$BUILD_NUMBER" || (echo "BUILD_NUMBER not set" && false)
RUN test -n "$GIT_REF" || (echo "GIT_REF not set" && false)

RUN apt-get update && \
    apt-get upgrade -y

WORKDIR /app

COPY . .

RUN npm ci --no-audit && \
    export BUILD_NUMBER=${BUILD_NUMBER} && \
    export GIT_REF=${GIT_REF} && \
    npm run record-build-info

RUN npm prune --production

FROM node:18.18-bullseye-slim
LABEL maintainer="HMPPS Digital Studio <info@digital.justice.gov.uk>"

RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get autoremove -y && \
    rm -rf /var/lib/apt/lists/*

RUN addgroup --gid 2000 --system appgroup && \
    adduser --uid 2000 --system appuser --gid 2000

ENV TZ=Europe/London
RUN ln -snf "/usr/share/zoneinfo/$TZ" /etc/localtime && echo "$TZ" > /etc/timezone

# Create app directory
RUN mkdir /app && chown appuser:appgroup /app
USER 2000
WORKDIR /app

COPY --from=builder --chown=appuser:appgroup \
        /app/package.json \
        /app/package-lock.json \
        /app/build-info.json \
        /app/config.js \
        /app/proxy.js \
        /app/server.js \
        /app/convert-hrtime.js \
        ./

COPY --from=builder --chown=appuser:appgroup \
        /app/node_modules ./node_modules

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000
USER 2000
CMD [ "node", "server" ]
