# 校园足球信息管理平台 - 前端对接文档

> **版本**: v1.0.0  
> **最后更新**: 2026-06-11  
> **维护团队**: Vibe Coding  
> **API 基础地址**: `https://sztufa-server.vercel.app/api/v1`

---

## 目录

- [1. 项目概述](#1-项目概述)
- [2. API 基础信息](#2-api-基础信息)
- [3. 认证授权机制](#3-认证授权机制)
- [4. 通用规范](#4-通用规范)
- [5. 数据模型定义](#5-数据模型定义)
- [6. API 接口详细规范](#6-api-接口详细规范)
- [7. 错误码说明](#7-错误码说明)
- [8. 接口调用示例](#8-接口调用示例)
- [9. 接口版本控制策略](#9-接口版本控制策略)
- [10. 前后端协作流程](#10-前后端协作流程)

---

## 1. 项目概述

### 1.1 项目简介

校园足球信息管理平台是一个基于 **NestJS + TypeScript + PostgreSQL** 的后端服务系统，为校园足球赛事提供完整的数字化管理解决方案。

### 1.2 核心功能模块

| 模块 | 功能描述 |
|------|----------|
| 用户认证 | JWT 令牌认证，支持用户注册和登录 |
| 球队管理 | 球队信息的增删改查，支持搜索 |
| 球员管理 | 球员信息管理，支持关联球队 |
| 比赛管理 | 比赛日程、结果记录和统计 |
| 数据导入 | 支持从 JSON 文件批量导入数据 |

### 1.3 技术栈

- **框架**: NestJS v10.0.0
- **语言**: TypeScript v5.3.2
- **数据库**: PostgreSQL v16.x
- **ORM**: Prisma v5.7.0
- **认证**: JWT v10.2.0
- **API 文档**: Swagger v7.1.17

---

## 2. API 基础信息

### 2.1 基础 URL

```
开发环境: https://sztufa-server.vercel.app/api/v1
生产环境: https://your-domain.com/api/v1
```

### 2.2 请求格式

- **Content-Type**: `application/json`
- **字符编码**: `UTF-8`
- **请求方法**: `GET`, `POST`, `PATCH`, `DELETE`

### 2.3 响应格式

所有接口统一返回 JSON 格式数据，包含以下字段：

#### 成功响应

```json
{
  "data": { /* 返回的数据对象或数组 */ },
  "message": "操作成功"
}
```

#### 分页响应

```json
{
  "data": [ /* 数据数组 */ ],
  "total": 100,
  "page": 1,
  "limit": 10
}
```

#### 错误响应

```json
{
  "statusCode": 400,
  "message": "错误信息",
  "error": "Bad Request"
}
```

### 2.4 Swagger 文档

启动服务后访问在线 API 文档：

```
https://sztufa-server.vercel.app/api/docs
```

---

## 3. 认证授权机制

### 3.1 JWT 认证流程

本系统使用 **JWT (JSON Web Token)** 进行身份认证。

#### 认证流程图

```
┌─────────┐                    ┌─────────┐                    ┌─────────┐
│  前端   │                    │  后端   │                    │ 数据库  │
└────┬────┘                    └────┬────┘                    └────┬────┘
     │                              │                              │
     │  1. 登录请求 (username/pwd)  │                              │
     │─────────────────────────────>│                              │
     │                              │  2. 验证用户信息              │
     │                              │─────────────────────────────>│
     │                              │<─────────────────────────────│
     │                              │  3. 生成 JWT Token           │
     │  4. 返回 Token               │                              │
     │<─────────────────────────────│                              │
     │                              │                              │
     │  5. 请求受保护资源           │                              │
     │  (Header: Authorization)     │                              │
     │─────────────────────────────>│                              │
     │                              │  6. 验证 Token               │
     │                              │─────────────────────────────>│
     │                              │<─────────────────────────────│
     │  7. 返回数据                 │                              │
     │<─────────────────────────────│                              │
```

### 3.2 Token 使用方式

#### 获取 Token

通过登录接口获取 JWT Token：

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "password123"
}
```

#### 响应示例

```json
{
  "user": {
    "id": "clx1234567890",
    "username": "admin",
    "role": "admin"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### 使用 Token

在后续请求的 Header 中携带 Token：

```http
GET /api/v1/teams
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3.3 Token 有效期

- **默认有效期**: 24小时（可在后端配置）
- **过期处理**: Token 过期后需重新登录获取新 Token

### 3.4 用户角色权限

| 角色 | 权限说明 |
|------|----------|
| `user` | 普通用户，仅可查看数据 |
| `admin` | 管理员，可进行所有操作（增删改查） |

### 3.5 需要认证的接口

以下接口需要 JWT Token 认证：

| 模块 | 需要认证的操作 |
|------|----------------|
| 球队管理 | POST, PATCH, DELETE |
| 球员管理 | POST, PATCH, DELETE |
| 比赛管理 | POST, PATCH, DELETE |
| 数据导入 | POST |

**注意**: GET 请求（查询操作）通常不需要认证，可直接访问。

---

## 4. 通用规范

### 4.1 请求参数规范

#### Query 参数

| 参数名 | 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| `page` | number | 否 | 页码，默认 1 | `?page=1` |
| `limit` | number | 否 | 每页数量，默认 10 | `?limit=10` |
| `teamId` | string | 否 | 球队ID筛选 | `?teamId=clx123` |
| `name` | string | 否 | 名称搜索 | `?name=张三` |

#### Path 参数

| 参数名 | 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| `id` | string | 是 | 资源唯一标识符 | `/teams/clx123` |

#### Body 参数

所有 POST/PATCH 请求的 Body 参数均为 JSON 格式。

### 4.2 分页规范

#### 请求示例

```http
GET /api/v1/teams?page=1&limit=10
```

#### 响应格式

```json
{
  "data": [
    { /* 球队对象 */ },
    { /* 球队对象 */ }
  ],
  "total": 25,
  "page": 1,
  "limit": 10
}
```

### 4.3 时间格式

所有时间字段使用 **ISO 8601** 格式：

```
YYYY-MM-DDTHH:mm:ss.sssZ
示例: 2024-01-15T14:00:00.000Z
```

### 4.4 ID 格式

所有资源 ID 使用 **CUID** 格式（25位字符串）：

```
示例: clx1234567890abcdefghijklmnopqrstuvwxyz
```

---

## 5. 数据模型定义

### 5.1 User (用户)

```typescript
interface User {
  id: string;          // CUID，唯一标识
  username: string;     // 用户名，唯一，3-50字符
  password: string;    // 密码（仅注册/登录时使用，响应中不返回）
  role: string;         // 角色: 'user' | 'admin'
  createdAt: Date;      // 创建时间
  updatedAt: Date;      // 更新时间
}
```

### 5.2 Team (球队)

```typescript
interface Team {
  id: string;                // CUID，唯一标识
  teamName: string;           // 球队名称，唯一，最大100字符
  teamDoctor?: string;        // 队医，最大50字符
  headCoach?: string;         // 主教练，最大50字符
  teamLeader?: string;        // 队长，最大50字符
  coachPhone?: string;        // 教练电话，最大20字符
  leaderPhone?: string;       // 队长电话，最大20字符
  homeJerseyColor: string;    // 主场球衣颜色，最大20字符
  awayJerseyColor: string;    // 客场球衣颜色，最大20字符
  teamLogo?: string;          // 球队Logo (Base64编码)
  homeJersey?: string;        // 主场球衣图片 (Base64编码)
  awayJersey?: string;        // 客场球衣图片 (Base64编码)
  players?: Player[];          // 球员列表（关联）
  createdAt: Date;            // 创建时间
  updatedAt: Date;            // 更新时间
}
```

### 5.3 Player (球员)

```typescript
interface Player {
  id: string;           // CUID，唯一标识
  name: string;          // 球员姓名，最大50字符
  studentId: string;     // 学号，唯一，最大20字符
  jerseyNumber: string;  // 球衣号码，最大10字符
  photo?: string;         // 球员照片 (Base64编码)
  teamId: string;         // 所属球队ID
  team?: Team;            // 所属球队（关联）
  createdAt: Date;        // 创建时间
  updatedAt: Date;        // 更新时间
}
```

### 5.4 Match (比赛)

```typescript
interface Match {
  id: string;            // CUID，唯一标识
  homeTeamId: string;     // 主队ID
  awayTeamId: string;     // 客队ID
  homeTeam?: Team;        // 主队（关联）
  awayTeam?: Team;        // 客队（关联）
  homeScore: number;      // 主队比分，默认0
  awayScore: number;      // 客队比分，默认0
  matchDate: Date;        // 比赛日期时间
  location: string;       // 比赛地点，最大100字符
  status: string;         // 比赛状态，默认'scheduled'
  createdAt: Date;        // 创建时间
  updatedAt: Date;        // 更新时间
}
```

#### 比赛状态说明

| 状态值 | 说明 |
|--------|------|
| `scheduled` | 已安排，未开始 |
| `ongoing` | 进行中 |
| `finished` | 已结束 |
| `cancelled` | 已取消 |

### 5.5 数据关系图

```
┌──────────┐
│   User   │
└──────────┘

┌──────────┐       ┌──────────┐
│   Team   │◄──────│  Player  │
└────┬─────┘ 1:N   └──────────┘
     │
     │ N:M
     │
┌────▼─────┐
│  Match   │
└──────────┘
```

---

## 6. API 接口详细规范

### 6.1 认证接口 (Authentication)

#### 6.1.1 用户注册

**接口名称**: 用户注册  
**请求 URL**: `/api/v1/auth/register`  
**HTTP 方法**: `POST`  
**需要认证**: 否

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 | 验证规则 |
|--------|------|------|------|----------|
| username | string | 是 | 用户名 | 最少3字符 |
| password | string | 是 | 密码 | 最少6字符 |
| role | string | 否 | 角色 | 默认 'user' |

**请求示例**:

```json
{
  "username": "admin",
  "password": "password123",
  "role": "admin"
}
```

**成功响应** (201 Created):

```json
{
  "user": {
    "id": "clx1234567890",
    "username": "admin",
    "role": "admin",
    "createdAt": "2024-01-15T10:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**错误响应**:

| 状态码 | 说明 |
|--------|------|
| 400 | 参数验证失败 |
| 409 | 用户名已存在 |

---

#### 6.1.2 用户登录

**接口名称**: 用户登录  
**请求 URL**: `/api/v1/auth/login`  
**HTTP 方法**: `POST`  
**需要认证**: 否

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| username | string | 是 | 用户名 |
| password | string | 是 | 密码 |

**请求示例**:

```json
{
  "username": "admin",
  "password": "password123"
}
```

**成功响应** (200 OK):

```json
{
  "user": {
    "id": "clx1234567890",
    "username": "admin",
    "role": "admin"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**错误响应**:

| 状态码 | 说明 |
|--------|------|
| 401 | 用户名或密码错误 |

---

### 6.2 球队接口 (Teams)

#### 6.2.1 获取球队列表

**接口名称**: 获取球队列表  
**请求 URL**: `/api/v1/teams`  
**HTTP 方法**: `GET`  
**需要认证**: 否

**Query 参数**:

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| page | number | 否 | 1 | 页码 |
| limit | number | 否 | 10 | 每页数量 |

**请求示例**:

```http
GET /api/v1/teams?page=1&limit=10
```

**成功响应** (200 OK):

```json
{
  "data": [
    {
      "id": "clx1234567890",
      "teamName": "人工智能学院",
      "teamDoctor": "张正扬",
      "headCoach": "谢子腾",
      "teamLeader": "罗圳城",
      "coachPhone": "13913913913",
      "leaderPhone": "13513513513",
      "homeJerseyColor": "蓝色",
      "awayJerseyColor": "白色",
      "teamLogo": "data:image/png;base64,...",
      "homeJersey": "data:image/png;base64,...",
      "awayJersey": "data:image/png;base64,...",
      "players": [
        {
          "id": "clxplayer123",
          "name": "张三",
          "studentId": "20210001",
          "jerseyNumber": "10",
          "photo": "data:image/png;base64,...",
          "teamId": "clx1234567890",
          "createdAt": "2024-01-15T10:00:00.000Z",
          "updatedAt": "2024-01-15T10:00:00.000Z"
        }
      ],
      "createdAt": "2024-01-15T10:00:00.000Z",
      "updatedAt": "2024-01-15T10:00:00.000Z"
    }
  ],
  "total": 25,
  "page": 1,
  "limit": 10
}
```

---

#### 6.2.2 搜索球队

**接口名称**: 按名称搜索球队  
**请求 URL**: `/api/v1/teams/search`  
**HTTP 方法**: `GET`  
**需要认证**: 否

**Query 参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| name | string | 是 | 球队名称（模糊搜索） |

**请求示例**:

```http
GET /api/v1/teams/search?name=人工智能
```

**成功响应** (200 OK):

```json
[
  {
    "id": "clx1234567890",
    "teamName": "人工智能学院",
    "teamDoctor": "张正扬",
    "headCoach": "谢子腾",
    "teamLeader": "罗圳城",
    "coachPhone": "13913913913",
    "leaderPhone": "13513513513",
    "homeJerseyColor": "蓝色",
    "awayJerseyColor": "白色",
    "teamLogo": "data:image/png;base64,...",
    "homeJersey": "data:image/png;base64,...",
    "awayJersey": "data:image/png;base64,...",
    "players": [],
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z"
  }
]
```

---

#### 6.2.3 获取单个球队

**接口名称**: 获取单个球队详情  
**请求 URL**: `/api/v1/teams/:id`  
**HTTP 方法**: `GET`  
**需要认证**: 否

**Path 参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | string | 是 | 球队ID |

**请求示例**:

```http
GET /api/v1/teams/clx1234567890
```

**成功响应** (200 OK):

```json
{
  "id": "clx1234567890",
  "teamName": "人工智能学院",
  "teamDoctor": "张正扬",
  "headCoach": "谢子腾",
  "teamLeader": "罗圳城",
  "coachPhone": "13913913913",
  "leaderPhone": "13513513513",
  "homeJerseyColor": "蓝色",
  "awayJerseyColor": "白色",
  "teamLogo": "data:image/png;base64,...",
  "homeJersey": "data:image/png;base64,...",
  "awayJersey": "data:image/png;base64,...",
  "players": [
    {
      "id": "clxplayer123",
      "name": "张三",
      "studentId": "20210001",
      "jerseyNumber": "10",
      "photo": "data:image/png;base64,...",
      "teamId": "clx1234567890",
      "createdAt": "2024-01-15T10:00:00.000Z",
      "updatedAt": "2024-01-15T10:00:00.000Z"
    }
  ],
  "createdAt": "2024-01-15T10:00:00.000Z",
  "updatedAt": "2024-01-15T10:00:00.000Z"
}
```

**错误响应**:

| 状态码 | 说明 |
|--------|------|
| 404 | 球队不存在 |

---

#### 6.2.4 创建球队

**接口名称**: 创建球队  
**请求 URL**: `/api/v1/teams`  
**HTTP 方法**: `POST`  
**需要认证**: 是

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 | 验证规则 |
|--------|------|------|------|----------|
| teamName | string | 是 | 球队名称 | 唯一，最大100字符 |
| teamDoctor | string | 否 | 队医 | 最大50字符 |
| headCoach | string | 否 | 主教练 | 最大50字符 |
| teamLeader | string | 否 | 队长 | 最大50字符 |
| coachPhone | string | 否 | 教练电话 | 最大20字符 |
| leaderPhone | string | 否 | 队长电话 | 最大20字符 |
| homeJerseyColor | string | 是 | 主场球衣颜色 | 最大20字符 |
| awayJerseyColor | string | 是 | 客场球衣颜色 | 最大20字符 |
| teamLogo | string | 否 | 球队Logo | Base64编码 |
| homeJersey | string | 否 | 主场球衣图片 | Base64编码 |
| awayJersey | string | 否 | 客场球衣图片 | Base64编码 |

**请求示例**:

```json
{
  "teamName": "计算机学院",
  "teamDoctor": "李医生",
  "headCoach": "王教练",
  "teamLeader": "张队长",
  "coachPhone": "13800138000",
  "leaderPhone": "13900139000",
  "homeJerseyColor": "红色",
  "awayJerseyColor": "白色",
  "teamLogo": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "homeJersey": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "awayJersey": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
}
```

**成功响应** (201 Created):

```json
{
  "id": "clxnewteam123",
  "teamName": "计算机学院",
  "teamDoctor": "李医生",
  "headCoach": "王教练",
  "teamLeader": "张队长",
  "coachPhone": "13800138000",
  "leaderPhone": "13900139000",
  "homeJerseyColor": "红色",
  "awayJerseyColor": "白色",
  "teamLogo": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "homeJersey": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "awayJersey": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "players": [],
  "createdAt": "2024-01-15T10:00:00.000Z",
  "updatedAt": "2024-01-15T10:00:00.000Z"
}
```

**错误响应**:

| 状态码 | 说明 |
|--------|------|
| 400 | 参数验证失败 |
| 401 | 未授权（缺少或无效Token） |
| 409 | 球队名称已存在 |

---

#### 6.2.5 更新球队

**接口名称**: 更新球队信息  
**请求 URL**: `/api/v1/teams/:id`  
**HTTP 方法**: `PATCH`  
**需要认证**: 是

**Path 参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | string | 是 | 球队ID |

**请求参数**: 所有字段均为可选，只更新传入的字段

**请求示例**:

```json
{
  "teamName": "计算机科学与技术学院",
  "headCoach": "新教练"
}
```

**成功响应** (200 OK):

```json
{
  "id": "clx1234567890",
  "teamName": "计算机科学与技术学院",
  "teamDoctor": "李医生",
  "headCoach": "新教练",
  "teamLeader": "张队长",
  "coachPhone": "13800138000",
  "leaderPhone": "13900139000",
  "homeJerseyColor": "红色",
  "awayJerseyColor": "白色",
  "teamLogo": "data:image/png;base64,...",
  "homeJersey": "data:image/png;base64,...",
  "awayJersey": "data:image/png;base64,...",
  "players": [],
  "createdAt": "2024-01-15T10:00:00.000Z",
  "updatedAt": "2024-01-15T11:00:00.000Z"
}
```

**错误响应**:

| 状态码 | 说明 |
|--------|------|
| 400 | 参数验证失败 |
| 401 | 未授权 |
| 404 | 球队不存在 |
| 409 | 球队名称已存在 |

---

#### 6.2.6 删除球队

**接口名称**: 删除球队  
**请求 URL**: `/api/v1/teams/:id`  
**HTTP 方法**: `DELETE`  
**需要认证**: 是

**Path 参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | string | 是 | 球队ID |

**请求示例**:

```http
DELETE /api/v1/teams/clx1234567890
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**成功响应** (200 OK):

```json
{
  "id": "clx1234567890",
  "teamName": "人工智能学院",
  "teamDoctor": "张正扬",
  "headCoach": "谢子腾",
  "teamLeader": "罗圳城",
  "coachPhone": "13913913913",
  "leaderPhone": "13513513513",
  "homeJerseyColor": "蓝色",
  "awayJerseyColor": "白色",
  "teamLogo": null,
  "homeJersey": null,
  "awayJersey": null,
  "createdAt": "2024-01-15T10:00:00.000Z",
  "updatedAt": "2024-01-15T10:00:00.000Z"
}
```

**错误响应**:

| 状态码 | 说明 |
|--------|------|
| 401 | 未授权 |
| 404 | 球队不存在 |

**注意**: 删除球队时会级联删除该球队下的所有球员。

---

### 6.3 球员接口 (Players)

#### 6.3.1 获取球员列表

**接口名称**: 获取球员列表  
**请求 URL**: `/api/v1/players`  
**HTTP 方法**: `GET`  
**需要认证**: 否

**Query 参数**:

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| page | number | 否 | 1 | 页码 |
| limit | number | 否 | 10 | 每页数量 |
| teamId | string | 否 | - | 按球队ID筛选 |

**请求示例**:

```http
GET /api/v1/players?page=1&limit=10&teamId=clx1234567890
```

**成功响应** (200 OK):

```json
{
  "data": [
    {
      "id": "clxplayer123",
      "name": "张三",
      "studentId": "20210001",
      "jerseyNumber": "10",
      "photo": "data:image/png;base64,...",
      "teamId": "clx1234567890",
      "team": {
        "id": "clx1234567890",
        "teamName": "人工智能学院",
        "homeJerseyColor": "蓝色",
        "awayJerseyColor": "白色",
        "createdAt": "2024-01-15T10:00:00.000Z",
        "updatedAt": "2024-01-15T10:00:00.000Z"
      },
      "createdAt": "2024-01-15T10:00:00.000Z",
      "updatedAt": "2024-01-15T10:00:00.000Z"
    }
  ],
  "total": 50,
  "page": 1,
  "limit": 10
}
```

---

#### 6.3.2 搜索球员

**接口名称**: 按名称搜索球员  
**请求 URL**: `/api/v1/players/search`  
**HTTP 方法**: `GET`  
**需要认证**: 否

**Query 参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| name | string | 是 | 球员姓名（模糊搜索） |

**请求示例**:

```http
GET /api/v1/players/search?name=张
```

**成功响应** (200 OK):

```json
[
  {
    "id": "clxplayer123",
    "name": "张三",
    "studentId": "20210001",
    "jerseyNumber": "10",
    "photo": "data:image/png;base64,...",
    "teamId": "clx1234567890",
    "team": {
      "id": "clx1234567890",
      "teamName": "人工智能学院",
      "homeJerseyColor": "蓝色",
      "awayJerseyColor": "白色",
      "createdAt": "2024-01-15T10:00:00.000Z",
      "updatedAt": "2024-01-15T10:00:00.000Z"
    },
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z"
  }
]
```

---

#### 6.3.3 获取单个球员

**接口名称**: 获取单个球员详情  
**请求 URL**: `/api/v1/players/:id`  
**HTTP 方法**: `GET`  
**需要认证**: 否

**Path 参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | string | 是 | 球员ID |

**请求示例**:

```http
GET /api/v1/players/clxplayer123
```

**成功响应** (200 OK):

```json
{
  "id": "clxplayer123",
  "name": "张三",
  "studentId": "20210001",
  "jerseyNumber": "10",
  "photo": "data:image/png;base64,...",
  "teamId": "clx1234567890",
  "team": {
    "id": "clx1234567890",
    "teamName": "人工智能学院",
    "teamDoctor": "张正扬",
    "headCoach": "谢子腾",
    "teamLeader": "罗圳城",
    "coachPhone": "13913913913",
    "leaderPhone": "13513513513",
    "homeJerseyColor": "蓝色",
    "awayJerseyColor": "白色",
    "teamLogo": "data:image/png;base64,...",
    "homeJersey": "data:image/png;base64,...",
    "awayJersey": "data:image/png;base64,...",
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z"
  },
  "createdAt": "2024-01-15T10:00:00.000Z",
  "updatedAt": "2024-01-15T10:00:00.000Z"
}
```

**错误响应**:

| 状态码 | 说明 |
|--------|------|
| 404 | 球员不存在 |

---

#### 6.3.4 创建球员

**接口名称**: 创建球员  
**请求 URL**: `/api/v1/players`  
**HTTP 方法**: `POST`  
**需要认证**: 是

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 | 验证规则 |
|--------|------|------|------|----------|
| name | string | 是 | 球员姓名 | 最大50字符 |
| studentId | string | 是 | 学号 | 唯一，最大20字符 |
| jerseyNumber | string | 是 | 球衣号码 | 最大10字符 |
| photo | string | 否 | 球员照片 | Base64编码 |
| teamId | string | 是 | 所属球队ID | 必须存在 |

**请求示例**:

```json
{
  "name": "李四",
  "studentId": "20210002",
  "jerseyNumber": "7",
  "photo": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "teamId": "clx1234567890"
}
```

**成功响应** (201 Created):

```json
{
  "id": "clxplayer456",
  "name": "李四",
  "studentId": "20210002",
  "jerseyNumber": "7",
  "photo": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "teamId": "clx1234567890",
  "team": {
    "id": "clx1234567890",
    "teamName": "人工智能学院",
    "homeJerseyColor": "蓝色",
    "awayJerseyColor": "白色",
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z"
  },
  "createdAt": "2024-01-15T12:00:00.000Z",
  "updatedAt": "2024-01-15T12:00:00.000Z"
}
```

**错误响应**:

| 状态码 | 说明 |
|--------|------|
| 400 | 参数验证失败 |
| 401 | 未授权 |
| 404 | 球队不存在 |
| 409 | 学号已存在 |

---

#### 6.3.5 更新球员

**接口名称**: 更新球员信息  
**请求 URL**: `/api/v1/players/:id`  
**HTTP 方法**: `PATCH`  
**需要认证**: 是

**Path 参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | string | 是 | 球员ID |

**请求参数**: 所有字段均为可选

**请求示例**:

```json
{
  "name": "李四更新",
  "jerseyNumber": "11"
}
```

**成功响应** (200 OK):

```json
{
  "id": "clxplayer456",
  "name": "李四更新",
  "studentId": "20210002",
  "jerseyNumber": "11",
  "photo": "data:image/png;base64,...",
  "teamId": "clx1234567890",
  "team": {
    "id": "clx1234567890",
    "teamName": "人工智能学院",
    "homeJerseyColor": "蓝色",
    "awayJerseyColor": "白色",
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z"
  },
  "createdAt": "2024-01-15T12:00:00.000Z",
  "updatedAt": "2024-01-15T13:00:00.000Z"
}
```

**错误响应**:

| 状态码 | 说明 |
|--------|------|
| 400 | 参数验证失败 |
| 401 | 未授权 |
| 404 | 球员不存在或球队不存在 |

---

#### 6.3.6 删除球员

**接口名称**: 删除球员  
**请求 URL**: `/api/v1/players/:id`  
**HTTP 方法**: `DELETE`  
**需要认证**: 是

**Path 参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | string | 是 | 球员ID |

**请求示例**:

```http
DELETE /api/v1/players/clxplayer456
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**成功响应** (200 OK):

```json
{
  "id": "clxplayer456",
  "name": "李四更新",
  "studentId": "20210002",
  "jerseyNumber": "11",
  "photo": "data:image/png;base64,...",
  "teamId": "clx1234567890",
  "createdAt": "2024-01-15T12:00:00.000Z",
  "updatedAt": "2024-01-15T13:00:00.000Z"
}
```

**错误响应**:

| 状态码 | 说明 |
|--------|------|
| 401 | 未授权 |
| 404 | 球员不存在 |

---

### 6.4 比赛接口 (Matches)

#### 6.4.1 获取比赛列表

**接口名称**: 获取比赛列表  
**请求 URL**: `/api/v1/matches`  
**HTTP 方法**: `GET`  
**需要认证**: 否

**Query 参数**:

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| page | number | 否 | 1 | 页码 |
| limit | number | 否 | 10 | 每页数量 |
| teamId | string | 否 | - | 按球队ID筛选（主队或客队） |

**请求示例**:

```http
GET /api/v1/matches?page=1&limit=10&teamId=clx1234567890
```

**成功响应** (200 OK):

```json
{
  "data": [
    {
      "id": "clxmatch123",
      "homeTeamId": "clx1234567890",
      "awayTeamId": "clx9876543210",
      "homeTeam": {
        "id": "clx1234567890",
        "teamName": "人工智能学院",
        "homeJerseyColor": "蓝色",
        "awayJerseyColor": "白色",
        "createdAt": "2024-01-15T10:00:00.000Z",
        "updatedAt": "2024-01-15T10:00:00.000Z"
      },
      "awayTeam": {
        "id": "clx9876543210",
        "teamName": "计算机学院",
        "homeJerseyColor": "红色",
        "awayJerseyColor": "白色",
        "createdAt": "2024-01-15T10:00:00.000Z",
        "updatedAt": "2024-01-15T10:00:00.000Z"
      },
      "homeScore": 2,
      "awayScore": 1,
      "matchDate": "2024-01-20T14:00:00.000Z",
      "location": "学校足球场",
      "status": "scheduled",
      "createdAt": "2024-01-15T10:00:00.000Z",
      "updatedAt": "2024-01-15T10:00:00.000Z"
    }
  ],
  "total": 15,
  "page": 1,
  "limit": 10
}
```

---

#### 6.4.2 获取单个比赛

**接口名称**: 获取单个比赛详情  
**请求 URL**: `/api/v1/matches/:id`  
**HTTP 方法**: `GET`  
**需要认证**: 否

**Path 参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | string | 是 | 比赛ID |

**请求示例**:

```http
GET /api/v1/matches/clxmatch123
```

**成功响应** (200 OK):

```json
{
  "id": "clxmatch123",
  "homeTeamId": "clx1234567890",
  "awayTeamId": "clx9876543210",
  "homeTeam": {
    "id": "clx1234567890",
    "teamName": "人工智能学院",
    "teamDoctor": "张正扬",
    "headCoach": "谢子腾",
    "teamLeader": "罗圳城",
    "coachPhone": "13913913913",
    "leaderPhone": "13513513513",
    "homeJerseyColor": "蓝色",
    "awayJerseyColor": "白色",
    "teamLogo": "data:image/png;base64,...",
    "homeJersey": "data:image/png;base64,...",
    "awayJersey": "data:image/png;base64,...",
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z"
  },
  "awayTeam": {
    "id": "clx9876543210",
    "teamName": "计算机学院",
    "teamDoctor": "李医生",
    "headCoach": "王教练",
    "teamLeader": "张队长",
    "coachPhone": "13800138000",
    "leaderPhone": "13900139000",
    "homeJerseyColor": "红色",
    "awayJerseyColor": "白色",
    "teamLogo": "data:image/png;base64,...",
    "homeJersey": "data:image/png;base64,...",
    "awayJersey": "data:image/png;base64,...",
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z"
  },
  "homeScore": 2,
  "awayScore": 1,
  "matchDate": "2024-01-20T14:00:00.000Z",
  "location": "学校足球场",
  "status": "scheduled",
  "createdAt": "2024-01-15T10:00:00.000Z",
  "updatedAt": "2024-01-15T10:00:00.000Z"
}
```

**错误响应**:

| 状态码 | 说明 |
|--------|------|
| 404 | 比赛不存在 |

---

#### 6.4.3 创建比赛

**接口名称**: 创建比赛  
**请求 URL**: `/api/v1/matches`  
**HTTP 方法**: `POST`  
**需要认证**: 是

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 | 验证规则 |
|--------|------|------|------|----------|
| homeTeamId | string | 是 | 主队ID | 必须存在 |
| awayTeamId | string | 是 | 客队ID | 必须存在 |
| homeScore | number | 否 | 主队比分 | 默认0 |
| awayScore | number | 否 | 客队比分 | 默认0 |
| matchDate | string | 是 | 比赛日期时间 | ISO 8601格式 |
| location | string | 是 | 比赛地点 | 最大100字符 |
| status | string | 否 | 比赛状态 | 默认'scheduled' |

**请求示例**:

```json
{
  "homeTeamId": "clx1234567890",
  "awayTeamId": "clx9876543210",
  "homeScore": 0,
  "awayScore": 0,
  "matchDate": "2024-01-20T14:00:00.000Z",
  "location": "学校足球场",
  "status": "scheduled"
}
```

**成功响应** (201 Created):

```json
{
  "id": "clxmatch123",
  "homeTeamId": "clx1234567890",
  "awayTeamId": "clx9876543210",
  "homeTeam": {
    "id": "clx1234567890",
    "teamName": "人工智能学院",
    "homeJerseyColor": "蓝色",
    "awayJerseyColor": "白色",
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z"
  },
  "awayTeam": {
    "id": "clx9876543210",
    "teamName": "计算机学院",
    "homeJerseyColor": "红色",
    "awayJerseyColor": "白色",
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z"
  },
  "homeScore": 0,
  "awayScore": 0,
  "matchDate": "2024-01-20T14:00:00.000Z",
  "location": "学校足球场",
  "status": "scheduled",
  "createdAt": "2024-01-15T10:00:00.000Z",
  "updatedAt": "2024-01-15T10:00:00.000Z"
}
```

**错误响应**:

| 状态码 | 说明 |
|--------|------|
| 400 | 参数验证失败 |
| 401 | 未授权 |
| 404 | 主队或客队不存在 |

---

#### 6.4.4 更新比赛

**接口名称**: 更新比赛信息  
**请求 URL**: `/api/v1/matches/:id`  
**HTTP 方法**: `PATCH`  
**需要认证**: 是

**Path 参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | string | 是 | 比赛ID |

**请求参数**: 所有字段均为可选

**请求示例**:

```json
{
  "homeScore": 3,
  "awayScore": 2,
  "status": "finished"
}
```

**成功响应** (200 OK):

```json
{
  "id": "clxmatch123",
  "homeTeamId": "clx1234567890",
  "awayTeamId": "clx9876543210",
  "homeTeam": {
    "id": "clx1234567890",
    "teamName": "人工智能学院",
    "homeJerseyColor": "蓝色",
    "awayJerseyColor": "白色",
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z"
  },
  "awayTeam": {
    "id": "clx9876543210",
    "teamName": "计算机学院",
    "homeJerseyColor": "红色",
    "awayJerseyColor": "白色",
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z"
  },
  "homeScore": 3,
  "awayScore": 2,
  "matchDate": "2024-01-20T14:00:00.000Z",
  "location": "学校足球场",
  "status": "finished",
  "createdAt": "2024-01-15T10:00:00.000Z",
  "updatedAt": "2024-01-20T16:00:00.000Z"
}
```

**错误响应**:

| 状态码 | 说明 |
|--------|------|
| 400 | 参数验证失败 |
| 401 | 未授权 |
| 404 | 比赛不存在或球队不存在 |

---

#### 6.4.5 删除比赛

**接口名称**: 删除比赛  
**请求 URL**: `/api/v1/matches/:id`  
**HTTP 方法**: `DELETE`  
**需要认证**: 是

**Path 参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | string | 是 | 比赛ID |

**请求示例**:

```http
DELETE /api/v1/matches/clxmatch123
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**成功响应** (200 OK):

```json
{
  "id": "clxmatch123",
  "homeTeamId": "clx1234567890",
  "awayTeamId": "clx9876543210",
  "homeScore": 3,
  "awayScore": 2,
  "matchDate": "2024-01-20T14:00:00.000Z",
  "location": "学校足球场",
  "status": "finished",
  "createdAt": "2024-01-15T10:00:00.000Z",
  "updatedAt": "2024-01-20T16:00:00.000Z"
}
```

**错误响应**:

| 状态码 | 说明 |
|--------|------|
| 401 | 未授权 |
| 404 | 比赛不存在 |

---

### 6.5 数据导入接口 (Import)

#### 6.5.1 从JSON导入数据

**接口名称**: 从JSON文件导入球队和球员数据  
**请求 URL**: `/api/v1/import/json`  
**HTTP 方法**: `POST`  
**需要认证**: 是

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| filePath | string | 是 | JSON文件路径（服务器端） |

**请求示例**:

```json
{
  "filePath": "/data/teams.json"
}
```

**成功响应** (200 OK):

```json
{
  "message": "导入完成",
  "result": {
    "teams": 10,
    "players": 150
  }
}
```

**错误响应**:

| 状态码 | 说明 |
|--------|------|
| 400 | 文件路径无效或文件格式错误 |
| 401 | 未授权 |
| 500 | 服务器内部错误 |

---

## 7. 错误码说明

### 7.1 HTTP 状态码

| 状态码 | 说明 | 常见原因 |
|--------|------|----------|
| 200 | OK - 请求成功 | GET、PATCH、DELETE 成功 |
| 201 | Created - 资源创建成功 | POST 成功 |
| 400 | Bad Request - 请求参数错误 | 参数验证失败、格式错误 |
| 401 | Unauthorized - 未授权 | 缺少Token、Token无效或过期 |
| 404 | Not Found - 资源不存在 | ID对应的资源不存在 |
| 409 | Conflict - 资源冲突 | 唯一性约束冲突（用户名、球队名、学号等） |
| 500 | Internal Server Error - 服务器内部错误 | 服务器异常、数据库错误 |

### 7.2 业务错误码

| 错误信息 | 说明 | 解决方案 |
|----------|------|----------|
| 用户名或密码错误 | 登录时用户名或密码不正确 | 检查用户名和密码 |
| 球队不存在 | 操作的球队ID不存在 | 检查球队ID是否正确 |
| 球员不存在 | 操作的球员ID不存在 | 检查球员ID是否正确 |
| 比赛不存在 | 操作的比赛ID不存在 | 检查比赛ID是否正确 |
| 主队不存在 | 创建比赛时主队ID无效 | 检查主队ID是否正确 |
| 客队不存在 | 创建比赛时客队ID无效 | 检查客队ID是否正确 |

### 7.3 验证错误示例

```json
{
  "statusCode": 400,
  "message": [
    "teamName must be a string",
    "homeJerseyColor should not be empty"
  ],
  "error": "Bad Request"
}
```

---

## 8. 接口调用示例

### 8.1 JavaScript/TypeScript (Axios)

#### 安装依赖

```bash
npm install axios
```

#### 基础配置

```typescript
import axios from 'axios';

const API_BASE_URL = 'https://sztufa-server.vercel.app/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器 - 添加Token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器 - 处理错误
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token过期，跳转到登录页
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

#### 认证示例

```typescript
// 用户登录
async function login(username: string, password: string) {
  try {
    const response = await apiClient.post('/auth/login', {
      username,
      password,
    });
    const { user, token } = response.data;
    localStorage.setItem('token', token);
    return user;
  } catch (error) {
    console.error('登录失败:', error.response?.data);
    throw error;
  }
}

// 用户注册
async function register(username: string, password: string, role?: string) {
  try {
    const response = await apiClient.post('/auth/register', {
      username,
      password,
      role,
    });
    const { user, token } = response.data;
    localStorage.setItem('token', token);
    return user;
  } catch (error) {
    console.error('注册失败:', error.response?.data);
    throw error;
  }
}
```

#### 球队管理示例

```typescript
// 获取球队列表
async function getTeams(page: number = 1, limit: number = 10) {
  try {
    const response = await apiClient.get('/teams', {
      params: { page, limit },
    });
    return response.data;
  } catch (error) {
    console.error('获取球队列表失败:', error.response?.data);
    throw error;
  }
}

// 搜索球队
async function searchTeams(name: string) {
  try {
    const response = await apiClient.get('/teams/search', {
      params: { name },
    });
    return response.data;
  } catch (error) {
    console.error('搜索球队失败:', error.response?.data);
    throw error;
  }
}

// 获取单个球队
async function getTeam(id: string) {
  try {
    const response = await apiClient.get(`/teams/${id}`);
    return response.data;
  } catch (error) {
    console.error('获取球队详情失败:', error.response?.data);
    throw error;
  }
}

// 创建球队
async function createTeam(teamData: any) {
  try {
    const response = await apiClient.post('/teams', teamData);
    return response.data;
  } catch (error) {
    console.error('创建球队失败:', error.response?.data);
    throw error;
  }
}

// 更新球队
async function updateTeam(id: string, teamData: any) {
  try {
    const response = await apiClient.patch(`/teams/${id}`, teamData);
    return response.data;
  } catch (error) {
    console.error('更新球队失败:', error.response?.data);
    throw error;
  }
}

// 删除球队
async function deleteTeam(id: string) {
  try {
    const response = await apiClient.delete(`/teams/${id}`);
    return response.data;
  } catch (error) {
    console.error('删除球队失败:', error.response?.data);
    throw error;
  }
}
```

#### 球员管理示例

```typescript
// 获取球员列表
async function getPlayers(teamId?: string, page: number = 1, limit: number = 10) {
  try {
    const response = await apiClient.get('/players', {
      params: { teamId, page, limit },
    });
    return response.data;
  } catch (error) {
    console.error('获取球员列表失败:', error.response?.data);
    throw error;
  }
}

// 创建球员
async function createPlayer(playerData: any) {
  try {
    const response = await apiClient.post('/players', playerData);
    return response.data;
  } catch (error) {
    console.error('创建球员失败:', error.response?.data);
    throw error;
  }
}
```

#### 比赛管理示例

```typescript
// 获取比赛列表
async function getMatches(teamId?: string, page: number = 1, limit: number = 10) {
  try {
    const response = await apiClient.get('/matches', {
      params: { teamId, page, limit },
    });
    return response.data;
  } catch (error) {
    console.error('获取比赛列表失败:', error.response?.data);
    throw error;
  }
}

// 创建比赛
async function createMatch(matchData: any) {
  try {
    const response = await apiClient.post('/matches', matchData);
    return response.data;
  } catch (error) {
    console.error('创建比赛失败:', error.response?.data);
    throw error;
  }
}

// 更新比赛结果
async function updateMatchResult(id: string, homeScore: number, awayScore: number) {
  try {
    const response = await apiClient.patch(`/matches/${id}`, {
      homeScore,
      awayScore,
      status: 'finished',
    });
    return response.data;
  } catch (error) {
    console.error('更新比赛结果失败:', error.response?.data);
    throw error;
  }
}
```

### 8.2 React Hooks 示例

```typescript
import { useState, useEffect } from 'react';
import apiClient from './apiClient';

// 获取球队列表 Hook
function useTeams(page: number = 1, limit: number = 10) {
  const [teams, setTeams] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get('/teams', {
          params: { page, limit },
        });
        setTeams(response.data.data);
        setTotal(response.data.total);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, [page, limit]);

  return { teams, total, loading, error };
}

// 使用示例
function TeamList() {
  const [page, setPage] = useState(1);
  const { teams, total, loading, error } = useTeams(page, 10);

  if (loading) return <div>加载中...</div>;
  if (error) return <div>错误: {error.message}</div>;

  return (
    <div>
      {teams.map((team) => (
        <div key={team.id}>{team.teamName}</div>
      ))}
      <button onClick={() => setPage(page + 1)}>下一页</button>
    </div>
  );
}
```

### 8.3 文件上传示例（Base64编码）

```typescript
// 将图片文件转换为Base64
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}

// 上传球队Logo
async function uploadTeamLogo(teamId: string, file: File) {
  try {
    const base64 = await fileToBase64(file);
    const response = await apiClient.patch(`/teams/${teamId}`, {
      teamLogo: base64,
    });
    return response.data;
  } catch (error) {
    console.error('上传Logo失败:', error.response?.data);
    throw error;
  }
}

// 使用示例
async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
  const file = event.target.files?.[0];
  if (file) {
    await uploadTeamLogo('clx1234567890', file);
  }
}
```

---

## 9. 接口版本控制策略

### 9.1 版本控制方式

本API采用 **URL路径版本控制** 方式：

```
/api/v1/teams
/api/v2/teams (未来版本)
```

### 9.2 版本更新策略

#### 主版本更新 (v1 → v2)

当出现以下情况时，会发布新的主版本：

- **破坏性变更**: 接口签名、响应格式发生不兼容的变化
- **架构重构**: 整体架构发生重大调整
- **认证机制变更**: 认证方式发生根本性变化

#### 次版本更新 (v1.1 → v1.2)

当出现以下情况时，会在当前主版本内进行次版本更新：

- **新增接口**: 添加新的API端点
- **新增字段**: 响应中添加新字段（向后兼容）
- **功能增强**: 现有接口增加可选参数

#### 补丁更新 (v1.1.1 → v1.1.2)

当出现以下情况时，会发布补丁版本：

- **Bug修复**: 修复接口错误
- **性能优化**: 优化接口性能
- **文档更新**: 更新API文档

### 9.3 版本生命周期

| 阶段 | 时长 | 说明 |
|------|------|------|
| 当前版本 | 活跃开发 | 最新稳定版本，持续维护 |
| 旧版本支持 | 6个月 | 提供安全更新和关键Bug修复 |
| 废弃版本 | - | 不再提供支持，建议迁移到新版本 |

### 9.4 版本迁移指南

当发布新主版本时，会提供详细的迁移指南，包括：

- 新旧接口对比
- 迁移步骤说明
- 兼容性注意事项
- 示例代码更新

---

## 10. 前后端协作流程

### 10.1 开发流程

```
┌─────────────────────────────────────────────────────────────┐
│                        开发流程                              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
         ┌─────────────────────────────────────┐
         │  1. 需求分析                          │
         │  - 明确功能需求                        │
         │  - 确定接口设计                        │
         └─────────────────────────────────────┘
                              │
                              ▼
         ┌─────────────────────────────────────┐
         │  2. 接口设计                          │
         │  - 定义请求/响应格式                   │
         │  - 编写API文档                        │
         │  - 前后端评审                         │
         └─────────────────────────────────────┘
                              │
                              ▼
         ┌─────────────────────────────────────┐
         │  3. 并行开发                          │
         │  - 后端：实现接口逻辑                  │
         │  - 前端：Mock数据开发界面              │
         └─────────────────────────────────────┘
                              │
                              ▼
         ┌─────────────────────────────────────┐
         │  4. 接口联调                          │
         │  - 前端对接真实接口                    │
         │  - 问题反馈与修复                      │
         └─────────────────────────────────────┘
                              │
                              ▼
         ┌─────────────────────────────────────┐
         │  5. 测试与上线                        │
         │  - 集成测试                           │
         │  - 性能测试                           │
         │  - 部署上线                           │
         └─────────────────────────────────────┘
```

### 10.2 接口变更流程

#### 新增接口

1. 后端设计接口并实现
2. 更新API文档
3. 通知前端团队
4. 前端对接测试

#### 修改接口

1. **向后兼容的修改**：
   - 添加可选参数
   - 响应中添加新字段
   - 直接更新，通知前端

2. **破坏性修改**：
   - 提前通知前端团队
   - 提供迁移时间窗口
   - 发布新版本接口
   - 旧版本标记为废弃
   - 前端完成迁移后下线旧版本

### 10.3 问题反馈流程

```
┌─────────────────────────────────────────────────────────────┐
│                     问题反馈流程                              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
         ┌─────────────────────────────────────┐
         │  1. 前端发现问题                      │
         │  - 记录问题描述                        │
         │  - 收集请求/响应数据                   │
         │  - 截图或录屏                         │
         └─────────────────────────────────────┘
                              │
                              ▼
         ┌─────────────────────────────────────┐
         │  2. 提交Issue                         │
         │  - 标题：[API] 简短描述               │
         │  - 内容：详细描述、复现步骤、期望结果    │
         │  - 附件：请求/响应数据、截图            │
         └─────────────────────────────────────┘
                              │
                              ▼
         ┌─────────────────────────────────────┐
         │  3. 后端处理                          │
         │  - 确认问题                           │
         │  - 分析原因                           │
         │  - 修复或说明                         │
         └─────────────────────────────────────┘
                              │
                              ▼
         ┌─────────────────────────────────────┐
         │  4. 验证与关闭                        │
         │  - 前端验证修复                        │
         │  - 确认后关闭Issue                    │
         └─────────────────────────────────────┘
```

### 10.4 联调环境

| 环境 | 地址 | 用途 |
|------|------|------|
| 开发环境 | `https://sztufa-server.vercel.app/api/v1` | 本地开发调试 |
| 测试环境 | `https://test-api.example.com/api/v1` | 集成测试 |
| 生产环境 | `https://api.example.com/api/v1` | 正式上线 |

### 10.5 沟通渠道

- **技术文档**: 本API文档
- **在线文档**: Swagger UI (`/api/docs`)
- **问题反馈**: GitHub Issues
- **即时沟通**: 项目群组/Slack

### 10.6 最佳实践

#### 前端开发建议

1. **统一封装API请求**
   - 使用统一的HTTP客户端
   - 封装请求拦截器（添加Token）
   - 封装响应拦截器（统一错误处理）

2. **错误处理**
   - 捕获所有API错误
   - 友好的错误提示
   - 401错误自动跳转登录

3. **数据缓存**
   - 合理使用缓存减少请求
   - 注意缓存失效策略

4. **Loading状态**
   - 请求时显示Loading
   - 避免重复请求

#### 后端开发建议

1. **接口设计**
   - RESTful风格
   - 统一的响应格式
   - 清晰的错误信息

2. **性能优化**
   - 合理使用分页
   - 避免N+1查询
   - 添加必要的索引

3. **安全性**
   - 输入验证
   - 权限控制
   - SQL注入防护

---

## 附录

### A. Postman 集合

可导入Postman集合快速测试API：

```json
{
  "info": {
    "name": "校园足球信息管理平台 API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "认证",
      "item": [
        {
          "name": "用户注册",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"username\": \"testuser\",\n  \"password\": \"password123\"\n}"
            },
            "url": {
              "raw": "{{base_url}}/auth/register",
              "host": ["{{base_url}}"],
              "path": ["auth", "register"]
            }
          }
        },
        {
          "name": "用户登录",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"username\": \"testuser\",\n  \"password\": \"password123\"\n}"
            },
            "url": {
              "raw": "{{base_url}}/auth/login",
              "host": ["{{base_url}}"],
              "path": ["auth", "login"]
            }
          }
        }
      ]
    }
  ],
  "variable": [
    {
      "key": "base_url",
      "value": "https://sztufa-server.vercel.app/api/v1"
    },
    {
      "key": "token",
      "value": ""
    }
  ]
}
```

### B. 常见问题 (FAQ)

**Q1: Token过期了怎么办？**

A: Token过期后需要重新调用登录接口获取新Token。建议在响应拦截器中处理401错误，自动跳转到登录页面。

**Q2: 如何上传图片？**

A: 图片需要转换为Base64编码后上传。可以使用FileReader API