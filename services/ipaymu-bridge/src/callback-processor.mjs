const supportedPaymentStates =
  new Set([
    "success",
    "pending",
    "expired",
    "unknown",
  ]);

export class CallbackProcessorError
  extends Error {
  constructor(code, message) {
    super(message);

    this.name =
      "CallbackProcessorError";

    this.code = code;
  }
}

function fail(code, message) {
  throw new CallbackProcessorError(
    code,
    message,
  );
}

function requireText(value, label) {
  if (typeof value !== "string") {
    fail(
      "INVALID_CALLBACK_EVENT",
      `${label} must be a string.`,
    );
  }

  const cleaned = value.trim();

  if (!cleaned) {
    fail(
      "INVALID_CALLBACK_EVENT",
      `${label} must not be empty.`,
    );
  }

  return cleaned;
}

function optionalText(value) {
  if (value == null) {
    return null;
  }

  if (typeof value !== "string") {
    return null;
  }

  const cleaned = value.trim();

  return cleaned || null;
}

function normalizeCallbackEvent(event) {
  if (
    event === null
    || typeof event !== "object"
    || Array.isArray(event)
  ) {
    fail(
      "INVALID_CALLBACK_EVENT",
      "Callback event must be an object.",
    );
  }

  const paymentState =
    requireText(
      event.paymentState,
      "paymentState",
    );

  if (
    !supportedPaymentStates.has(
      paymentState,
    )
  ) {
    fail(
      "INVALID_CALLBACK_EVENT",
      "Unsupported paymentState.",
    );
  }

  if (
    !Number.isSafeInteger(
      event.trxId,
    )
  ) {
    fail(
      "INVALID_CALLBACK_EVENT",
      "trxId must be a safe integer.",
    );
  }

  return {
    idempotencyKey:
      requireText(
        event.idempotencyKey,
        "idempotencyKey",
      ),

    referenceId:
      requireText(
        event.referenceId,
        "referenceId",
      ),

    paymentState,
    trxId: event.trxId,

    sessionId:
      optionalText(
        event.sessionId,
      ),

    externalId:
      optionalText(
        event.externalId,
      ),

    timestamp:
      optionalText(
        event.timestamp,
      ),

    statusCode:
      event.statusCode,

    transactionStatusCode:
      event.transactionStatusCode,

    paidOff:
      event.paidOff ?? null,
  };
}

function normalizeBooking(
  booking,
  referenceId,
) {
  if (
    booking === null
    || typeof booking !== "object"
    || Array.isArray(booking)
  ) {
    fail(
      "INVALID_BOOKING",
      "Booking must be an object.",
    );
  }

  const bookingId =
    optionalText(booking.$id)
    ?? optionalText(booking.id);

  if (!bookingId) {
    fail(
      "INVALID_BOOKING",
      "Booking ID is missing.",
    );
  }

  const bookingCode =
    requireText(
      booking.bookingCode,
      "booking.bookingCode",
    );

  if (bookingCode !== referenceId) {
    fail(
      "BOOKING_REFERENCE_MISMATCH",
      "Callback reference does not match bookingCode.",
    );
  }

  return {
    bookingId,
    bookingCode,

    bookingStatus:
      requireText(
        booking.bookingStatus,
        "booking.bookingStatus",
      ),

    paymentStatus:
      requireText(
        booking.paymentStatus,
        "booking.paymentStatus",
      ),
  };
}

function basePlan(
  event,
  booking,
) {
  return {
    referenceId:
      event.referenceId,

    bookingId:
      booking.bookingId,

    bookingCode:
      booking.bookingCode,

    paymentState:
      event.paymentState,

    currentBookingStatus:
      booking.bookingStatus,

    currentPaymentStatus:
      booking.paymentStatus,
  };
}

