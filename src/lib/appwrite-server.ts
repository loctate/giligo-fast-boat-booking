import { Client, TablesDB } from "node-appwrite"

function getRequiredEnv(name: string): string {
  const value = process.env[name]

  if (!value) {
    throw new Error(
      `${name} belum diatur di .env.local`
    )
  }

  return value
}

const client = new Client()
  .setEndpoint(
    getRequiredEnv("APPWRITE_ENDPOINT")
  )
  .setProject(
    getRequiredEnv("APPWRITE_PROJECT_ID")
  )
  .setKey(
    getRequiredEnv("APPWRITE_API_KEY")
  )

export const tablesDB = new TablesDB(client)

export const appwriteConfig = {
  databaseId: getRequiredEnv(
    "APPWRITE_DATABASE_ID"
  ),

  bookingsTableId: getRequiredEnv(
    "APPWRITE_BOOKINGS_TABLE_ID"
  ),

  operatorsTableId: getRequiredEnv(
    "APPWRITE_OPERATORS_TABLE_ID"
  ),

  vesselsTableId: getRequiredEnv(
    "APPWRITE_VESSELS_TABLE_ID"
  ),

  routesTableId: getRequiredEnv(
    "APPWRITE_ROUTES_TABLE_ID"
  ),

  tripSchedulesTableId: getRequiredEnv(
    "APPWRITE_TRIP_SCHEDULES_TABLE_ID"
  ),

  tripInventoryTableId: getRequiredEnv(
    "APPWRITE_TRIP_INVENTORY_TABLE_ID"
  ),

}

