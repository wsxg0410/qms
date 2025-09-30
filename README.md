### 项目准备

- 到相应账号新建d1 数据库 qms

- 配置信息
  - drizzle.config.ts
    accountId
    databaseId
    token

  - .env\*

- 运行 npm run gen:wrangler:config 生成 wrangler.jsonc

- 运行 npm run db:gen 生成 drizzle

- 运行 npm run db:mig:local 生成本地数据库

- 运行 npm run db:mig:remote 生成远程数据库

### 部署方法

- 运行 npm run deploy
