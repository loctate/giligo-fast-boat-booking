FROM node:24-alpine

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci --omit=dev --ignore-scripts --no-audit --no-fund \
  && npm cache clean --force

COPY src ./src

# Normalize copied runtime files regardless of archive or extraction umask.
# Keep files root-owned, readable by the non-root runtime user,
# and non-writable by group or others.
RUN chmod 0644 package.json package-lock.json \
  && chmod -R go-w src \
  && chmod -R a+rX src

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=8080
ENV IPAYMU_ENABLED=false
ENV IPAYMU_BRIDGE_PREFIX=/ipaymu-bridge

USER node

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:8080/ipaymu-bridge/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "src/server.mjs"]
