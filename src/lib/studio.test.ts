import { describe, expect, test } from "vitest";
import {
  filterClips,
  initialClips,
  needsDecision,
  transitionClips,
} from "./studio";

describe("демопроизводство", () => {
  test("ошибку нельзя согласовать: повтор возвращает на проверку, затем в очередь", () => {
    const rejected = transitionClips(initialClips, {
      type: "approve",
      id: "041",
    });
    expect(rejected.find((clip) => clip.id === "041")?.stage).toBe("error");
    const retried = transitionClips(rejected, { type: "retry", id: "041" });
    expect(retried.find((clip) => clip.id === "041")?.stage).toBe("review");
    const approved = transitionClips(retried, { type: "approve", id: "041" });
    expect(approved.find((clip) => clip.id === "041")?.stage).toBe("queued");
    expect(approved.filter(needsDecision)).toHaveLength(
      initialClips.filter(needsDecision).length - 1,
    );
    expect(initialClips.find((clip) => clip.id === "041")?.stage).toBe("error");
  });

  test("правка исключает ролик из очереди и сохраняет непустую причину", () => {
    const empty = transitionClips(initialClips, {
      type: "feedback",
      id: "044",
      text: "  ",
    });
    expect(empty.find((clip) => clip.id === "044")?.stage).toBe("queued");
    const edited = transitionClips(empty, {
      type: "feedback",
      id: "044",
      text: "  Сократить начало  ",
    });
    expect(edited.find((clip) => clip.id === "044")).toMatchObject({
      stage: "script",
      feedback: "Сократить начало",
    });
    expect(
      edited
        .filter((clip) => clip.stage === "queued")
        .some((clip) => clip.id === "044"),
    ).toBe(false);
  });

  test("эксперимент не дублируется, выбор A/B требует последующей проверки", () => {
    const created = transitionClips(initialClips, { type: "experiment" });
    const repeated = transitionClips(created, { type: "experiment" });
    expect(repeated.filter((clip) => clip.id === "053")).toHaveLength(1);
    const selected = transitionClips(repeated, {
      type: "hook",
      id: "053",
      variant: "B",
    });
    expect(selected.find((clip) => clip.id === "053")).toMatchObject({
      stage: "review",
      hook: "B",
    });
    const guarded = transitionClips(selected, {
      type: "hook",
      id: "053",
      variant: "A",
    });
    expect(guarded.find((clip) => clip.id === "053")?.hook).toBe("B");
  });

  test("поиск учитывает этап, комбинируется с фильтром и сортирует сегодня перед завтра", () => {
    expect(
      filterClips(initialClips, "  ошибка ЗВУКА ", "attention", "default").map(
        (clip) => clip.id,
      ),
    ).toEqual(["041"]);
    expect(
      filterClips(initialClips, "до / после", "today", "time").map(
        (clip) => clip.id,
      ),
    ).toEqual(["042", "048"]);
    const sorted = filterClips(initialClips, "", "all", "time");
    expect(sorted[0].id).toBe("041");
    expect(sorted[8].day).toBe("Завтра");
    expect(
      filterClips(initialClips, "нет такого ролика", "all", "default"),
    ).toHaveLength(0);
  });
});
