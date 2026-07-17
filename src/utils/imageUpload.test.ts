import { uploadApi } from '../api/service';
import { MAX_IMAGE_SIZE, uploadImageFile, validateImageFile } from './imageUpload';

jest.mock('../api/service', () => ({
  uploadApi: { upload: jest.fn() },
}));

const file = (type: string, size: number): File => ({ type, size } as File);

describe('imageUpload', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects non-image files before uploading', async () => {
    await expect(uploadImageFile(file('text/plain', 100), '队徽')).rejects.toThrow(
      '队徽必须是图片文件',
    );
    expect(uploadApi.upload).not.toHaveBeenCalled();
  });

  it('rejects files larger than 5MB', () => {
    expect(() => validateImageFile(file('image/png', MAX_IMAGE_SIZE + 1), '球衣')).toThrow(
      '球衣不能超过 5MB',
    );
  });

  it('returns the stored image URL after a successful upload', async () => {
    (uploadApi.upload as jest.Mock).mockResolvedValue({
      data: { url: 'https://images.example/player.webp' },
    });

    await expect(uploadImageFile(file('image/png', 1024), '球员照片')).resolves.toBe(
      'https://images.example/player.webp',
    );
  });
});
