import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const getDownloadURLMock = vi.hoisted(() => vi.fn());
const refMock = vi.hoisted(() => vi.fn());
const uploadBytesMock = vi.hoisted(() => vi.fn());
let originalCanvasToBlob;

vi.mock('firebase/storage', () => ({
  getDownloadURL: getDownloadURLMock,
  ref: refMock,
  uploadBytes: uploadBytesMock,
}));

vi.mock('../firebase/config', () => ({
  auth: { currentUser: { uid: 'user-a' } },
  storage: {},
}));

import { uploadImageFile } from './storageHelpers';

describe('image storage uploads', () => {
  beforeEach(() => {
    originalCanvasToBlob = HTMLCanvasElement.prototype.toBlob;
    refMock.mockReset();
    refMock.mockImplementation((_, path) => ({ fullPath: path }));
    uploadBytesMock.mockReset();
    uploadBytesMock.mockResolvedValue();
    getDownloadURLMock.mockReset();
    getDownloadURLMock.mockResolvedValue('https://storage.example/image.jpg');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    if (originalCanvasToBlob) {
      Object.defineProperty(HTMLCanvasElement.prototype, 'toBlob', {
        configurable: true,
        value: originalCanvasToBlob,
      });
    } else {
      delete HTMLCanvasElement.prototype.toBlob;
    }
  });

  it('stores completed gallery images in the matching user folder', async () => {
    const file = new File(['image'], 'photo.jpg', { type: 'image/jpeg' });

    await expect(uploadImageFile(file, 'completedPuzzles')).resolves.toBe(
      'https://storage.example/image.jpg'
    );

    expect(refMock).toHaveBeenCalledWith(
      {},
      expect.stringMatching(/^completedPuzzles\/user-a\/\d+_photo\.jpg$/)
    );
    expect(uploadBytesMock).toHaveBeenCalledWith(
      expect.objectContaining({ fullPath: expect.stringContaining('completedPuzzles/user-a/') }),
      file,
      { contentType: 'image/jpeg' }
    );
  });

  it('compresses oversized completed gallery images before uploading', async () => {
    const file = new File(['large image'], 'photo.png', { type: 'image/png' });
    Object.defineProperty(file, 'size', { value: 6 * 1024 * 1024 });
    const compressedBlob = new Blob(['compressed'], { type: 'image/jpeg' });
    vi.stubGlobal(
      'createImageBitmap',
      vi.fn().mockResolvedValue({
        width: 4000,
        height: 3000,
        close: vi.fn(),
      })
    );
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      drawImage: vi.fn(),
    });
    Object.defineProperty(HTMLCanvasElement.prototype, 'toBlob', {
      configurable: true,
      value: vi.fn((callback) => callback(compressedBlob)),
    });

    await uploadImageFile(file, 'completedPuzzles');

    const uploadedFile = uploadBytesMock.mock.calls[0][1];
    expect(uploadedFile.type).toBe('image/jpeg');
    expect(uploadedFile.size).toBeLessThan(5 * 1024 * 1024);
    expect(uploadBytesMock.mock.calls[0][2]).toEqual({ contentType: 'image/jpeg' });
  });
});
