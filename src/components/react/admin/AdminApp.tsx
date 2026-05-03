import { useState, useEffect } from 'react';
import { Admin, Resource } from 'react-admin';
import QueueIcon from '@mui/icons-material/Queue';

import { QueueList, QueueEdit } from './resources/QueueResource';
import { dataProvider } from './providers/dataProvider';
import { hasAuthKey } from './providers/authProvider';
import { i18nProvider } from './providers/i18nProvider';
import { adminTheme } from './theme';
import { Dashboard } from './Dashboard';
import { AuthKeyPrompt } from './AuthKeyPrompt';

export default function AdminApp() {
  const [authenticated, setAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    setAuthenticated(hasAuthKey());
    setChecking(false);
  }, []);

  if (checking) {
    return null;
  }

  if (!authenticated) {
    return <AuthKeyPrompt onAuthenticated={() => setAuthenticated(true)} />;
  }

  return (
    <Admin
      dataProvider={dataProvider}
      i18nProvider={i18nProvider}
      theme={adminTheme}
      dashboard={Dashboard}
    >
      <Resource
        name="queues"
        list={QueueList}
        edit={QueueEdit}
        icon={QueueIcon}
        options={{ label: '队列任务' }}
      />
    </Admin>
  );
}
