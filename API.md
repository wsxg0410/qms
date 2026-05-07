# QMS API 文档

> Queue Management System — 通用任务队列管理服务
>
> Base URL: `https://qms.<your-domain>`

---

## 通用说明

### 认证方式

当前通过 `env` header 进行环境隔离，确保不同环境的数据互不影响。

### 必需 Headers

| Header           |     必填      | 说明                                                                                |
| ---------------- | :-----------: | ----------------------------------------------------------------------------------- |
| `env` 或 `x-env` |      ✅       | 环境标识符，用于数据隔离。例如 `dev`、`download-prod`。优先读取 `env`，其次 `x-env` |
| `Content-Type`   | ✅ (POST/PUT) | `application/json`                                                                  |

### 统一响应格式

成功响应：

```json
{
  "success": true,
  "data": "<响应数据>"
}
```

错误响应：

```json
{
  "success": false,
  "data": {
    "message": "错误描述"
  }
}
```

### Queue 数据模型

| 字段         | 类型             | 说明                                                                   |
| ------------ | ---------------- | ---------------------------------------------------------------------- |
| `id`         | `string`         | 队列任务唯一标识（唯一任务: MD5 哈希，非唯一任务: nanoid）             |
| `env`        | `string`         | 环境标识                                                               |
| `type`       | `string`         | 任务类型                                                               |
| `status`     | `string`         | 状态：`active` \| `hang` \| `doing` \| `done` \| `fail` \| `out_times` |
| `errorTimes` | `integer`        | 错误重试次数                                                           |
| `data`       | `object`         | 任务数据（JSON）                                                       |
| `config`     | `object`         | 任务配置（JSON）                                                       |
| `priority`   | `integer`        | 优先级，数值越大优先级越高，默认 `0`                                   |
| `result`     | `string \| null` | 任务执行结果                                                           |
| `execAt`     | `string`         | 计划执行时间（ISO 8601）                                               |
| `createdAt`  | `string`         | 创建时间（ISO 8601）                                                   |
| `updatedAt`  | `string`         | 更新时间（ISO 8601）                                                   |

---

## 接口列表

---

### 1. 健康检查

```
GET /api/hello
```

> 此端点**不需要** `env` header。

**响应示例：**

```json
{
  "success": true,
  "data": {
    "success": true,
    "data": "hello"
  }
}
```

---

### 2. 添加单个任务

```
POST /api/queues/add
```

**请求体：**

| 字段       | 类型      | 必填 | 默认值 | 说明                                                                 |
| ---------- | --------- | :--: | ------ | -------------------------------------------------------------------- |
| `type`     | `string`  |  ✅  | —      | 任务类型，如 `download`、`coupon`                                    |
| `data`     | `any`     |  ✅  | —      | 任务数据，任意 JSON 对象                                             |
| `unique`   | `boolean` |  ❌  | `true` | 是否唯一。`true` 时相同 `(env, type, data)` 的任务会被去重（upsert） |
| `priority` | `number`  |  ❌  | `0`    | 优先级，数值越大越优先处理                                           |

**请求示例：**

```json
{
  "type": "download",
  "data": { "coupon": "1222223", "follow": "133323" },
  "unique": true,
  "priority": 0
}
```

**响应：** 返回创建/更新后的 Queue 对象。

---

### 3. 批量添加任务

```
POST /api/queues/bulk-add
```

**请求体：**

| 字段       | 类型      | 必填 | 默认值 | 说明         |
| ---------- | --------- | :--: | ------ | ------------ |
| `type`     | `string`  |  ✅  | —      | 任务类型     |
| `data`     | `any[]`   |  ✅  | —      | 任务数据数组 |
| `unique`   | `boolean` |  ❌  | `true` | 是否去重     |
| `priority` | `number`  |  ❌  | `0`    | 优先级       |

**请求示例：**

```json
{
  "type": "download",
  "data": [
    { "coupon": "12311x1xxx", "follow": "123" },
    { "coupon": "12333233", "follow": "1234" }
  ]
}
```

**响应：** 返回 Queue 对象数组。

---

### 4. 分页查询任务列表

```
GET /api/queues?type={type}&status={status}&page={page}&pageSize={pageSize}
```

**查询参数：**

| 参数       | 类型     | 必填 | 默认值 | 说明                                                                           |
| ---------- | -------- | :--: | ------ | ------------------------------------------------------------------------------ |
| `type`     | `string` |  ❌  | —      | 按任务类型过滤                                                                 |
| `status`   | `string` |  ❌  | —      | 按状态过滤（`active` \| `hang` \| `doing` \| `done` \| `fail` \| `out_times`） |
| `page`     | `number` |  ❌  | `1`    | 页码（从 1 开始）                                                              |
| `pageSize` | `number` |  ❌  | `20`   | 每页条数（1 ~ 100）                                                            |

**响应：**

```json
{
  "success": true,
  "data": {
    "data": [{ "id": "...", "type": "download", "status": "active" }],
    "total": 150,
    "page": 1,
    "pageSize": 20
  }
}
```

---

### 5. 获取单个任务详情

```
GET /api/queues/{id}
```

**路径参数：**

| 参数 | 说明        |
| ---- | ----------- |
| `id` | 队列任务 ID |

