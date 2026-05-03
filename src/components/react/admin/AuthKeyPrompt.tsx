import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Avatar from '@mui/material/Avatar';
import Alert from '@mui/material/Alert';

import { setAuthKey } from './providers/authProvider';

interface AuthKeyPromptProps {
  onAuthenticated: () => void;
}

/**
 * Auth Key 输入界面
 * 当 localStorage 中没有 auth key 时展示
 */
export function AuthKeyPrompt({ onAuthenticated }: AuthKeyPromptProps) {
  const [key, setKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!key.trim()) {
      setError('请输入 Auth Key');
      return;
    }

    setLoading(true);

    try {
      // 用标准 REST 端点验证 key，避免 Astro Actions devalue 格式问题
      const res = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authKey: key.trim() }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || 'Auth key 无效');
      }

      // 验证通过，保存 key
      setAuthKey(key.trim());
      onAuthenticated();
    } catch (err: any) {
      setError(err.message || '认证失败，请检查 Auth Key');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #e8eaf6 0%, #f5f5f5 50%, #e8eaf6 100%)',
      }}
    >
      <Card
        sx={{
          maxWidth: 420,
          width: '100%',
          mx: 2,
          border: '1px solid rgba(92, 107, 192, 0.2)',
          boxShadow: '0 8px 32px rgba(92, 107, 192, 0.12)',
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              mb: 3,
            }}
          >
            <Avatar
              sx={{
                width: 56,
                height: 56,
                mb: 2,
                background: 'linear-gradient(135deg, #5c6bc0, #26a69a)',
              }}
            >
              <LockOutlinedIcon sx={{ fontSize: 28 }} />
            </Avatar>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                background: 'linear-gradient(135deg, #5c6bc0, #26a69a)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              QMS Admin
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 0.5 }}
            >
              请输入管理密钥以继续
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              type="password"
              label="Auth Key"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              variant="outlined"
              autoFocus
              sx={{ mb: 3 }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{
                py: 1.5,
                background: 'linear-gradient(135deg, #5c6bc0, #3949ab)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #3949ab, #5c6bc0)',
                },
              }}
            >
              {loading ? '验证中...' : '进入管理后台'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
