import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ redirect, cookies }) => {
  // 删除会话 cookie
  cookies.delete('auth_session', {
    path: '/',
  });
  // 重定向到登录页面
  return redirect('/login');
};
