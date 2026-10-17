declare module 'busboy' {
  import type { IncomingHttpHeaders } from 'node:http';
  import type { Readable, Writable } from 'node:stream';

  interface FileInfo {
    filename: string;
    mimeType: string;
  }

  interface FileStream extends Readable {
    truncated: boolean;
  }

  interface FieldInfo {
    nameTruncated: boolean;
    valueTruncated: boolean;
  }

  interface MultipartParser extends Writable {
    on(
      event: 'file',
      listener: (name: string, stream: FileStream, info: FileInfo) => void,
    ): this;
    on(
      event: 'field',
      listener: (name: string, value: string, info: FieldInfo) => void,
    ): this;
    on(
      event: 'filesLimit' | 'fieldsLimit' | 'partsLimit' | 'close',
      listener: () => void,
    ): this;
    on(event: 'error', listener: (error: Error) => void): this;
  }

  export default function busboy(config: {
    headers: IncomingHttpHeaders;
    limits: {
      files: number;
      fields: number;
      parts: number;
      fileSize: number;
      fieldSize: number;
      fieldNameSize: number;
    };
  }): MultipartParser;
}
