/** biome-ignore-all lint/suspicious/noExplicitAny: 型についてはGenericで指定すること */

/**
 * 任意のAPIから返されるスネークケースのオブジェクトをJS/TSで扱いやすい形に変換する関数
 * @param obj 任意のオブジェクト
 * @returns JS/TSで扱いやすく加工された任意のオブジェクト
 * @author Yuito Akatsuki <yuito@uniproject.jp>
 */
export function parseResponse<T>(obj: any): T {
  const camelcasedObj = toCamelCase(obj) as any;

  // 日時文字列をDateオブジェクトに変換
  for (const key in camelcasedObj) {
    if (
      typeof camelcasedObj[key] === "string" &&
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(camelcasedObj[key])
    ) {
      camelcasedObj[key] = new Date(camelcasedObj[key]);
    }
  }

  return camelcasedObj;
}

/**
 * JS/TSのオブジェクトをAPIに送る前にスネークケースに変換する関数
 * @param obj JS/TSのオブジェクト
 * @returns APIに送る前に加工された任意のオブジェクト
 * @author Yuito Akatsuki <yuito@uniproject.jp>
 */
export function serializeRequest<T>(obj: T): any {
  const snakeCasedObj = toSnakeCase(obj) as any;

  // DateオブジェクトをISO文字列に変換
  for (const key in snakeCasedObj) {
    if (snakeCasedObj[key] instanceof Date) {
      snakeCasedObj[key] = snakeCasedObj[key].toISOString();
    }
  }

  return snakeCasedObj;
}

/**
 * スネークケースのオブジェクトをキャメルケースに変換する関数
 * @param obj スネークケースの任意のオブジェクト
 * @returns キャメルケースに変換された任意のオブジェクト
 * @author Yuito Akatsuki <yuito@uniproject.jp>
 */
export function toCamelCase<T>(obj: any): T {
  if (Array.isArray(obj)) {
    return obj.map((item) => toCamelCase(item)) as any;
  } else if (obj !== null && typeof obj === "object") {
    const newObj: any = {};
    for (const key in obj) {
      const camelKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
      newObj[camelKey] = toCamelCase(obj[key]);
    }
    return newObj;
  }
  return obj;
}

/**
 * キャメルケースのオブジェクトをスネークケースに変換する関数
 * @param obj キャメルケースの任意のオブジェクト
 * @returns スネークケースに変換された任意のオブジェクト
 * @author Yuito Akatsuki <yuito@uniproject.jp>
 */
export function toSnakeCase<T>(obj: any): T {
  if (Array.isArray(obj)) {
    return obj.map((item) => toSnakeCase(item)) as any;
  } else if (obj !== null && typeof obj === "object") {
    const newObj: any = {};
    for (const key in obj) {
      const snakeKey = key.replace(/([A-Z])/g, "_$1").toLowerCase();
      newObj[snakeKey] = toSnakeCase(obj[key]);
    }
    return newObj;
  }
  return obj;
}
