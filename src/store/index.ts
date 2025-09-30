import { atom } from 'nanostores';

export const $currentProjectName = atom<string | undefined>(undefined);
