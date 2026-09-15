import {
  getD1,
} from "@/lib/d1-server";

const D1_AVAILABILITY_LOOKUP_LIMIT =
  500;

const D1_AVAILABILITY_FETCH_LIMIT =
  D1_AVAILABILITY_LOOKUP_LIMIT +
  1;

export type D1AvailabilityErrorKind =
  | "INPUT"
  | "LIMIT"
  | "DATABASE";

export class D1AvailabilityError
  extends Error {
  kind:
    D1AvailabilityErrorKind;

  constructor(
    kind:
      D1AvailabilityErrorKind,
    message:
      string,
  ) {
    super(
      message,
    );

    this.name =
      "D1AvailabilityError";

    this.kind =
      kind;
  }
}

export interface D1AvailabilityRoute {
  fromPort:
    string;

  toPort:
    string;

  dates:
    string[];
}

export interface D1AvailabilityResult {
  minimumDate:
    string;

  passengers:
    number;

  origins:
    string[];

  routes:
    D1AvailabilityRoute[];
}

type D1AvailabilityJoinedRow = {
  inventoryId:
    string;

  travelDate:
    string;

  seatCapacity:
    number;

  bookedSeats:
    number;

  heldSeats:
    number;

  inventoryScheduleId:
    string;

  inventoryOperatorId:
    string;

  inventoryVesselId:
    string;

  inventoryRouteId:
    string;

  openActiveTotal:
    number;

  joinedScheduleId:
    string | null;

  scheduleOperatorId:
    string | null;

  scheduleVesselId:
    string | null;

  scheduleRouteId:
    string | null;

  scheduleIsActive:
    number | null;

  joinedOperatorId:
    string | null;

  operatorIsActive:
    number | null;

  joinedVesselId:
    string | null;

  vesselOperatorId:
    string | null;

  vesselIsActive:
    number | null;

  joinedRouteId:
    string | null;

  routeFromPort:
    string | null;

  routeToPort:
    string | null;

  routeIsActive:
    number | null;
};

function cleanD1AvailabilityText(
  value:
    unknown,
): string {
  return String(
    value ?? "",
  ).trim();
}

function toD1AvailabilityInteger(
  value:
    unknown,
): number | null {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const parsed =
    Number(
      value,
    );

  return Number.isInteger(
    parsed,
  )
    ? parsed
    : null;
}

function normalizeD1AvailabilityPassengers(
  value:
    number,
): number {
  if (
    !Number.isInteger(
      value,
    ) ||
    value < 1 ||
    value > 20
  ) {
    throw new D1AvailabilityError(
      "INPUT",
      "Passengers must be an integer between 1 and 20.",
    );
  }

  return value;
}

function normalizeD1AvailabilityMinimumDate(
  value:
    string,
): string {
  const minimumDate =
    cleanD1AvailabilityText(
      value,
    );

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(
      minimumDate,
    )
  ) {
    throw new D1AvailabilityError(
      "INPUT",
      "Minimum availability date is invalid.",
    );
  }

  return minimumDate;
}

function isD1AvailabilityActive(
  value:
    unknown,
): boolean {
  return (
    toD1AvailabilityInteger(
      value,
    ) === 1
  );
}

function sortD1AvailabilityRoutes(
  routes:
    D1AvailabilityRoute[],
): D1AvailabilityRoute[] {
  return routes.sort(
    (
      firstRoute,
      secondRoute,
    ) => {
      const originComparison =
        firstRoute
          .fromPort
          .localeCompare(
            secondRoute
              .fromPort,
            "en",
            {
              sensitivity:
                "base",
            },
          );

      if (
        originComparison !==
        0
      ) {
        return originComparison;
      }

      return firstRoute
        .toPort
        .localeCompare(
          secondRoute
            .toPort,
          "en",
          {
            sensitivity:
              "base",
          },
        );
    },
  );
}

