// Дерево админки — чистые функции без файловой системы, чтобы их могли
// звать клиентские компоненты (хедер, шапка страницы, полоса «вверх · вниз»).
// Само дерево строится из папки docs/ в lib/docs.ts (navTree): адрес экрана —
// зеркало адреса канона, docs/<зона> → /admin/<зона>. Канон — docs/admin.md.

export type NavNode = {
  /** Адрес экрана: /admin/<зона>[/<подзона>]. */
  href: string;
  /** Короткое имя в хедере и крошках — часть заголовка канона до « — ». */
  label: string;
  /** Подпись одной фразой — часть заголовка канона после « — ». */
  note?: string;
  /** Файл канона, чьим зеркалом является экран: docs/reels.md или docs/research/README.md. */
  doc: string;
  children?: NavNode[];
};

function isUnder(pathname: string, base: string): boolean {
  return pathname === base || pathname.startsWith(`${base}/`);
}

/** Цепочка узлов от корня до pathname; для адреса без своего узла — до ближайшего предка. */
export function breadcrumbFor(tree: NavNode, pathname: string): NavNode[] {
  let best: NavNode[] = [tree];
  let bestLen = -1;
  const walk = (node: NavNode, path: NavNode[]) => {
    if (isUnder(pathname, node.href) && node.href.length > bestLen) {
      best = [...path, node];
      bestLen = node.href.length;
    }
    node.children?.forEach((child) => walk(child, [...path, node]));
  };
  walk(tree, []);
  return best;
}

/** Узел точно по адресу или undefined. */
export function findNode(tree: NavNode, pathname: string): NavNode | undefined {
  const chain = breadcrumbFor(tree, pathname);
  const last = chain[chain.length - 1];
  return last && last.href === pathname ? last : undefined;
}

/** Прямые дети страницы — на уровень ниже, но не ниже. */
export function childrenFor(tree: NavNode, pathname: string): NavNode[] {
  return findNode(tree, pathname)?.children ?? [];
}

/** Плоский список всех узлов дерева — для тестов. */
export function flattenNav(node: NavNode): NavNode[] {
  return [node, ...(node.children ?? []).flatMap((child) => flattenNav(child))];
}

/**
 * Имя и подпись узла. Имя кнопки — имя файла или папки (адрес и есть имя:
 * docs/reels.md → кнопка «reels» → /admin/reels). Подпись — первая строка
 * канона; если она начинается с того же имени и « — », повтор снимается:
 * `# reels — сборка вертикальных роликов` даёт подпись «сборка вертикальных роликов».
 */
export function titleOf(md: string, slug: string): { label: string; note?: string } {
  const line = md.split("\n").find((l) => l.startsWith("# "));
  if (!line) return { label: slug };
  const text = line.slice(2).trim();
  const prefix = `${slug} — `;
  const note = text.startsWith(prefix) ? text.slice(prefix.length).trim() : text;
  return note ? { label: slug, note } : { label: slug };
}

/**
 * Правило зеркала: путь канона → адрес экрана. `docs/reels.md` → `/admin/reels`,
 * `docs/research/README.md` → `/admin/research`, `docs/admin.md` → `/admin`.
 */
export function hrefOf(doc: string): string {
  const rel = doc.replace(/^docs\//, "").replace(/\.md$/, "");
  const parts = rel.split("/").filter((p) => p && p !== "README");
  if (parts.length === 1 && parts[0] === "admin") return "/admin";
  return ["/admin", ...parts].join("/");
}
