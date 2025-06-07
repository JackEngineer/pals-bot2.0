// 递归将对象中的 BigInt 转为字符串
export function bigIntToString(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(bigIntToString);
  } else if (obj && typeof obj === "object") {
    const result: any = {};
    for (const key in obj) {
      const value = obj[key];
      if (typeof value === "bigint") {
        result[key] = value.toString();
      } else {
        result[key] = bigIntToString(value);
      }
    }
    return result;
  }
  return obj;
}
