import { ApiResponse } from "@/lib/types/database";

/**
 * 获取 Telegram InitData（从 window.Telegram.WebApp 或参数/本地存储）
 */
function getTelegramInitData(): string | undefined {
  if (typeof window !== "undefined" && window.Telegram?.WebApp?.initData) {
    return window.Telegram.WebApp.initData;
  }
  // 可扩展：从 localStorage/sessionStorage/queryString 获取
  return undefined;
}

/**
 * 统一请求封装
 * @param url 请求地址
 * @param options fetch 配置
 */
export async function request<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
//   const initData = getTelegramInitData();
  const headers: HeadersInit = {
    ...(options.headers || {}),
    "Content-Type": "application/json",
  };
//   if (initData) {
//     headers["Authorization"] = `Bearer ${initData}`;
//   }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  let data: ApiResponse<T>;
  try {
    data = await res.json();
  } catch (e) {
    throw new Error("服务器响应格式错误");
  }

  if (!data.success) {
    // 可扩展：全局错误处理、弹窗、上报等
    throw new Error(data.message || data.error || "请求失败");
  }

  return data.data as T;
}

/**
 * 便捷 GET 请求
 */
export function get<T>(url: string, options?: RequestInit) {
  return request<T>(url, { ...options, method: "GET" });
}

/**
 * 便捷 POST 请求
 */
export function post<T>(url: string, body?: any, options?: RequestInit) {
  return request<T>(url, {
    ...options,
    method: "POST",
    body: JSON.stringify(body),
  });
}

// 其他方法（PUT、DELETE）可按需扩展
