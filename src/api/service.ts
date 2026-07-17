// Re-export all API modules for backward compatibility
// Individual modules can also be imported directly from their files

export { teamApi } from './team.service';
export { playerApi } from './player.service';
export { matchApi } from './match.service';
export { authApi, userApi } from './auth.service';
export { seasonApi } from './season.service';
export { uploadApi, importApi } from './upload.service';
export { newsApi } from './news.service';
export type { NewsDTO } from './news.service';
export { auditLogApi } from './audit.service';
export { backupApi } from './backup.service';

export { validateResponse } from './types';
