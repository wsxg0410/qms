import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import ReplayIcon from '@mui/icons-material/Replay';

import { fetchAction } from './utils/fetchAction';

/** 状态配色映射 */
const STATUS_CONFIG: Record<
  string,
  { color: string; icon: React.ReactNode; label: string }
> = {
  active: {
    color: '#69f0ae',
    icon: <PlayArrowIcon />,
    label: 'Active',
  },
  doing: {
    color: '#40c4ff',
    icon: <HourglassEmptyIcon />,
    label: 'Doing',
  },
  done: {
    color: '#7c4dff',
    icon: <CheckCircleIcon />,
    label: 'Done',
  },
  fail: {
    color: '#ff5252',
    icon: <ErrorIcon />,
    label: 'Failed',
  },
  hang: {
    color: '#ffab40',
    icon: <PauseIcon />,
    label: 'Hang',
  },
  out_times: {
    color: '#ff6e40',
    icon: <ReplayIcon />,
    label: 'Out Times',
  },
};

interface StatsItem {
  status: string;
  count: number;
}

export function Dashboard() {
  const [stats, setStats] = useState<StatsItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const data = await fetchAction<StatsItem[]>('queue.getStats', {});
      setStats(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Failed to load stats', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const totalCount = stats.reduce((sum, s) => sum + s.count, 0);

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 800,
            background: 'linear-gradient(135deg, #5c6bc0, #26a69a)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Dashboard
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          队列管理系统总览
        </Typography>
      </Box>

      {/* Stats Cards */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Total */}
          <Card
            sx={{
              mb: 3,
              background: 'linear-gradient(135deg, #e8eaf6 0%, #f5f5f5 100%)',
              border: '1px solid rgba(92, 107, 192, 0.2)',
            }}
          >
            <CardContent sx={{ py: 3, textAlign: 'center' }}>
              <Typography variant="h2" sx={{ fontWeight: 800, color: '#5c6bc0' }}>
                {totalCount.toLocaleString()}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                总任务数
              </Typography>
            </CardContent>
          </Card>

          {/* Per-status cards */}
          <Grid container spacing={2}>
            {Object.entries(STATUS_CONFIG).map(([status, config]) => {
              const item = stats.find((s) => s.status === status);
              const count = item?.count || 0;

              return (
                <Grid size={{ xs: 6, sm: 4, md: 2 }} key={status}>
                  <Card
                    sx={{
                      height: '100%',
                      border: `1px solid ${config.color}22`,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        border: `1px solid ${config.color}55`,
                        transform: 'translateY(-2px)',
                        boxShadow: `0 4px 20px ${config.color}22`,
                      },
                    }}
                  >
                    <CardContent sx={{ textAlign: 'center', py: 3 }}>
                      <Box
                        sx={{
                          color: config.color,
                          mb: 1,
                          '& .MuiSvgIcon-root': { fontSize: 32 },
                        }}
                      >
                        {config.icon}
                      </Box>
                      <Typography
                        variant="h4"
                        sx={{ fontWeight: 700, color: config.color }}
                      >
                        {count.toLocaleString()}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ textTransform: 'uppercase', letterSpacing: 1 }}
                      >
                        {config.label}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </>
      )}
    </Box>
  );
}
