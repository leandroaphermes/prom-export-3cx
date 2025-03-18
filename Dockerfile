FROM node:22-alpine

RUN apk --update --no-cache add curl

ENV PORT=3000

# Create app directory
WORKDIR /app

# Install app dependencies
COPY . .

RUN yarn install --production=true

HEALTHCHECK --interval=15s --timeout=5s --start-period=30s CMD curl --fail http://localhost:$PORT/health || exit 1

ENTRYPOINT [ "yarn", "start" ]