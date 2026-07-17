import { uploadApi } from '../api/service';

export const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

export const validateImageFile = (file: File, label = '图片'): void => {
  if (!file.type.startsWith('image/')) {
    throw new Error(`${label}必须是图片文件`);
  }
  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error(`${label}不能超过 5MB`);
  }
};

export const uploadImageFile = async (file: File, label = '图片'): Promise<string> => {
  validateImageFile(file, label);
  try {
    const response = await uploadApi.upload(file);
    if (!response.data?.url) {
      throw new Error('服务器未返回图片存储地址');
    }
    return response.data.url;
  } catch (error) {
    const reason = error instanceof Error ? error.message : '未知错误';
    throw new Error(`${label}上传失败：${reason}`);
  }
};
