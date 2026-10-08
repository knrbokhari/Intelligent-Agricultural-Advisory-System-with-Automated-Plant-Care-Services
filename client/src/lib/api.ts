import { Platform } from "react-native";

const configuredApiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

export const API_URL =
  configuredApiUrl ||
  (Platform.OS === "android"
    ? "http://192.168.68.110:5000"
    : "http://localhost:5000");

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type RequestOptions = Omit<RequestInit, "body" | "headers"> & {
  body?: unknown;
  headers?: HeadersInit;
  token?: string | null;
};

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { body, token, headers, ...requestOptions } = options;
  const response = await fetch(`${API_URL}${path}`, {
    ...requestOptions,
    headers: {
      Accept: "application/json",
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  const contentType = response.headers.get("content-type");
  const result = contentType?.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message =
      typeof result === "object" && result && "message" in result
        ? String(result.message)
        : `Request failed with status ${response.status}`;
    throw new ApiError(message, response.status);
  }

  return result as T;
}

export const api = {
  get: <T>(path: string, options?: Omit<RequestOptions, "method" | "body">) =>
    apiRequest<T>(path, { ...options, method: "GET" }),
  post: <T>(
    path: string,
    body: unknown,
    options?: Omit<RequestOptions, "method">,
  ) => apiRequest<T>(path, { ...options, method: "POST", body }),
};
