FROM node:12-buster-slim
LABEL maintainer="HMPPS Digital Studio <info@digital.justice.gov.uk>"

ARG BUILD_NUMBER
ARG GIT_REF
ARG NODE_ENV

ENV BUILD_NUMBER ${BUILD_NUMBER:-1_0_0}
ENV GIT_REF ${GIT_REF:-dummy}

RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get autoremove -y && \
    rm -rf /var/lib/apt/lists/*

RUN addgroup --gid 2000 --system appgroup && \
    adduser --uid 2000 --system appuser --gid 2000

# Create app directory
WORKDIR /app
COPY --chown=appuser:appgroup . .

RUN npm ci --no-audit && \
    export BUILD_NUMBER=${BUILD_NUMBER} && \
    export GIT_REF=${GIT_REF} && \
    npm run record-build-info

ENV NODE_ENV ${NODE_ENV:-production}
ENV PORT=3000

USER 2000

EXPOSE 3000
CMD [ "node", "server" ]

