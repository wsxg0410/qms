import type { Project } from '@/db/schema';

export const getProjects = async (): Promise<Project[]> => {
  const response = await fetch('/api/projects');
  if (!response.ok) {
    throw new Error('Failed to fetch projects');
  }

  const rs = await response.json();

  return rs?.data || [];
};

export const addProject = async (projectName: string): Promise<Project> => {
  const response = await fetch('/api/projects', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name: projectName }),
  });

  if (!response.ok) {
    throw new Error('Failed to add project');
  }

  const rs = await response.json();

  return rs?.data || null;
};
