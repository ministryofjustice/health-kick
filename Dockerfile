FROM node:10.15-slim
MAINTAINER HMPPS Digital Studio <info@digital.justice.gov.uk>
ARG BUILD_NUMBER
ARG GIT_REF

RUN addgroup --gid 2000 --system appgroup && \
    adduser --uid 2000 --system appuser --gid 2000

# Create app directory
WORKDIR /app
COPY --chown=appuser:appgroup . .

RUN yarn install --production --frozen-lockfile && \
    export BUILD_NUMBER=${BUILD_NUMBER} && \
    export GIT_REF=${GIT_REF} && \
    yarn run record-build-info

# Bake-in production environment variables
ENV NODE_ENV=production
ENV PORT=3000

USER 2000

CMD [ "node", "server.js" ]
EXPOSE 3000
