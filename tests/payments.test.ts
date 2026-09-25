import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createYookassaPayment,
  monthStartMsk,
  paidThisMonthRub,
  parseNotification,
  PRODUCTS,
  requestOrigin,
  TARIFF_DAYS,
  tariffOf,
  type PaymentFact,
} from "@/lib/payments";

// Зона payments: тариф из платежей, разбор уведомления, клиент ЮKassa и
// приёмник, который не верит телу уведомления. Канон — docs/payments/README.md.

const mutation = vi.hoisted(() => vi.fn(async () => "updated"));

vi.mock("@/lib/reels", () => ({
  reelsAccess: () => ({ client: { mutation }, token: "t" }),
}));

const now = Date.UTC(2026, 8, 24, 12, 0, 0);
const DAY = 86_400_000;

const pay = (over: Partial<PaymentFact>): PaymentFact => ({
  product: "month",
  status: "succeeded",
  amountRub: 4900,
  paidAt: now - DAY,
  ...over,
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  mutation.mockClear();
});

describe("тариф из платежей", () => {
  it("нет платежей — тарифа нет", () => {
    expect(tariffOf([], now)).toEqual({
      plan: null,
      until: null,
      alive: false,
      reelsLeft: 0,
      active: false,
    });
  });

  it("месяц 10 дней назад — «Старт» до paidAt + 30 дней", () => {
    const paidAt = now - 10 * DAY;
    expect(tariffOf([pay({ paidAt })], now)).toMatchObject({
      plan: "Старт",
      until: paidAt + TARIFF_DAYS * DAY,
      alive: true,
    });
  });

  it("месяц 40 дней назад — тариф кончился; ждущий и отменённый не в счёт", () => {
    const t = tariffOf(
      [
        pay({ paidAt: now - 40 * DAY }),
        pay({ status: "pending", paidAt: null }),
        pay({ status: "canceled", paidAt: null }),
      ],
      now,
    );
    expect(t.alive).toBe(false);
    expect(t.plan).toBeNull();
  });

  it("два разовых ролика — запас 2", () => {
    const reel = { product: "reel", amountRub: 690 };
    expect(tariffOf([pay(reel), pay(reel)], now).reelsLeft).toBe(2);
  });

  it("разовый ролик 5 дней назад — активен без тарифа, 40 дней назад — нет", () => {
    const reel = { product: "reel" } as const;
    expect(tariffOf([pay({ ...reel, paidAt: now - 5 * DAY })], now)).toMatchObject({
      alive: false,
      active: true,
    });
    expect(tariffOf([pay({ ...reel, paidAt: now - 40 * DAY })], now).active).toBe(false);
  });

  it("оплачено за месяц — с 1-го числа по Москве", () => {
    expect(new Date(monthStartMsk(now)).toISOString()).toBe("2026-08-31T21:00:00.000Z");
    expect(
      paidThisMonthRub([pay({ paidAt: now - DAY }), pay({ paidAt: now - 30 * DAY })], now),
    ).toBe(4900);
  });

  it("цены товаров — в переносчике", () => {
    expect(PRODUCTS.map((p) => [p.id, p.priceRub])).toEqual([
      ["reel", 690],
      ["month", 4900],
    ]);
  });
});

describe("уведомление ЮKassa", () => {
  it("берём только object.id", () => {
    expect(
      parseNotification({
        type: "notification",
        event: "payment.succeeded",
        object: { id: "2e7c1a5f-000f-5000-8000-1a2b3c4d5e6f", status: "succeeded" },
      }),
    ).toEqual({ event: "payment.succeeded", paymentId: "2e7c1a5f-000f-5000-8000-1a2b3c4d5e6f" });
  });

  it("мусор — null", () => {
    expect(parseNotification(null)).toBeNull();
    expect(parseNotification("строка")).toBeNull();
    expect(parseNotification({ event: "payment.succeeded" })).toBeNull();
    expect(parseNotification({ object: { id: 42 } })).toBeNull();
    expect(parseNotification({ object: { id: "" } })).toBeNull();
  });

  it("номер длиннее 64 знаков — null", () => {
    expect(parseNotification({ object: { id: "x".repeat(65) } })).toBeNull();
    expect(parseNotification({ object: { id: "x".repeat(64) } })).not.toBeNull();
  });
});

