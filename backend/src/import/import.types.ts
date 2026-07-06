export interface UploadedCsvFile {
  buffer: Buffer;
  size: number;
  originalname?: string;
  mimetype?: string;
}
