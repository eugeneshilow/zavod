import { describe, expect, it } from "vitest";
import {
  composeCustomers,
  initials,
  matches,
  nextStep,
  stageOf,
  type StoredCustomer,
} from "@/lib/customers";
import type { Idea } from "@/lib/social";
import type { PaymentRow } from "@/lib/payments";

// Зона customers: стадия по фактам, человек из заказов, поиск, подсказка.
// Канон — docs/customers/README.md.

const now = Date.UTC(2026, 8, 23, 18, 0, 0);
const DAY = 86_400_000;

function idea(over: Partial<Idea> & { id: string }): Idea {
  return {
    text: "https://www.rbc.ru/economics/1",
    createdAt: now - DAY,
    status: "new",
    takenAt: null,
    note: null,
    permalink: null,
    phase: null,
    phaseAt: null,
    storyTitle: null,
    storyWords: null,
    videoSeconds: null,
    writer: null,
    voice: null,
    totalCostUsd: null,
    elapsedMs: null,
    videoUrl: null,
    posted: false,
    postedMediaId: null,
    queueCount: 0,
    queueAt: null,
    error: null,
    ...over,
  } as Idea;
}

const stored = (
  over: Omit<Partial<StoredCustomer>, "id"> & { id: string; name: string },
): StoredCustomer =>
  ({
    email: null,
    telegram: null,
    source: "витрина",
    note: null,
    createdAt: now - 2 * DAY,
    ...over,
  }) as StoredCustomer;

const order = { voice: "eleven:ogi2DyUAKJb7CEdqqvlU", to: ["telegram"], source: "cabinet" };

describe("стадия по фактам", () => {
  it("заявка, пробует, клиент, ушёл", () => {
    expect(stageOf({ orders: 0, payments: 0, tariffAlive: false })).toBe("lead");
    expect(stageOf({ orders: 2, payments: 0, tariffAlive: false })).toBe("trial");
    expect(stageOf({ orders: 2, payments: 1, tariffAlive: true })).toBe("client");
    expect(stageOf({ orders: 2, payments: 1, tariffAlive: false })).toBe("gone");
  });
});

describe("клиентская база", () => {
  const view = composeCustomers(
    {
      stored: [stored({ id: "c1", name: "Мария Соколова", telegram: "msokol" })],
      ideas: [
        idea({
          id: "i1",
          order,
          status: "done",
          posted: true,
          doneAt: now - 1000,
          storyTitle: "Ставку оставили",
        }),
        idea({ id: "i2", order, status: "failed", error: "отменён покупателем" }),
        idea({ id: "i3" }),
      ],
    },
    now,
  );

  it("человек из таблицы — заявка, демо-аккаунт кабинета — пробует", () => {
    expect(view.customers.map((c) => [c.id, c.stage])).toEqual([
      ["demo", "trial"],
      ["c1", "lead"],
    ]);
    expect(view.totals).toEqual({ all: 2, paying: 0, paidMonthRub: 0, waiting: 1 });
    expect(view.byStage).toEqual({ lead: 1, trial: 1, client: 0, gone: 0 });
  });

  it("демо-аккаунт собирает только заказы кабинета, лента по времени", () => {
    const demo = view.customers[0];
    expect(demo).toMatchObject({ orders: 2, live: 1, cancelled: 1, demo: true });
    expect(demo.touches[0].what).toBe("ролик «Ставку оставили» вышел в эфир");
    expect(demo.touches.at(-1)?.what).toBe("пришёл: кабинет");
    expect(demo.touches.find((t) => t.what.startsWith("отменил"))?.href).toBe("/cabinet/orders/i2");
  });

  it("без заказов кабинета демо-строки нет", () => {
    expect(composeCustomers({ stored: [], ideas: [idea({ id: "x" })] }, now).customers).toEqual([]);
  });
});

describe("оплаты из кассы", () => {
  const paid = (daysAgo: number, product = "month", status = "succeeded"): PaymentRow =>
    ({
      id: `p${daysAgo}${product}`,
      orderId: `pay-${daysAgo}${product}`,
      yookassaId: null,
      product,
      amountRub: product === "month" ? 4900 : 690,
      status,
      account: "ruvibecoding",
      test: true,
      createdAt: now - daysAgo * DAY,
      paidAt: status === "succeeded" ? now - daysAgo * DAY : null,
    }) as PaymentRow;
  const demo = (payments: PaymentRow[]) =>
    composeCustomers(
      { stored: [], ideas: [idea({ id: "i1", order, status: "done" })], payments },
      now,
    ).customers.find((c) => c.id === "demo");

  it("месяц оплачен 10 дней назад — клиент, лента и деньги", () => {
    const c = demo([paid(10), paid(12, "month", "canceled")]);
    expect(c).toMatchObject({ stage: "client", payments: 1, paidRub: 4900, tariffAlive: true });
    expect(c?.touches.find((t) => t.what.startsWith("оплатил"))).toMatchObject({
      what: "оплатил «Месяц» · 4\u00a0900 ₽",
      href: "/cabinet/tariff",
    });
  });

  it("месяц оплачен 40 дней назад — ушёл", () => {
    expect(demo([paid(40)])?.stage).toBe("gone");
  });

  it("оплата за этот месяц по Москве в итогах, платящие считаются", () => {
    const view = composeCustomers({ stored: [], ideas: [], payments: [paid(10)] }, now);
    expect(view.totals).toMatchObject({ paying: 1, paidMonthRub: 4900 });
    expect(view.customers[0]?.id).toBe("demo");
  });
});

describe("поиск, инициалы, что дальше", () => {
  const c = composeCustomers(
    {
      stored: [stored({ id: "c1", name: "Мария Соколова", email: "m@s.ru", telegram: "msokol" })],
      ideas: [],
    },
    now,
  ).customers[0];

  it("ищет по имени, почте и нику с @", () => {
    expect(matches(c, "мария")).toBe(true);
    expect(matches(c, "m@s")).toBe(true);
    expect(matches(c, "@msok")).toBe(true);
    expect(matches(c, "игорь")).toBe(false);
    expect(initials("Мария Соколова")).toBe("МС");
    expect(initials("Евгений · демо-аккаунт кабинета")).toBe("ЕД");
  });

  it("заявка ждёт ответа, пробующему — тариф", () => {
    expect(
      nextStep({ stage: "lead", live: 0, orders: 0, lastTouchAt: now - 2 * DAY }, now),
    ).toContain("ждёт ответа 2 дн.");
    expect(nextStep({ stage: "trial", live: 1, orders: 1, lastTouchAt: now }, now)).toContain(
      "предложить тариф",
    );
  });
});
