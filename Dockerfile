FROM node:24-alpine AS builder

ARG BUILD_NUMBER
ARG GIT_REF

ENV BUILD_NUMBER=${BUILD_NUMBER}
ENV GIT_REF=${GIT_REF}

RUN test -n "$BUILD_NUMBER" || (echo "BUILD_NUMBER not set" && false)
RUN test -n "$GIT_REF" || (echo "GIT_REF not set" && false)

RUN apk update && \
    apk upgrade

WORKDIR /app

COPY . .

RUN npm run setup
RUN export BUILD_NUMBER=${BUILD_NUMBER} && \
    export GIT_REF=${GIT_REF} && \
    npm run record-build-info

RUN npm prune --production

FROM node:24-alpine
LABEL maintainer="HMPPS Digital Studio <info@digital.justice.gov.uk>"

RUN apk update && \
    apk upgrade && \
    apk add --no-cache tzdata

RUN addgroup -S -g 2000 appgroup && \
    adduser -S -u 2000 -G appgroup appuser

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
