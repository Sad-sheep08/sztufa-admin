import { SeasonGroupAssignment, UserEdit } from './types';

export const replaceTeamGroup = (
  assignments: SeasonGroupAssignment[],
  teamId: string,
  groupName: string,
): SeasonGroupAssignment[] => {
  const remaining = assignments.filter(group => group.teamId !== teamId);
  return groupName ? [...remaining, { teamId, groupName }] : remaining;
};

export const updateUserRoleEdit = (
  edits: Record<string, UserEdit>,
  userId: string,
  currentRole: string,
  currentTeamId: string | null,
  role: string,
  defaultTeamId: string | null,
): Record<string, UserEdit> => {
  const previousEdit = edits[userId] || { role: currentRole, teamId: currentTeamId };
  return {
    ...edits,
    [userId]: {
      ...previousEdit,
      role,
      teamId: role === 'coach' ? previousEdit.teamId || defaultTeamId : null,
    },
  };
};

export const updateUserTeamEdit = (
  edits: Record<string, UserEdit>,
  userId: string,
  currentRole: string,
  currentTeamId: string | null,
  teamId: string | null,
): Record<string, UserEdit> => ({
  ...edits,
  [userId]: {
    ...(edits[userId] || { role: currentRole, teamId: currentTeamId }),
    teamId,
  },
});
