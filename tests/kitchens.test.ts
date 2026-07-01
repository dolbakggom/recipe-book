import { describe, expect, it } from "vitest";
import {
  createKitchen,
  deleteKitchen,
  listKitchens,
  updateKitchen
} from "@/features/kitchens/data";
import { withTestDb } from "./helpers/test-db";

describe("kitchen data", () => {
  it("creates, lists, updates, and deletes a kitchen", async () => {
    await withTestDb(async (db) => {
      const created = await createKitchen(
        {
          name: "OO식당 Kitchen",
          description: "매장용 레시피북",
          type: "STORE",
          visibility: "PRIVATE"
        },
        db
      );

      expect(created.name).toBe("OO식당 Kitchen");

      const list = await listKitchens(db);
      expect(list).toHaveLength(1);
      expect(list[0].description).toBe("매장용 레시피북");

      const updated = await updateKitchen(
        created.id,
        {
          name: "OO식당 본점",
          description: "본점 레시피북",
          type: "STORE",
          visibility: "PRIVATE"
        },
        db
      );
      expect(updated.name).toBe("OO식당 본점");

      await deleteKitchen(created.id, db);
      await expect(listKitchens(db)).resolves.toHaveLength(0);
    });
  });

  it("rejects an empty kitchen name", async () => {
    await withTestDb(async (db) => {
      await expect(
        createKitchen(
          {
            name: "",
            description: "",
            type: "PERSONAL",
            visibility: "PRIVATE"
          },
          db
        )
      ).rejects.toThrow("Kitchen name is required");
    });
  });
});
