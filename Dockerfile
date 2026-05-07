FROM mcr.microsoft.com/playwright:v1.45.0-jammy

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npx playwright install --with-deps

ENV NODE_ENV=production
ENV OPENAI_API_KEY=${OPENAI_API_KEY}

CMD ["npm", "test"]
