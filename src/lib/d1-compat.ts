export type D1SystemFields = {
  id: string;
  createdAt: string;
  updatedAt: string;
};

export type AppwriteCompatSystemFields = {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
};

export function toAppwriteCompatSystemFields(
  row: D1SystemFields
): AppwriteCompatSystemFields {
  return {
    $id: row.id,
    $createdAt: row.createdAt,
    $updatedAt: row.updatedAt,
  };
}
