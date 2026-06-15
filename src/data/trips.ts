export type Trip = {
  id: string
  operator: string
  from: string
  to: string
  departureTime: string
  arrivalTime: string
  duration: string
  price: number
  availableSeats: number
  checkInLocation: string
  facilities: string[]
}

export const trips: Trip[] = [
  {
    id: "BW001",
    operator: "BlueWave Express",
    from: "Padang Bai",
    to: "Gili Trawangan",
    departureTime: "08:30",
    arrivalTime: "10:00",
    duration: "1 hour 30 minutes",
    price: 350000,
    availableSeats: 18,
    checkInLocation: "Padang Bai Harbour",
    facilities: [
      "Air-conditioned cabin",
      "Life jackets",
      "Luggage",
    ],
  },
  {
    id: "IJ002",
    operator: "IslandJet",
    from: "Padang Bai",
    to: "Gili Trawangan",
    departureTime: "09:30",
    arrivalTime: "11:00",
    duration: "1 hour 30 minutes",
    price: 375000,
    availableSeats: 12,
    checkInLocation: "Padang Bai Harbour",
    facilities: [
      "Air-conditioned cabin",
      "Luggage",
      "Mineral water",
    ],
  },
  {
    id: "GM003",
    operator: "GiliMarine",
    from: "Padang Bai",
    to: "Gili Air",
    departureTime: "08:45",
    arrivalTime: "10:30",
    duration: "1 hour 45 minutes",
    price: 365000,
    availableSeats: 20,
    checkInLocation: "Padang Bai Harbour",
    facilities: [
      "Life jackets",
      "Luggage",
      "Open deck",
    ],
  },
  {
    id: "OL004",
    operator: "OceanLink Fast Boat",
    from: "Sanur",
    to: "Nusa Penida",
    departureTime: "07:30",
    arrivalTime: "08:15",
    duration: "45 minutes",
    price: 175000,
    availableSeats: 25,
    checkInLocation: "Sanur Harbour",
    facilities: [
      "Life jackets",
      "Luggage",
      "Air-conditioned cabin",
    ],
  },
  {
    id: "BW005",
    operator: "BlueWave Express",
    from: "Sanur",
    to: "Nusa Penida",
    departureTime: "09:00",
    arrivalTime: "09:45",
    duration: "45 minutes",
    price: 190000,
    availableSeats: 14,
    checkInLocation: "Sanur Harbour",
    facilities: [
      "Air-conditioned cabin",
      "Luggage",
      "Mineral water",
    ],
  },
  {
    id: "IJ006",
    operator: "IslandJet",
    from: "Serangan",
    to: "Gili Air",
    departureTime: "09:00",
    arrivalTime: "11:30",
    duration: "2 hours 30 minutes",
    price: 425000,
    availableSeats: 9,
    checkInLocation: "Serangan Harbour",
    facilities: [
      "Air-conditioned cabin",
      "Luggage",
      "Hotel pickup",
    ],
  },
  {
    id: "GM007",
    operator: "GiliMarine",
    from: "Gili Trawangan",
    to: "Padang Bai",
    departureTime: "11:30",
    arrivalTime: "13:00",
    duration: "1 hour 30 minutes",
    price: 350000,
    availableSeats: 16,
    checkInLocation: "Gili Trawangan Harbour",
    facilities: [
      "Life jackets",
      "Luggage",
      "Open deck",
    ],
  },
  {
    id: "OL008",
    operator: "OceanLink Fast Boat",
    from: "Bangsal Lombok",
    to: "Gili Trawangan",
    departureTime: "10:00",
    arrivalTime: "10:30",
    duration: "30 minutes",
    price: 125000,
    availableSeats: 30,
    checkInLocation: "Bangsal Harbour",
    facilities: [
      "Life jackets",
      "Luggage",
    ],
  },
]