export async function getD1Availability({
  minimumDate,
  passengers,
}: {
  minimumDate:
    string;

  passengers:
    number;
}): Promise<D1AvailabilityResult> {
  const normalizedMinimumDate =
    normalizeD1AvailabilityMinimumDate(
      minimumDate,
    );

  const normalizedPassengers =
    normalizeD1AvailabilityPassengers(
      passengers,
    );

  const db =
    getD1();

  /*
   * Keep the Appwrite public lookup
   * contract exactly:
   *
   * 1. Inventory scope is OPEN +
   *    active inventory only.
   * 2. More than 500 such inventory
   *    rows is an error BEFORE
   *    travel-date/passenger filtering.
   * 3. Relationships and public seat
   *    eligibility are evaluated after
   *    that bounded inventory scope.
   *
   * COUNT(*) OVER() preserves the
   * pre-filter inventory total while
   * LIMIT 501 gives us one overflow row.
   *
   * LEFT JOIN is intentional:
   * broken/missing relationships must
   * not remove inventory from the
   * 500-row lookup accounting, but such
   * rows are excluded from the final
   * public route/date response.
   */
  let rows:
    D1AvailabilityJoinedRow[];

  try {
    const result =
      await db
        .prepare(`
          WITH open_inventory AS (
            SELECT
              i.id,
              i.travelDate,
              i.seatCapacity,
              i.bookedSeats,
              i.heldSeats,
              i.scheduleId,
              i.operatorId,
              i.vesselId,
              i.routeId,

              COUNT(*) OVER () AS
                openActiveTotal

            FROM trip_inventory AS i

            WHERE
              i.salesStatus = 'OPEN'
              AND i.isActive = 1

            LIMIT ${D1_AVAILABILITY_FETCH_LIMIT}
          )

          SELECT
            i.id AS inventoryId,
            i.travelDate AS travelDate,
            i.seatCapacity AS seatCapacity,
            i.bookedSeats AS bookedSeats,
            i.heldSeats AS heldSeats,

            i.scheduleId AS
              inventoryScheduleId,

            i.operatorId AS
              inventoryOperatorId,

            i.vesselId AS
              inventoryVesselId,

            i.routeId AS
              inventoryRouteId,

            i.openActiveTotal AS
              openActiveTotal,

            s.id AS joinedScheduleId,
            s.operatorId AS
              scheduleOperatorId,
            s.vesselId AS
              scheduleVesselId,
            s.routeId AS
              scheduleRouteId,
            s.isActive AS
              scheduleIsActive,

            o.id AS joinedOperatorId,
            o.isActive AS
              operatorIsActive,

            v.id AS joinedVesselId,
            v.operatorId AS
              vesselOperatorId,
            v.isActive AS
              vesselIsActive,

            r.id AS joinedRouteId,
            r.fromPort AS
              routeFromPort,
            r.toPort AS
              routeToPort,
            r.isActive AS
              routeIsActive

          FROM open_inventory AS i

          LEFT JOIN trip_schedules AS s
            ON s.id = i.scheduleId

          LEFT JOIN operators AS o
            ON o.id = i.operatorId

          LEFT JOIN vessels AS v
            ON v.id = i.vesselId

          LEFT JOIN routes AS r
            ON r.id = i.routeId
        `)
        .all<D1AvailabilityJoinedRow>();

    rows =
      result.results;
  } catch (error) {
    if (
      error instanceof
      D1AvailabilityError
    ) {
      throw error;
    }

    throw new D1AvailabilityError(
      "DATABASE",
      error instanceof Error
        ? error.message
        : "Trip availability could not be loaded.",
    );
  }

  const openActiveTotal =
    rows.length > 0
      ? toD1AvailabilityInteger(
          rows[0]
            .openActiveTotal,
        )
      : 0;

  if (
    openActiveTotal ===
    null
  ) {
    throw new D1AvailabilityError(
      "DATABASE",
      "Trip availability could not be loaded.",
    );
  }

  if (
    openActiveTotal >
    D1_AVAILABILITY_LOOKUP_LIMIT
  ) {
    throw new D1AvailabilityError(
      "LIMIT",
      "Availability inventory exceeds the public lookup limit.",
    );
  }

  const routeDates =
    new Map<
      string,
      {
        fromPort:
          string;

        toPort:
          string;

        dates:
          Set<string>;
      }
    >();

  for (
    const row
    of rows
  ) {
    const travelDate =
      cleanD1AvailabilityText(
        row.travelDate,
      );

    if (
      !travelDate ||
      travelDate <
        normalizedMinimumDate
    ) {
      continue;
    }

    const seatCapacity =
      toD1AvailabilityInteger(
        row.seatCapacity,
      );

    const bookedSeats =
      toD1AvailabilityInteger(
        row.bookedSeats,
      );

    const heldSeats =
      toD1AvailabilityInteger(
        row.heldSeats,
      );

    if (
      seatCapacity === null ||
      bookedSeats === null ||
      heldSeats === null ||
      seatCapacity < 0 ||
      bookedSeats < 0 ||
      heldSeats < 0
    ) {
      continue;
    }

    const availableSeats =
      seatCapacity -
      bookedSeats -
      heldSeats;

    if (
      availableSeats <
      normalizedPassengers
    ) {
      continue;
    }

    const scheduleId =
      cleanD1AvailabilityText(
        row.inventoryScheduleId,
      );

    const operatorId =
      cleanD1AvailabilityText(
        row.inventoryOperatorId,
      );

    const vesselId =
      cleanD1AvailabilityText(
        row.inventoryVesselId,
      );

    const routeId =
      cleanD1AvailabilityText(
        row.inventoryRouteId,
      );

    if (
      !scheduleId ||
      !operatorId ||
      !vesselId ||
      !routeId
    ) {
      continue;
    }

    if (
      cleanD1AvailabilityText(
        row.joinedScheduleId,
      ) !== scheduleId ||
      cleanD1AvailabilityText(
        row.joinedOperatorId,
      ) !== operatorId ||
      cleanD1AvailabilityText(
        row.joinedVesselId,
      ) !== vesselId ||
      cleanD1AvailabilityText(
        row.joinedRouteId,
      ) !== routeId
    ) {
      continue;
    }

    if (
      !isD1AvailabilityActive(
        row.scheduleIsActive,
      ) ||
      !isD1AvailabilityActive(
        row.operatorIsActive,
      ) ||
      !isD1AvailabilityActive(
        row.vesselIsActive,
      ) ||
      !isD1AvailabilityActive(
        row.routeIsActive,
      )
    ) {
      continue;
    }

    if (
      cleanD1AvailabilityText(
        row.scheduleOperatorId,
      ) !== operatorId ||
      cleanD1AvailabilityText(
        row.scheduleVesselId,
      ) !== vesselId ||
      cleanD1AvailabilityText(
        row.scheduleRouteId,
      ) !== routeId ||
      cleanD1AvailabilityText(
        row.vesselOperatorId,
      ) !== operatorId
    ) {
      continue;
    }

    const fromPort =
      cleanD1AvailabilityText(
        row.routeFromPort,
      );

    const toPort =
      cleanD1AvailabilityText(
        row.routeToPort,
      );

    if (
      !fromPort ||
      !toPort
    ) {
      continue;
    }

    const key =
      `${fromPort}\u0000${toPort}`;

    const existing =
      routeDates.get(
        key,
      );

    if (
      existing
    ) {
      existing.dates.add(
        travelDate,
      );
    } else {
      routeDates.set(
        key,
        {
          fromPort,
          toPort,
          dates:
            new Set([
              travelDate,
            ]),
        },
      );
    }
  }

  const routes =
    sortD1AvailabilityRoutes(
      Array.from(
        routeDates.values(),
      ).map(
        (
          route,
        ): D1AvailabilityRoute => ({
          fromPort:
            route.fromPort,

          toPort:
            route.toPort,

          dates:
            Array.from(
              route.dates,
            ).sort(),
        }),
      ),
    );

  const origins =
    [
      ...new Set(
        routes.map(
          (route) =>
            route.fromPort,
        ),
      ),
    ].sort(
      (
        first,
        second,
      ) =>
        first.localeCompare(
          second,
          "en",
          {
            sensitivity:
              "base",
          },
        ),
    );

  return {
    minimumDate:
      normalizedMinimumDate,

    passengers:
      normalizedPassengers,

    origins,
    routes,
  };
}