describe("клиент ЮKassa", () => {
  it("создание: сумма строкой, ключ идемпотентности, Basic, возврат", async () => {
    const fetchMock = vi.fn(async (url: string, init: RequestInit) => {
      void url;
      void init;
      return Response.json({
        id: "yk-1",
        test: true,
        confirmation: { confirmation_url: "https://yoomoney.ru/checkout/1" },
      });
    });
    vi.stubGlobal("fetch", fetchMock);
    const result = await createYookassaPayment({
      shopId: "123",
      secretKey: "test_x",
      orderId: "pay-abc",
      amountRub: 690,
      description: "Разовый ролик",
      returnUrl: "https://app.zavod.today/cabinet/tariff?order=pay-abc",
    });
    expect(result).toEqual({
      id: "yk-1",
      confirmationUrl: "https://yoomoney.ru/checkout/1",
      test: true,
    });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.yookassa.ru/v3/payments");
    const h = init.headers as Record<string, string>;
    expect(h["Idempotence-Key"]).toBe("pay-abc");
    expect(h.Authorization).toBe(`Basic ${Buffer.from("123:test_x").toString("base64")}`);
    expect(JSON.parse(String(init.body))).toMatchObject({
      amount: { value: "690.00", currency: "RUB" },
      capture: true,
      confirmation: { type: "redirect" },
      metadata: { orderId: "pay-abc" },
    });
  });

  it("адрес сайта из заголовков", () => {
    const h = (o: Record<string, string>) => ({ get: (n: string) => o[n] ?? null });
    expect(requestOrigin(h({ host: "app.localhost:3222" }))).toBe("http://app.localhost:3222");
    expect(requestOrigin(h({ host: "x", "x-forwarded-host": "app.zavod.today" }))).toBe(
      "https://app.zavod.today",
    );
  });
});

describe("приёмник /api/yookassa", () => {
  const notification = (status: string) =>
    new Request("http://localhost/api/yookassa", {
      method: "POST",
      body: JSON.stringify({
        type: "notification",
        event: `payment.${status}`,
        object: { id: "yk-1", status, metadata: { orderId: "pay-abc" } },
      }),
    });

  it("тело врёт «succeeded», ЮKassa отвечает pending — оплату не ставим", async () => {
    vi.stubEnv("YOOKASSA_SHOP_ID", "123");
    vi.stubEnv("YOOKASSA_SECRET_KEY", "test_x");
    const fetchMock = vi.fn(async () =>
      Response.json({
        id: "yk-1",
        status: "pending",
        test: true,
        metadata: { orderId: "pay-abc" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const { POST } = await import("@/app/api/yookassa/route");
    const res = await POST(notification("succeeded"));
    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.yookassa.ru/v3/payments/yk-1",
      expect.anything(),
    );
    expect(mutation).not.toHaveBeenCalled();
  });

  it("ЮKassa подтверждает succeeded — строка оплачена с датой списания", async () => {
    vi.stubEnv("YOOKASSA_SHOP_ID", "123");
    vi.stubEnv("YOOKASSA_SECRET_KEY", "test_x");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({
          id: "yk-1",
          status: "succeeded",
          test: true,
          captured_at: "2026-09-24T12:00:00.000Z",
          metadata: { orderId: "pay-abc" },
        }),
      ),
    );
    const { POST } = await import("@/app/api/yookassa/route");
    const res = await POST(notification("succeeded"));
    expect(res.status).toBe(200);
    expect(mutation).toHaveBeenCalledWith(expect.anything(), {
      token: "t",
      orderId: "pay-abc",
      status: "succeeded",
      paidAt: now,
    });
  });

  it("без ключей и на мусор — 200 и ничего; GET — 405", async () => {
    vi.stubEnv("YOOKASSA_SHOP_ID", "");
    vi.stubEnv("YOOKASSA_SECRET_KEY", "");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const { POST, GET } = await import("@/app/api/yookassa/route");
    expect((await POST(notification("succeeded"))).status).toBe(200);
    expect(
      (
        await POST(
          new Request("http://localhost/api/yookassa", { method: "POST", body: "не json" }),
        )
      ).status,
    ).toBe(200);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(mutation).not.toHaveBeenCalled();
    expect(GET().status).toBe(405);
  });
});
