import { replaceTeamGroup, updateUserRoleEdit, updateUserTeamEdit } from './settingsState';

describe('系统设置状态变更', () => {
  it('为球队设置分组时替换原分组且保留其他球队', () => {
    expect(replaceTeamGroup([
      { teamId: 'team-1', groupName: 'A' },
      { teamId: 'team-2', groupName: 'B' },
    ], 'team-1', 'C')).toEqual([
      { teamId: 'team-2', groupName: 'B' },
      { teamId: 'team-1', groupName: 'C' },
    ]);
  });

  it('清空分组时移除对应球队', () => {
    expect(replaceTeamGroup([
      { teamId: 'team-1', groupName: 'A' },
      { teamId: 'team-2', groupName: 'B' },
    ], 'team-1', '')).toEqual([{ teamId: 'team-2', groupName: 'B' }]);
  });

  it('切换为教练时沿用已有球队', () => {
    expect(updateUserRoleEdit({}, 'user-1', 'user', 'team-2', 'coach', 'team-1')).toEqual({
      'user-1': { role: 'coach', teamId: 'team-2' },
    });
  });

  it('切换为教练且没有已有球队时选择第一支球队', () => {
    expect(updateUserRoleEdit({}, 'user-1', 'user', null, 'coach', 'team-1')).toEqual({
      'user-1': { role: 'coach', teamId: 'team-1' },
    });
  });

  it('切换为非教练角色时清空球队', () => {
    expect(updateUserRoleEdit({
      'user-1': { role: 'coach', teamId: 'team-1' },
    }, 'user-1', 'coach', 'team-1', 'admin', 'team-2')).toEqual({
      'user-1': { role: 'admin', teamId: null },
    });
  });

  it('修改球队时保留当前编辑中的角色', () => {
    expect(updateUserTeamEdit({
      'user-1': { role: 'coach', teamId: 'team-1' },
    }, 'user-1', 'user', null, 'team-2')).toEqual({
      'user-1': { role: 'coach', teamId: 'team-2' },
    });
  });
});
