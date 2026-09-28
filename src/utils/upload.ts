/**
 * 判断文件是否符合 accept 规则
 * @param file 待校验的文件
 * @param accept 允许的类型，多个以英文逗号分割
 */
export function matchAccept(file: File, accept: string): boolean {
  return accept
    .split(",")
    .map((type) => type.trim())
    .filter(Boolean)
    .some((type) => {
      if (type === "*" || type === "*/*") return true;
      if (type.endsWith("/*")) return file.type.startsWith(type.slice(0, -1));
      if (type.startsWith(".")) return file.name.toLowerCase().endsWith(type.toLowerCase());
      return file.type === type;
    });
}

/**
 * 判断文件是否超出大小限制
 * @param file 待校验的文件
 * @param maxFileSize 上限，单位 MB
 */
export function isWithinSize(file: File, maxFileSize: number): boolean {
  return file.size <= maxFileSize * 1024 * 1024;
}

/**
 * 生成一个不重复的上传项标识
 */
export function nextUploadUid(): string {
  return `${Date.now()}${Math.floor(Math.random() * 1000)}`;
}
