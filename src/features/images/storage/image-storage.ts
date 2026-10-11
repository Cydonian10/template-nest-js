export interface StoredImage {
  key: string;
  provider: string;
}

export abstract class ImageStorage {
  abstract save(buffer: Buffer, extension: string): Promise<StoredImage>;
  abstract read(key: string): Promise<Buffer>;
  abstract delete(key: string): Promise<void>;
}
