import { Result } from "@/domains/result";

export function loadImage(data: any): Promise<Result<HTMLImageElement>> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve(Result.Ok(img));
    };
    img.onerror = (msg) => {
      resolve(Result.Err(msg as string));
    };
    img.src = data;
  });
}

export function blobToArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const buffer = reader.result;
      resolve(buffer as ArrayBuffer);
    };
    reader.readAsArrayBuffer(blob);
  });
}

export function readFileAsURL(file: File): Promise<Result<string>> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target === null) {
        return resolve(Result.Err("read failed"));
      }
      resolve(Result.Ok(reader.result as string));
    };
    reader.readAsDataURL(file);
  });
}

export function readFileAsArrayBuffer(file: File): Promise<Result<ArrayBuffer>> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target === null) {
        return resolve(Result.Err("read failed"));
      }
      const buffer = e.target.result;
      return resolve(Result.Ok(buffer as ArrayBuffer));
    };
    reader.readAsArrayBuffer(file);
  });
}
