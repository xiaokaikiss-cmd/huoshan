FROM node:20-alpine

WORKDIR /app

# 复制依赖文件
COPY package.json pnpm-lock.yaml ./

# 安装pnpm和依赖
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# 复制源代码
COPY . .

# 构建项目
RUN pnpm build

# 复制public目录到standalone目录
RUN cp -r public .next/standalone/

# 复制构建后的静态文件到standalone目录
RUN cp -r .next/static .next/standalone/.next/

EXPOSE 3000

CMD ["node", ".next/standalone/server.js"]
