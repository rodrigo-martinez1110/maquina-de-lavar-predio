import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AppNav } from "../../src/components/AppNav";
import { BalanceCard } from "../../src/components/BalanceCard";
import { ReservationTimeline } from "../../src/components/ReservationTimeline";

describe("resident dashboard components", () => {
  it("formats whole-hour weekly balance without minutes", () => {
    const markup = renderToStaticMarkup(<BalanceCard availableMinutes={360} />);

    expect(markup).toContain("Saldo da semana");
    expect(markup).toContain("6h");
    expect(markup).not.toContain("0min");
  });

  it("renders available reservation slots", () => {
    const markup = renderToStaticMarkup(
      <ReservationTimeline
        slots={[
          { time: "07:00", status: "free" },
          { time: "07:30", status: "free" },
        ]}
      />,
    );

    expect(markup).toContain("07:00 - disponivel");
    expect(markup).toContain("07:30 - disponivel");
  });

  it("renders busy reservation slots with apartment number", () => {
    const markup = renderToStaticMarkup(
      <ReservationTimeline
        slots={[
          {
            time: "10:00",
            status: "busy",
            apartmentNumber: 1,
            reservationId: "reservation-1",
            kind: "wash_dry",
          },
        ]}
      />,
    );

    expect(markup).toContain("10:00 - ocupado");
    expect(markup).toContain("Apt 1");
  });

  it("renders available resident navigation links", () => {
    const markup = renderToStaticMarkup(<AppNav />);

    expect(markup).toContain('href="/"');
    expect(markup).toContain('href="/reservations"');
    expect(markup).toContain('href="/credits"');
    expect(markup).toContain('href="/notifications"');
    expect(markup).toContain('href="/metrics"');
    expect(markup).toContain('href="/account"');
    expect(markup).toContain("Inicio");
    expect(markup).toContain("Agenda");
    expect(markup).toContain("Horas");
    expect(markup).toContain("Avisos");
    expect(markup).toContain("Metricas");
    expect(markup).toContain("Conta");
  });
});
