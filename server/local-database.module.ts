import { Global, Module } from '@nestjs/common';
import { DRIZZLE_DATABASE } from '@server/common/compat/fullstack-nestjs-core';

/**
 * 本地开发数据库存根模块
 * 当 FORCE_FRAMEWORK_DISABLE_DATAPASS=true 时替代真实数据库
 * 返回空结果而非抛出错误，避免前端页面因 500 错误而卡死/崩溃
 *
 * Drizzle ORM 的查询是 thenable（可 await），链式调用如下：
 *   db.select({...}).from(table).where(...)
 *   db.insert(table).values({...}).returning({...})
 *   db.execute(sql`...`)
 *
 * 兼容性设计：
 * - 链式调用：Proxy 拦截任意属性/方法调用，返回自身
 * - await 兼容：将 then/catch/finally 委托给底层 Promise
 * - 结果数组 length === 0：兼容 result.length > 0 存在性检查
 * - 结果数组 [0] 返回默认行对象：兼容 result[0].count 模式
 * - 结果数组 Symbol.iterator 产出默认行：兼容 const [r] = await ... 解构
 * - map/filter 等数组方法返回 []：兼容列表遍历
 * - 默认行属性访问：count → '0'，其他 → ''
 */

/** 默认行：任意属性访问返回安全默认值 */
const defaultRow: any = new Proxy({}, {
  get(_target, prop) {
    if (prop === 'count') return '0';
    if (typeof prop === 'string' && !isNaN(prop as any)) return undefined;
    return '';
  },
});

/**
 * 创建一个链式查询构建器，支持任意链式调用，被 await 时 resolve 为智能空数组
 *
 * 智能空数组特性：
 * - length === 0（存在性检查安全）
 * - [0] 返回 defaultRow（COUNT 解构安全）
 * - Symbol.iterator 产出 defaultRow（解构赋值安全）
 * - map/filter 等返回 []（列表遍历安全）
 */
function createQueryBuilder(): any {
  const chain: any = new Proxy(function () {} as any, {
    get(_target: any, prop: string | symbol) {
      if (prop === 'then' || prop === 'catch' || prop === 'finally') {
        const p = Promise.resolve().then(() => {
          // 返回一个智能空数组 Proxy（非 thenable，await 到此为止）
          return new Proxy([] as any[], {
            get(t: any, p: string | symbol) {
              // 索引 0 → 默认行（兼容 result[0].count）
              if (p === '0') return defaultRow;
              // 迭代器 → 产出默认行（兼容 const [r] = await ...）
              if (p === Symbol.iterator) {
                let yielded = false;
                return function* () {
                  if (!yielded) {
                    yielded = true;
                    yield defaultRow;
                  }
                };
              }
              // length、map、filter 等使用底层空数组的默认行为
              return Reflect.get(t, p);
            },
          });
        });
        return (p as any)[prop].bind(p);
      }
      if (typeof prop === 'symbol') return undefined;
      return chain;
    },
    apply() {
      return chain;
    },
  });

  return chain;
}

const localDatabaseProvider = {
  provide: DRIZZLE_DATABASE,
  useValue: {
    select: () => createQueryBuilder(),
    insert: () => createQueryBuilder(),
    update: () => createQueryBuilder(),
    delete: () => createQueryBuilder(),
    execute: () => createQueryBuilder(),
    transaction: async () => {
      return [];
    },
  },
};

@Global()
@Module({
  providers: [localDatabaseProvider],
  exports: [localDatabaseProvider],
})
export class LocalDatabaseModule {}
