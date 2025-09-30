import type { APIRoute } from 'astro';
import { SignJWT } from 'jose';

// 使用 TextEncoder 来编码我们的密钥
const secret = new TextEncoder().encode(import.meta.env.JWT_SECRET);
const uname = import.meta.env.AUTH_USERNAME;
const upass = import.meta.env.AUTH_PASSWORD;

export const POST: APIRoute = async ({ request, redirect }) => {
  const formData = await request.formData();

  const username = formData.get('username')?.toString();

  const password = formData.get('password')?.toString();

  if (username !== uname || password !== upass) {
    return redirect('/login?error=true', 307);
  }

  // 认证成功, 创建 JWT
  const jwt = await new SignJWT({ username: username, isAdmin: true }) // payload
    .setProtectedHeader({ alg: 'HS256' }) // 算法
    .setIssuedAt() // 签发时间
    .setExpirationTime('2h') // 过期时间
    .sign(secret); // 签名

  // 将 JWT 设置到 Cookie 中
  const response = redirect('/', 307); // 使用 307 (Temporary Redirect) 来保留 POST 方法，不过这里重定向到 GET 页面没影响
  response.headers.set(
    'Set-Cookie',
    `auth_session=${jwt}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${2 * 60 * 60}`, // 2小时有效期
  );

  return response;
};
