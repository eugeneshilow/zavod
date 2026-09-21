import { describe, expect, it } from "vitest";
import { navTree, resolveDoc } from "@/lib/docs";
import { breadcrumbFor, childrenFor, flattenNav, hrefOf, titleOf } from "@/lib/nav-tree";

// Правило зеркала (docs/admin.md): адрес экрана = адрес канона. Тест держит
// правило с обеих сторон — файл → адрес и адрес → файл — и проверяет, что
// хедер строится из живой папки docs/, а не из списка в коде.

describe("правило зеркала", () => {
  it("путь канона превращается в адрес экрана", () => {
    expect(hrefOf("docs/admin.md")).toBe("/admin");
    expect(hrefOf("docs/reels.md")).toBe("/admin/reels");
    expect(hrefOf("docs/research/README.md")).toBe("/admin/research");
    expect(hrefOf("docs/research/2026-09-20-gus-formula/README.md")).toBe(
      "/admin/research/2026-09-20-gus-formula",
    );
  });

  it("адрес экрана находит файл канона, а несуществующий — честно нет", async () => {
    expect((await resolveDoc(["reels"]))?.doc).toBe("docs/reels.md");
    expect((await resolveDoc(["research"]))?.doc).toBe("docs/research/README.md");
    expect((await resolveDoc(["journal"]))?.doc).toBe("docs/journal.md");
    expect(await resolveDoc(["net-takoy-zony"])).toBeNull();
    expect(await resolveDoc([".."])).toBeNull();
  });

  it("имя кнопки — имя файла, подпись — заголовок канона без повтора имени", () => {
    expect(titleOf("# reels — сборка вертикальных роликов", "reels")).toEqual({
      label: "reels",
      note: "сборка вертикальных роликов",
    });
    expect(titleOf("# Выход наружу — репозиторий, Vercel", "deploy")).toEqual({
      label: "deploy",
      note: "Выход наружу — репозиторий, Vercel",
    });
    expect(titleOf("без заголовка", "x")).toEqual({ label: "x" });
  });
});

describe("дерево из папки docs", () => {
  it("зоны — файлы и папки docs, служебные файлы и admin.md в хедер не попадают", async () => {
    const tree = await navTree();
    const hrefs = (tree.children ?? []).map((zone) => zone.href);
    expect(tree.href).toBe("/admin");
    expect(hrefs).toEqual(
      expect.arrayContaining([
        "/admin/reels",
        "/admin/publish",
        "/admin/deploy",
        "/admin/research",
      ]),
    );
    expect(hrefs).not.toContain("/admin/journal");
    expect(hrefs).not.toContain("/admin/README");
    expect(hrefs).not.toContain("/admin/admin");
    for (const node of flattenNav(tree)) expect(node.href).toBe(hrefOf(node.doc));
  });

  it("крошки и дети считаются по адресу", async () => {
    const tree = await navTree();
    const chain = breadcrumbFor(tree, "/admin/research/2026-09-20-gus-formula");
    expect(chain.map((n) => n.href)).toEqual([
      "/admin",
      "/admin/research",
      "/admin/research/2026-09-20-gus-formula",
    ]);
    expect(childrenFor(tree, "/admin/research").length).toBeGreaterThan(0);
    expect(childrenFor(tree, "/admin/reels")).toEqual([]);
    expect(breadcrumbFor(tree, "/admin/net-takoy").map((n) => n.href)).toEqual(["/admin"]);
  });
});
