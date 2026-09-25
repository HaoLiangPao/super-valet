/**
 * 临时的本地回声缓存 —— 仅供 EXPLORE 页自己用，不是真正的店铺池。
 *
 * 已知缺口（写在这里，也写进了交付报告）：
 * design/0005 §4.5 把「写入真正的池子」划给了 StoreBackend 的存储层扩展
 * （Unit A / CTO 范围，落在 src/lib/** 里），契约（src/lib/places/contract.ts）
 * §5 的三个 HTTP 端点里也没有「确认导入」这一个。Unit B 交付时这部分还没落地，
 * 所以这里只做「同一浏览器里，刚确认过的 placeId 不再重复出现『可加入』按钮」的
 * 乐观展示，不写 src/data/seed-restaurants.ts、不进 engine 的真实状态 ——
 * 摇一摇 / 店铺池现在还看不到这些店。等 Unit A 把 StoreBackend 的餐厅池读写方法
 * 落地后，应该把 `rememberLocalImport` 换成真正调用那个方法。
 */
const KEY = 'sv.explore.localImports.v1';

function readIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function rememberLocalImport(placeId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const ids = readIds();
    if (!ids.includes(placeId)) {
      window.localStorage.setItem(KEY, JSON.stringify([...ids, placeId]));
    }
  } catch {
    // 存不进去就算了——只是个乐观提示，不影响主流程
  }
}

export function wasLocallyImported(placeId: string): boolean {
  return readIds().includes(placeId);
}
