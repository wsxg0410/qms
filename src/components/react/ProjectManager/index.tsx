import React, { useEffect, useState } from 'react';
import useSWR from 'swr';
import useSWRMutation from 'swr/mutation';
import { addProject, getProjects } from '@/datasource/project';
import { useStore } from '@nanostores/react';

import { Button, Popover, TextField, Alert } from '@mui/material';
import { UnfoldMore } from '@mui/icons-material';
import { getLs, setLs } from '@/lib/storage';
import { $currentProjectName } from '@/store';

export const getCurrentProjectName = () => {
  return getLs(`current_project_name`, undefined);
};

export const setCurrentProjectName = (projectName: string) => {
  setLs(`current_project_name`, projectName);
};

interface IProps {
  onChange?: (projectName: string) => void;
}

export const ProjectManager: React.FC<IProps> = ({ onChange }) => {
  const anchorRef = React.useRef<HTMLDivElement>(null);
  const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

  const currentProjectName = useStore($currentProjectName);

  // Use SWR to fetch projects from the API route
  const { data, error } = useSWR('/api/projects', getProjects);

  const { trigger, isMutating } = useSWRMutation(
    '/api/projects',
    (url, { arg }: { arg: { name: string } }) => addProject(arg.name),
    {
      onSuccess() {
        setNewProjectName('');
        setIsAdding(false);
      },
    },
  );

  const projects = data || [];

  const open = Boolean(anchorEl);
  const id = open ? 'simple-popover' : undefined;

  const handleSwitchProject = (pn: string) => {
    $currentProjectName.set(pn);
    setCurrentProjectName(pn);
    onChange?.(pn);
    setAnchorEl(null);
  };

  useEffect(() => {
    const pn = getCurrentProjectName();

    if (pn) {
      $currentProjectName.set(pn);
    }
  }, []);

  return (
    <div className="relative">
      <div
        ref={anchorRef}
        className="border inline-flex items-center p-2 cursor-pointer border-gray-400 rounded-md min-w-40 justify-between h-10 pl-3"
        aria-describedby={id}
        onClick={(e) => {
          setAnchorEl(e.currentTarget as HTMLDivElement);
        }}
      >
        {currentProjectName === undefined
          ? 'Select Project'
          : currentProjectName === ''
            ? 'Default'
            : currentProjectName}
        <UnfoldMore />
      </div>

      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        TransitionProps={{
          onExited: () => {
            if (anchorRef.current) {
              anchorRef.current.focus();
            }
          },
        }}
      >
        <div className="p-4 w-[300px]">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-bold">Projects</h2>
            <Button onClick={() => setIsAdding(!isAdding)} size="small">
              {isAdding ? 'Cancel' : 'Add Project'}
            </Button>
          </div>

          {isAdding && (
            <div className="flex items-center gap-2 mt-2">
              <TextField
                label="Project Name"
                size="small"
                fullWidth
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                disabled={isMutating}
              />
              <Button
                variant="contained"
                onClick={() => {
                  trigger({ name: newProjectName });
                }}
                loading={isMutating}
              >
                Save
              </Button>
            </div>
          )}

          <div className="mt-4">
            {error && <Alert severity="error">Failed to load projects.</Alert>}
            {projects && (
              <ul className=" divide-y divide-gray-200">
                <li
                  className="py-2 cursor-pointer text-blue-400"
                  onClick={() => handleSwitchProject(``)}
                >
                  Default
                </li>

                {projects.map((project: any) => (
                  <li
                    key={project.name}
                    className="py-2 cursor-pointer"
                    onClick={() => handleSwitchProject(project.name)}
                  >
                    {project.name}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </Popover>
    </div>
  );
};
