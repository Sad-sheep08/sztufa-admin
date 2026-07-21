import { Player, TeamFormData } from '../../types';

const isValidPhone = (phone: string): boolean => /^1[3-9]\d{9}$/.test(phone);

export const validateTeamCreation = (
  team: TeamFormData,
  players: Player[],
): string | null => {
  if (!team.teamName.trim()) return '请输入队伍名称';
  if (team.teamName.trim().length > 100) return '球队名称长度不能超过100个字符';
  if (!team.headCoach.trim()) return '请输入主教练姓名';
  if (!team.teamLeader.trim()) return '请输入领队姓名';
  if (!team.teamDoctor.trim()) return '请输入队医姓名';
  if (!team.coachPhone.trim()) return '请输入主教练联系方式';
  if (!isValidPhone(team.coachPhone)) return '主教练联系方式格式不正确，请输入11位手机号';
  if (!team.leaderPhone.trim()) return '请输入领队联系方式';
  if (!isValidPhone(team.leaderPhone)) return '领队联系方式格式不正确，请输入11位手机号';
  if (!team.homeJerseyColor.trim()) return '请输入主队球衣颜色';
  if (!team.awayJerseyColor.trim()) return '请输入客队球衣颜色';
  if (!team.seasonId) return '请选择所属活跃赛季';
  if (players.length === 0) {
    return '请至少添加一名球员；填写球员资料后请点击“确认添加”';
  }

  const studentIds = new Set<string>();
  const jerseyNumbers = new Set<string>();
  for (let index = 0; index < players.length; index++) {
    const player = players[index];
    if (!player.name.trim()) return `第 ${index + 1} 个球员的姓名不能为空`;

    const studentId = player.studentId.trim();
    const jerseyNumber = String(player.jerseyNumber ?? '').trim();
    if (!studentId) return `第 ${index + 1} 个球员的学号不能为空`;
    if (jerseyNumber === '') return `第 ${index + 1} 个球员的球衣号码不能为空`;
    if (studentIds.has(studentId)) return `球员列表中存在重复的学号: ${studentId}`;
    if (jerseyNumbers.has(jerseyNumber)) {
      return `球员列表中存在重复的球衣号码: ${jerseyNumber}`;
    }
    studentIds.add(studentId);
    jerseyNumbers.add(jerseyNumber);
  }

  return null;
};
