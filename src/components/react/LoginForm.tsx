import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

// 定义组件接收的 props 类型
interface LoginFormProps {
  error?: string;
}

export default function LoginForm({ error }: LoginFormProps) {
  return (
    <Card sx={{ minWidth: 360, margin: 'auto' }}>
      <CardContent>
        <Typography
          variant="h5"
          component="div"
          sx={{ mb: 2, textAlign: 'center' }}
        >
          Please Login
        </Typography>

        {/* 如果有错误信息，则显示 Alert 组件 */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Error occurred during login
          </Alert>
        )}

        <form method="POST" action="/api/auth/login">
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              id="username"
              name="username" // name 属性对于表单提交至关重要
              label="Username"
              variant="outlined"
              required
              fullWidth
            />
            <TextField
              id="password"
              name="password" // name 属性对于表单提交至关重要
              label="Password"
              type="password"
              variant="outlined"
              required
              fullWidth
            />
            <Button
              type="submit" // 确保按钮类型是 "submit"
              variant="contained"
              size="large"
              fullWidth
            >
              Sign In
            </Button>
          </Box>
        </form>
      </CardContent>
    </Card>
  );
}
