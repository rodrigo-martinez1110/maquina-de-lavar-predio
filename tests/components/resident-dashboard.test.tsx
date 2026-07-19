import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AppNav } from "../../src/components/AppNav";
import { BalanceCard } from "../../src/components/BalanceCard";
import { CreditForms } from "../../src/app/credits/credit-forms";
import { ReservationDayOverview } from "../../src/components/ReservationDayOverview";
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

  it("renders a compact day overview with free window links", () => {
    const markup = renderToStaticMarkup(
      <ReservationDayOverview
        date="2026-07-19"
        slots={[
          { time: "07:00", status: "free" },
          { time: "07:30", status: "free" },
          {
            time: "08:00",
            status: "busy",
            apartmentNumber: 1,
            reservationId: "reservation-1",
            kind: "wash_dry",
          },
        ]}
        freeWindows={[
          { startTime: "07:00", endTime: "08:00", durationMinutes: 60 },
        ]}
      />,
    );

    expect(markup).toContain("Visao rapida");
    expect(markup).toContain("07:00-08:00");
    expect(markup).toContain("1h livre");
    expect(markup).toContain("href=\"/reservations?date=2026-07-19&amp;start=07%3A00\"");
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

  it("defaults transfer acceptance to the full remaining request up to 2h", () => {
    const markup = renderToStaticMarkup(
      <CreditForms
        currentApartmentId="apt-2"
        weekStart="2026-07-13"
        transfers={[
          {
            id: "transfer-1",
            apartmentId: "apt-1",
            apartmentNumber: 1,
            kind: "request",
            status: "open",
            weekStart: "2026-07-13",
            totalMinutes: 120,
            remainingMinutes: 120,
            createdAt: "2026-07-13T10:00:00Z",
          },
        ]}
      />,
    );

    expect(markup).toContain("2h restantes");
    expect(markup).toContain('<option value="120" selected="">2h</option>');
  });

  it("renders cancel for the resident own open transfer", () => {
    const markup = renderToStaticMarkup(
      <CreditForms
        currentApartmentId="apt-1"
        weekStart="2026-07-13"
        transfers={[
          {
            id: "transfer-1",
            apartmentId: "apt-1",
            apartmentNumber: 1,
            kind: "request",
            status: "open",
            weekStart: "2026-07-13",
            totalMinutes: 120,
            remainingMinutes: 120,
            createdAt: "2026-07-13T10:00:00Z",
          },
        ]}
      />,
    );

    expect(markup).toContain("Cancelar");
    expect(markup).not.toContain("Ajudar");
  });
});
