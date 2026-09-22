import { describe, expect, it } from "vitest";
import { headerZones, navTree, resolveDoc } from "@/lib/docs";
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

describe("дерево хедера из списка в docs/admin.md", () => {
  it("список «Хедер» читается из канона, чужие строки не считаются", () => {
    const md =
      "# Админка\n\n## Хедер\n\nтекст\n\n- brains\n- social\n- not a slug!\n\n## Дальше\n\n- reels\n";
    expect(headerZones(md)).toEqual(["brains", "social"]);
    expect(headerZones("# без раздела")).toEqual([]);
  });

  it("в хедере только зоны из списка, и у каждой есть файл или папка в docs", async () => {
    const tree = await navTree();
    const hrefs = (tree.children ?? []).map((zone) => zone.href);
    expect(tree.href).toBe("/admin");
    expect(hrefs).toEqual(["/admin/brains", "/admin/social", "/admin/brand"]);
    expect(hrefs).not.toContain("/admin/reels");
    expect(hrefs).not.toContain("/admin/journal");
    for (const node of flattenNav(tree)) expect(node.href).toBe(hrefOf(node.doc));
    expect((await resolveDoc(["reels"]))?.doc).toBe("docs/reels.md");
  });

  it("крошки и дети считаются по адресу", async () => {
    const tree = await navTree();
    const chain = breadcrumbFor(tree, "/admin/social/instagram");
    expect(chain.map((n) => n.href)).toEqual([
      "/admin",
      "/admin/social",
      "/admin/social/instagram",
    ]);
    expect(childrenFor(tree, "/admin/social").map((n) => n.href)).toEqual([
      "/admin/social/instagram",
      "/admin/social/telegram",
    ]);
    expect(childrenFor(tree, "/admin/brains").length).toBeGreaterThan(0);
    expect(breadcrumbFor(tree, "/admin/net-takoy").map((n) => n.href)).toEqual(["/admin"]);
  });
});
