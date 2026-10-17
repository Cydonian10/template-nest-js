export interface StoredComprobante {
  key: string;
}

export abstract class ComprobanteStorage {
  abstract save(buffer: Buffer, extension: string): Promise<StoredComprobante>;
  abstract read(key: string): Promise<Buffer>;
  abstract delete(key: string): Promise<void>;
}
