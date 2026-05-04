import { useState, useEffect, useCallback } from 'react';
import {
  List,
  Datagrid,
  TextField,
  DateField,
  NumberField,
  FunctionField,
  Edit,
  SimpleForm,
  SelectInput,
  TextInput,
  NumberInput,
  EditButton,
  FilterButton,
  TopToolbar,
  BulkDeleteButton,
  BulkUpdateButton,
  useRecordContext,
  useUpdate,
  useNotify,
  useRefresh,
  useListFilterContext,
  useListContext,
} from 'react-admin';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import MenuItem from '@mui/material/MenuItem';
import MuiSelect from '@mui/material/Select';
import MuiTextField from '@mui/material/TextField';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import PauseCircleIcon from '@mui/icons-material/PauseCircle';
import MoreVertIcon from '@mui/icons-material/MoreVert';

import { getAuthKey } from '../providers/authProvider';

/** 状态颜色映射 */
const STATUS_COLORS: Record<string, 'success' | 'info' | 'warning' | 'error' | 'default' | 'primary' | 'secondary'> = {
  active: 'success',
  doing: 'info',
  done: 'primary',
  fail: 'error',
  hang: 'warning',
  out_times: 'secondary',
};

/** 状态选项列表 */
const STATUS_CHOICES = [
  { id: 'active', name: 'Active' },
  { id: 'hang', name: 'Hang' },
  { id: 'doing', name: 'Doing' },
  { id: 'done', name: 'Done' },
  { id: 'fail', name: 'Failed' },
  { id: 'out_times', name: 'Out Times' },
];

/** 行内可编辑 Status —— 点击 Chip 展开下拉选择 */
const InlineStatusField = () => {
  const record = useRecordContext();
  const [editing, setEditing] = useState(false);
  const [update] = useUpdate();
  const notify = useNotify();
  const refresh = useRefresh();

  if (!record) return null;
  const status = record.status as string;

  if (!editing) {
    return (
      <Chip
        label={status}
        color={STATUS_COLORS[status] || 'default'}
        size="small"
        variant="outlined"
        onClick={(e) => { e.stopPropagation(); setEditing(true); }}
        sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, cursor: 'pointer' }}
      />
    );
  }

  return (
    <MuiSelect
      value={status}
      size="small"
      open
      onClose={() => setEditing(false)}
      onClick={(e) => e.stopPropagation()}
      onChange={async (e) => {
        const newStatus = e.target.value;
        setEditing(false);
        if (newStatus !== status) {
          try {
            await update('queues', {
              id: record.id,
              data: { status: newStatus, env: record.env },
              previousData: record,
            });
            notify('状态已更新', { type: 'success' });
            refresh();
          } catch {
            notify('更新失败', { type: 'error' });
          }
        }
      }}
      sx={{ minWidth: 100 }}
    >
      {STATUS_CHOICES.map((c) => (
        <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
      ))}
    </MuiSelect>
  );
};

/** 行内可编辑 Errors —— 点击数字展开输入框 */
const InlineErrorsField = () => {
  const record = useRecordContext();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState('');
  const [update] = useUpdate();
  const notify = useNotify();
  const refresh = useRefresh();

  if (!record) return null;
  const errors = record.errorTimes ?? 0;

  if (!editing) {
    return (
      <Typography
        variant="body2"
        component="span"
        onClick={(e) => { e.stopPropagation(); setValue(String(errors)); setEditing(true); }}
        sx={{ cursor: 'pointer', '&:hover': { color: 'primary.main', textDecoration: 'underline' } }}
      >
        {errors}
      </Typography>
    );
  }

  const save = async () => {
    setEditing(false);
    const newVal = parseInt(value, 10);
    if (!isNaN(newVal) && newVal !== errors) {
      try {
        await update('queues', {
          id: record.id,
          data: { errorTimes: newVal, env: record.env },
          previousData: record,
        });
        notify('已更新', { type: 'success' });
        refresh();
      } catch {
        notify('更新失败', { type: 'error' });
      }
    }
  };

  return (
    <ClickAwayListener onClickAway={save}>
      <MuiTextField
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false); }}
        onClick={(e) => e.stopPropagation()}
        size="small"
        type="number"
        autoFocus
        sx={{ width: 70 }}
        slotProps={{ htmlInput: { min: 0 } }}
      />
    </ClickAwayListener>
  );
};

/** JSON 数据渲染 */
const JsonField = ({ source }: { source: string }) => {
  const record = useRecordContext();
  if (!record || !record[source]) return <Typography variant="body2" color="text.secondary">—</Typography>;

  const data = typeof record[source] === 'string'
    ? record[source]
    : JSON.stringify(record[source], null, 2);

  return (
    <Box
      component="pre"
      sx={{
        bgcolor: '#f5f5f5',
        p: 2,
        borderRadius: 1,
        fontSize: '0.8rem',
        overflow: 'auto',
        maxHeight: 300,
        maxWidth: 600,
        m: 0,
        fontFamily: '"JetBrains Mono", "Fira Code", monospace',
      }}
    >
      {data}
    </Box>
  );
};

