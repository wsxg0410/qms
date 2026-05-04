import { useState, useEffect } from 'react';
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
} from 'react-admin';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import MenuItem from '@mui/material/MenuItem';
import MuiSelect from '@mui/material/Select';
import MuiTextField from '@mui/material/TextField';
import ClickAwayListener from '@mui/material/ClickAwayListener';

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

/** 列表操作栏 */
const QueueListActions = () => (
  <TopToolbar>
    <FilterButton />
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