**响应：** 返回 Queue 对象。不存在或 `env` 不匹配时返回 404。

---

### 6. 按批次获取待处理任务

```
GET /api/queues/get-by-batch-size?type={type}&batchSize={batchSize}
```

**查询参数：**

| 参数        | 类型     | 必填 | 默认值 | 说明                 |
| ----------- | -------- | :--: | ------ | -------------------- |
| `type`      | `string` |  ✅  | `""`   | 任务类型（精确匹配） |
| `batchSize` | `number` |  ❌  | `10`   | 返回的最大任务数量   |

**筛选逻辑：**

- `status` IN (`active`, `fail`) 且 `execAt` < 当前时间
- 按 `priority` 降序、`updatedAt` 升序排列

**响应：** 返回 Queue 对象数组。

---

### 7. 获取待处理任务数量

```
GET /api/queues/count?type={type}
```

**查询参数：**

| 参数   | 类型     | 必填 | 默认值 | 说明                                              |
| ------ | -------- | :--: | ------ | ------------------------------------------------- |
| `type` | `string` |  ❌  | `""`   | 任务类型前缀（LIKE 前缀匹配），为空时匹配所有类型 |

**筛选逻辑：**

- `status` IN (`active`, `fail`)
- `type` 使用 `LIKE '{type}%'` 前缀匹配

**响应：**

```json
{
  "success": true,
  "data": { "count": 42 }
}
```

---

### 8. 统计概览

```
GET /api/queues/stats?type={type}
```

返回各状态的任务数量汇总。

**查询参数：**

| 参数   | 类型     | 必填 | 说明                       |
| ------ | -------- | :--: | -------------------------- |
| `type` | `string` |  ❌  | 按任务类型过滤（精确匹配） |

**响应：**

```json
{
  "success": true,
  "data": [
    { "status": "active", "count": 120 },
    { "status": "done", "count": 3500 },
    { "status": "fail", "count": 15 }
  ]
}
```

---

### 9. 更新任务（完整更新）

```
PUT /api/queues/{id}
```

**请求体：**

| 字段         | 类型     | 必填 | 说明                     |
| ------------ | -------- | :--: | ------------------------ |
| `status`     | `string` |  ✅  | 新状态（需为合法枚举值） |
| `errorTimes` | `number` |  ✅  | 错误次数                 |
| `result`     | `string` |  ✅  | 执行结果                 |

**响应：** 返回更新后的 Queue 对象。

---

### 10. 仅更新任务状态

```
PUT /api/queues/{id}/status
```

**请求体：**

| 字段     | 类型     | 必填 | 说明                                                                     |
| -------- | -------- | :--: | ------------------------------------------------------------------------ |
| `status` | `string` |  ✅  | 合法值：`active` \| `hang` \| `doing` \| `done` \| `fail` \| `out_times` |

**响应：** 返回更新后的 Queue 对象。

---

### 11. 批量更新状态

```
PUT /api/queues/batch-status
```

**请求体：**

| 字段     | 类型       | 必填 | 说明                      |
| -------- | ---------- | :--: | ------------------------- |
| `ids`    | `string[]` |  ✅  | 任务 ID 数组（至少 1 个） |
| `status` | `string`   |  ✅  | 目标状态                  |

**请求示例：**

```json
{
  "ids": ["abc123", "def456"],
  "status": "done"
}
```

**响应：**

```json
{
  "success": true,
  "data": { "updatedCount": 2 }
}
```

---

### 12. 删除单个任务

```
DELETE /api/queues/{id}
```

**响应：**

```json
{ "success": true, "data": true }
```

---

### 13. 批量删除

```
POST /api/queues/remove
```

按条件批量删除任务。**至少需要提供一个过滤条件**。

**请求体：**

| 字段     | 类型     | 必填 | 说明           |
| -------- | -------- | :--: | -------------- |
| `type`   | `string` | ❌\* | 按任务类型过滤 |
| `status` | `string` | ❌\* | 按状态过滤     |

> \* `type` 和 `status` 至少提供一个

**请求示例：**

```json
{
  "type": "download",
  "status": "done"
}
```

**响应：**

```json
{ "success": true, "data": true }
```

---

### 14. 重新激活任务

#### GET 方式（按条件）

```
GET /api/queues/reactive?type={type}&status={status}
```

| 参数     | 类型     | 必填 | 说明           |
| -------- | -------- | :--: | -------------- |
| `type`   | `string` |  ❌  | 按任务类型过滤 |
| `status` | `string` |  ❌  | 按当前状态过滤 |

#### POST 方式（按 ID 数组）

```
POST /api/queues/reactive
```

**请求体：**

| 字段     | 类型       | 必填 | 说明                     |
| -------- | ---------- | :--: | ------------------------ |
| `ids`    | `string[]` |  ❌  | 要重新激活的任务 ID 数组 |
| `type`   | `string`   |  ❌  | 按任务类型过滤           |
| `status` | `string`   |  ❌  | 按当前状态过滤           |

**效果：** 将匹配的任务状态重置为 `active`，错误次数归零。

> ⚠️ 如果未提供任何过滤条件，操作将被跳过（不会更新任何记录）。

**响应：**

```json
{ "success": true, "data": true }
```