/** 行展开详情面板 */
const QueueExpandPanel = () => {
  const record = useRecordContext();
  if (!record) return null;

  return (
    <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
            Exec At
          </Typography>
          <Typography variant="body2">{record.execAt || '—'}</Typography>
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
            Priority
          </Typography>
          <Typography variant="body2">{record.priority ?? 0}</Typography>
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
            Error Times
          </Typography>
          <Typography variant="body2">{record.errorTimes ?? 0}</Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {['data', 'config', 'result'].map((field) => (
          <Box key={field}>
            <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1, mb: 0.5, display: 'block' }}>
              {field}
            </Typography>
            <JsonField source={field} />
          </Box>
        ))}
      </Box>
    </Box>
  );
};

/** 调用 Astro Action 的通用工具（筛选组件用） */
async function fetchAction<T = any>(actionName: string, input: Record<string, any> = {}): Promise<T> {
  const authKey = getAuthKey();
  const res = await fetch(`/_actions/${actionName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(authKey ? { 'x-auth-key': authKey } : {}),
    },
    body: JSON.stringify(input),
  });
  const text = await res.text();
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('json+devalue')) {
    const { unflatten } = await import('devalue');
    return unflatten(JSON.parse(text)) as T;
  }
  return JSON.parse(text) as T;
}

/** 动态 Env 下拉筛选 —— 从数据库聚合获取选项 */
const EnvSelectFilter = (props: any) => {
  const [choices, setChoices] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    fetchAction<string[]>('queue.getEnvOptions')
      .then((list) => setChoices(list.map((e) => ({ id: e, name: e }))))
      .catch((err) => console.error('Failed to load env options', err));
  }, []);

  return <SelectInput {...props} choices={choices} />;
};

/** 动态 Type 下拉筛选 —— 受 env 联动，env 变化时自动刷新选项 */
const TypeSelectFilter = (props: any) => {
  const [choices, setChoices] = useState<{ id: string; name: string }[]>([]);
  const { filterValues } = useListFilterContext();
  const currentEnv = filterValues?.env || '';

  useEffect(() => {
    const input: Record<string, any> = {};
    if (currentEnv) input.env = currentEnv;

    fetchAction<string[]>('queue.getTypeOptions', input)
      .then((list) => setChoices(list.map((t) => ({ id: t, name: t }))))
      .catch((err) => console.error('Failed to load type options', err));
  }, [currentEnv]);

  return <SelectInput {...props} choices={choices} />;
};

/** 筛选器 */
const QueueFilters = [
  <EnvSelectFilter source="env" label="Env" alwaysOn key="env" size="small" margin="none" />,
  <TypeSelectFilter source="type" label="Type" alwaysOn key="type" size="small" margin="none" />,
  <SelectInput
    source="status"
    label="Status"
    choices={STATUS_CHOICES}
    key="status"
    alwaysOn
    size="small"
    margin="none"
  />,
  <TextInput
    source="resultKeyword"
    label="Result 关键字"
    key="resultKeyword"
    size="small"
    margin="none"
    resettable
  />,
];
/** 批量操作定义 */
const BULK_ACTIONS = [
  { key: 'setActive', label: '全部设为 Active', icon: <PlayArrowIcon fontSize="small" />, color: 'success' as const },
  { key: 'setDone', label: '全部设为 Done', icon: <DoneAllIcon fontSize="small" />, color: 'primary' as const },
  { key: 'setHang', label: '全部设为 Hang', icon: <PauseCircleIcon fontSize="small" />, color: 'warning' as const },
  { key: 'delete', label: '全部删除', icon: <DeleteSweepIcon fontSize="small" />, color: 'error' as const },
] as const;

/** 按当前筛选条件执行批量操作的组件 */
const FilterBulkActions = () => {
  const { filterValues, total } = useListContext();
  const notify = useNotify();
  const refresh = useRefresh();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<typeof BULK_ACTIONS[number] | null>(null);
  const [matchCount, setMatchCount] = useState<number | null>(null);

  // 检查是否有任何筛选条件
  const hasFilter = filterValues && Object.values(filterValues).some((v) => v !== undefined && v !== '');

  const handleMenuClick = (e: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(e.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleActionClick = async (action: typeof BULK_ACTIONS[number]) => {
    handleMenuClose();
    setPendingAction(action);
    setMatchCount(null);
    setConfirmOpen(true);

    // 获取匹配数量
    try {
      const result = await fetchAction<{ count: number }>('queue.countByFilter', {
        env: filterValues?.env || undefined,
        type: filterValues?.type || undefined,
        status: filterValues?.status || undefined,
        resultKeyword: filterValues?.resultKeyword || undefined,
      });
      setMatchCount(result.count);
    } catch {
      setMatchCount(total ?? 0);
    }
  };

  const handleConfirm = async () => {
    if (!pendingAction) return;
    setLoading(true);

    try {
      const result = await fetchAction<{ affected: number; action: string }>('queue.bulkActionByFilter', {
        env: filterValues?.env || undefined,
        type: filterValues?.type || undefined,
        status: filterValues?.status || undefined,
        resultKeyword: filterValues?.resultKeyword || undefined,
        action: pendingAction.key,
      });
      notify(`操作完成，影响了 ${result.affected} 条记录`, { type: 'success' });
      refresh();
    } catch (err: any) {
      notify(`操作失败: ${err.message || '未知错误'}`, { type: 'error' });
    } finally {
      setLoading(false);
      setConfirmOpen(false);
      setPendingAction(null);
    }
  };

  const handleCancel = () => {
    setConfirmOpen(false);
    setPendingAction(null);
  };

  // 构建筛选条件描述
  const filterDesc = Object.entries(filterValues || {})
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `${k}=${v}`)
    .join(', ');

  return (
    <>
      <Button
        size="small"
        startIcon={<MoreVertIcon />}
        onClick={handleMenuClick}
        disabled={!hasFilter}
        title={!hasFilter ? '请先设置筛选条件' : '按条件批量操作'}
        sx={{ ml: 1 }}
      >
        批量操作
      </Button>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        {BULK_ACTIONS.map((action) => (
          <MenuItem key={action.key} onClick={() => handleActionClick(action)}>
            <ListItemIcon>{action.icon}</ListItemIcon>
            <ListItemText>{action.label}</ListItemText>
          </MenuItem>
        ))}
      </Menu>

      <Dialog open={confirmOpen} onClose={handleCancel} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          确认{pendingAction?.label}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            <Box component="span" sx={{ display: 'block', mb: 1 }}>
              当前筛选条件：<strong>{filterDesc || '无'}</strong>
            </Box>
            <Box component="span" sx={{ display: 'block', mb: 1 }}>
              匹配记录数：{matchCount !== null ? (
                <strong style={{ fontSize: '1.2em' }}>{matchCount.toLocaleString()}</strong>
              ) : (
                <CircularProgress size={16} sx={{ ml: 1, verticalAlign: 'middle' }} />
              )}
            </Box>
            {pendingAction?.key === 'delete' && (
              <Box component="span" sx={{ display: 'block', color: 'error.main', fontWeight: 600, mt: 1 }}>
                ⚠️ 删除操作不可逆，请确认！
              </Box>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancel} disabled={loading}>取消</Button>
          <Button
            onClick={handleConfirm}
            variant="contained"
            color={pendingAction?.color || 'primary'}
            disabled={loading || matchCount === null || matchCount === 0}
            startIcon={loading ? <CircularProgress size={16} /> : pendingAction?.icon}
          >
            {loading ? '执行中...' : `确认（${matchCount?.toLocaleString() ?? '...'} 条）`}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

/** 列表操作栏 */
const QueueListActions = () => (
  <TopToolbar>
    <FilterButton />
    <FilterBulkActions />
  </TopToolbar>
);

/** 批量操作按钮 */
const QueueBulkActions = () => (
  <>
    <BulkUpdateButton
      label="设为 Active"
      data={{ status: 'active' }}
      icon={<></>}
    />
    <BulkUpdateButton
      label="设为 Done"
      data={{ status: 'done' }}
      icon={<></>}
    />
    <BulkDeleteButton />
  </>
);

// ─── Queue List ──────────────────────────────────────────

export const QueueList = () => (
  <List
    filters={QueueFilters}
    actions={<QueueListActions />}
    sort={{ field: 'createdAt', order: 'DESC' }}
    perPage={25}
    sx={{
      '& .RaList-main': { pt: 1 },
      '& .RaList-content': { mt: 1 },
      '& form.MuiToolbar-root': {
        alignItems: 'center',
        gap: 1,
        py: 1.5,
        mb: 1,
      },
    }}
  >
    <Datagrid
      bulkActionButtons={<QueueBulkActions />}
      rowClick="expand"
      expand={<QueueExpandPanel />}
      expandSingle
      sx={{
        '& .RaDatagrid-headerCell': {
          fontWeight: 700,
          textTransform: 'uppercase',
          fontSize: '0.75rem',
          letterSpacing: 1,
          color: 'text.secondary',
          py: 1.5,
        },
        '& .RaDatagrid-rowCell': {
          py: 1.5,
        },
      }}
    >
      <TextField source="id" label="ID" sortable={false} />
      <TextField source="env" label="Env" />
      <TextField source="type" label="Type" />
      <FunctionField label="Status" render={() => <InlineStatusField />} />
      <NumberField source="priority" label="Priority" />
      <FunctionField label="Errors" render={() => <InlineErrorsField />} />
      <DateField source="createdAt" label="Created" showTime />
      <DateField source="updatedAt" label="Updated" showTime />
    </Datagrid>
  </List>
);

// ─── Queue Edit ──────────────────────────────────────────

export const QueueEdit = () => (
  <Edit>
    <SimpleForm>
      <TextInput source="id" label="ID" disabled />
      <TextInput source="env" label="Env" disabled />
      <TextInput source="type" label="Type" disabled />
      <SelectInput source="status" label="Status" choices={STATUS_CHOICES} />
      <NumberInput source="errorTimes" label="Error Times" />
      <TextInput source="result" label="Result" multiline fullWidth />
    </SimpleForm>
  </Edit>
);