export function
buildCallbackLifecyclePlan({
  event,
  booking,
} = {}) {
  const normalizedEvent =
    normalizeCallbackEvent(event);

  const normalizedBooking =
    normalizeBooking(
      booking,
      normalizedEvent.referenceId,
    );

  const base = basePlan(
    normalizedEvent,
    normalizedBooking,
  );

  const currentBookingStatus =
    normalizedBooking.bookingStatus;

  const currentPaymentStatus =
    normalizedBooking.paymentStatus;

  if (
    normalizedEvent.paymentState
      === "success"
  ) {
    if (
      (
        currentBookingStatus
          === "Confirmed"
        || currentBookingStatus
          === "Completed"
      )
      && currentPaymentStatus
        === "Paid"
    ) {
      return {
        ...base,
        kind: "noop",
        duplicate: true,
        seatAction: "none",
        nextBookingStatus:
          currentBookingStatus,
        nextPaymentStatus:
          currentPaymentStatus,
        reason:
          "PAYMENT_ALREADY_CONFIRMED",
      };
    }

    if (
      currentBookingStatus
        === "Pending"
      && currentPaymentStatus
        === "Pending"
    ) {
      return {
        ...base,
        kind: "transition",
        duplicate: false,
        seatAction:
          "held-to-booked",
        nextBookingStatus:
          "Confirmed",
        nextPaymentStatus:
          "Paid",
        reason:
          "PAYMENT_SUCCEEDED",
      };
    }

    if (
      currentBookingStatus
        === "Cancelled"
    ) {
      return {
        ...base,
        kind:
          "manual-review",
        duplicate: false,
        seatAction: "none",
        nextBookingStatus:
          currentBookingStatus,
        nextPaymentStatus:
          currentPaymentStatus,
        reason:
          "LATE_SUCCESS_AFTER_SEAT_RELEASE",
      };
    }

    return {
      ...base,
      kind:
        "manual-review",
      duplicate: false,
      seatAction: "none",
      nextBookingStatus:
        currentBookingStatus,
      nextPaymentStatus:
        currentPaymentStatus,
      reason:
        "INCOMPATIBLE_SUCCESS_STATE",
    };
  }

  if (
    normalizedEvent.paymentState
      === "pending"
  ) {
    if (
      currentBookingStatus
        === "Pending"
      && currentPaymentStatus
        === "Pending"
    ) {
      return {
        ...base,
        kind: "noop",
        duplicate: true,
        seatAction: "none",
        nextBookingStatus:
          "Pending",
        nextPaymentStatus:
          "Pending",
        reason:
          "BOOKING_ALREADY_PENDING",
      };
    }

    return {
      ...base,
      kind: "ignored",
      duplicate: true,
      seatAction: "none",
      nextBookingStatus:
        currentBookingStatus,
      nextPaymentStatus:
        currentPaymentStatus,
      reason:
        "STALE_PENDING_CALLBACK",
    };
  }

  if (
    normalizedEvent.paymentState
      === "expired"
  ) {
    if (
      currentBookingStatus
        === "Cancelled"
    ) {
      return {
        ...base,
        kind: "noop",
        duplicate: true,
        seatAction: "none",
        nextBookingStatus:
          currentBookingStatus,
        nextPaymentStatus:
          currentPaymentStatus,
        reason:
          "BOOKING_ALREADY_CANCELLED",
      };
    }

    if (
      currentBookingStatus
        === "Pending"
      && currentPaymentStatus
        === "Pending"
    ) {
      return {
        ...base,
        kind: "transition",
        duplicate: false,
        seatAction:
          "release-held",
        nextBookingStatus:
          "Cancelled",
        nextPaymentStatus:
          "Pending",
        reason:
          "PAYMENT_EXPIRED",
      };
    }

    if (
      currentBookingStatus
        === "Confirmed"
      || currentBookingStatus
        === "Completed"
    ) {
      return {
        ...base,
        kind: "ignored",
        duplicate: true,
        seatAction: "none",
        nextBookingStatus:
          currentBookingStatus,
        nextPaymentStatus:
          currentPaymentStatus,
        reason:
          "STALE_EXPIRED_CALLBACK",
      };
    }

    return {
      ...base,
      kind:
        "manual-review",
      duplicate: false,
      seatAction: "none",
      nextBookingStatus:
        currentBookingStatus,
      nextPaymentStatus:
        currentPaymentStatus,
      reason:
        "INCOMPATIBLE_EXPIRED_STATE",
    };
  }

  return {
    ...base,
    kind:
      "manual-review",
    duplicate: false,
    seatAction: "none",
    nextBookingStatus:
      currentBookingStatus,
    nextPaymentStatus:
      currentPaymentStatus,
    reason:
      "UNKNOWN_PROVIDER_STATUS",
  };
}

export function createCallbackProcessor({
  findBookingByCodeImpl,
  applyLifecycleImpl,
} = {}) {
  if (
    typeof findBookingByCodeImpl
      !== "function"
  ) {
    throw new TypeError(
      "findBookingByCodeImpl must be a function.",
    );
  }

  if (
    typeof applyLifecycleImpl
      !== "function"
  ) {
    throw new TypeError(
      "applyLifecycleImpl must be a function.",
    );
  }

  return async function
  processCallback(event) {
    const normalizedEvent =
      normalizeCallbackEvent(event);

    const bookings =
      await findBookingByCodeImpl(
        normalizedEvent.referenceId,
      );

    if (!Array.isArray(bookings)) {
      fail(
        "INVALID_BOOKING_LOOKUP_RESULT",
        "Booking lookup must return an array.",
      );
    }

    if (bookings.length === 0) {
      fail(
        "BOOKING_NOT_FOUND",
        "Callback booking could not be found.",
      );
    }

    if (bookings.length !== 1) {
      fail(
        "BOOKING_LOOKUP_NOT_UNIQUE",
        "Callback booking lookup is not unique.",
      );
    }

    const plan =
      buildCallbackLifecyclePlan({
        event: normalizedEvent,
        booking: bookings[0],
      });

    if (plan.kind !== "transition") {
      return {
        ...plan,
        applied: false,
      };
    }

    const result =
      await applyLifecycleImpl({
        bookingId:
          plan.bookingId,

        bookingCode:
          plan.bookingCode,

        idempotencyKey:
          normalizedEvent
            .idempotencyKey,

        providerTrxId:
          normalizedEvent.trxId,

        providerSessionId:
          normalizedEvent.sessionId,

        providerExternalId:
          normalizedEvent.externalId,

        providerTimestamp:
          normalizedEvent.timestamp,

        paymentState:
          normalizedEvent.paymentState,

        statusCode:
          normalizedEvent.statusCode,

        transactionStatusCode:
          normalizedEvent
            .transactionStatusCode,

        paidOff:
          normalizedEvent.paidOff,

        currentBookingStatus:
          plan.currentBookingStatus,

        currentPaymentStatus:
          plan.currentPaymentStatus,

        seatAction:
          plan.seatAction,

        nextBookingStatus:
          plan.nextBookingStatus,

        nextPaymentStatus:
          plan.nextPaymentStatus,
      });

    if (
      result === null
      || typeof result !== "object"
      || Array.isArray(result)
    ) {
      fail(
        "INVALID_LIFECYCLE_RESULT",
        "Lifecycle mutation result must be an object.",
      );
    }

    return {
      ...plan,
      applied: true,

      duplicate:
        Boolean(result.duplicate),
    };
  };
}
