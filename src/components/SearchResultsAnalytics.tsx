"use client"

import {
  useEffect,
  useRef,
} from "react"

import {
  pushAnalyticsEvent,
} from "@/lib/analytics"

type SearchAnalyticsItem = {
  itemId: string
  itemName: string
  operatorName: string
  price: number
  currency: string
  vesselName?: string
  scheduleCode?: string
}

type SearchResultsAnalyticsProps = {
  from: string
  to: string
  travelDate: string
  tripType: string
  passengerCount: number
  items: SearchAnalyticsItem[]
}

export default function SearchResultsAnalytics({
  from,
  to,
  travelDate,
  tripType,
  passengerCount,
  items,
}: SearchResultsAnalyticsProps) {
  const hasTracked =
    useRef(false)

  useEffect(() => {
    if (hasTracked.current) {
      return
    }

    hasTracked.current = true

    pushAnalyticsEvent(
      "search",
      {
        search_term:
          `${from} to ${to}`,
        route_from: from,
        route_to: to,
        travel_date: travelDate,
        trip_type: tripType,
        passenger_count:
          passengerCount,
        results_count:
          items.length,
      }
    )

    if (items.length === 0) {
      return
    }

    pushAnalyticsEvent(
      "view_item_list",
      {
        item_list_id:
          "fast_boat_search_results",
        item_list_name:
          "Fast boat search results",
        currency:
          items[0]?.currency ||
          "IDR",

        route_from: from,
        route_to: to,
        travel_date: travelDate,
        trip_type: tripType,
        passenger_count:
          passengerCount,

        items:
          items.map(
            (item, index) => ({
              item_id:
                item.itemId,

              item_name:
                item.itemName,

              item_brand:
                item.operatorName,

              item_category:
                "Fast Boat",

              item_variant:
                item.vesselName ||
                item.scheduleCode ||
                undefined,

              item_list_id:
                "fast_boat_search_results",

              item_list_name:
                "Fast boat search results",

              index,
              price:
                item.price,
            })
          ),
      }
    )
  }, [
    from,
    to,
    travelDate,
    tripType,
    passengerCount,
    items,
  ])

  return null
}
