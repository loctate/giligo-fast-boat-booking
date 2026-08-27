"use client"

import Link, {
  type LinkProps,
} from "next/link"

import {
  type ReactNode,
} from "react"

import {
  pushAnalyticsEvent,
} from "@/lib/analytics"

type TrackedTripLinkProps = {
  href: LinkProps["href"]
  className?: string
  children: ReactNode

  itemId: string
  itemName: string
  operatorName: string
  price: number
  currency: string

  vesselName?: string
  scheduleCode?: string

  routeFrom: string
  routeTo: string
  travelDate: string
  tripType: string
  passengerCount: number

  itemListId?: string
  itemListName?: string
}

export default function TrackedTripLink({
  href,
  className,
  children,

  itemId,
  itemName,
  operatorName,
  price,
  currency,

  vesselName,
  scheduleCode,

  routeFrom,
  routeTo,
  travelDate,
  tripType,
  passengerCount,

  itemListId =
    "fast_boat_search_results",

  itemListName =
    "Fast boat search results",
}: TrackedTripLinkProps) {
  function handleClick() {
    pushAnalyticsEvent(
      "select_item",
      {
        item_list_id:
          itemListId,

        item_list_name:
          itemListName,

        route_from:
          routeFrom,

        route_to:
          routeTo,

        travel_date:
          travelDate,

        trip_type:
          tripType,

        passenger_count:
          passengerCount,

        currency:
          currency || "IDR",

        items: [
          {
            item_id:
              itemId,

            item_name:
              itemName,

            item_brand:
              operatorName,

            item_category:
              "Fast Boat",

            item_variant:
              vesselName ||
              scheduleCode ||
              undefined,

            item_list_id:
              itemListId,

            item_list_name:
              itemListName,

            price,
          },
        ],
      }
    )
  }

  return (
    <Link
      href={href}
      className={className}
      onClick={handleClick}
    >
      {children}
    </Link>
  )
}
