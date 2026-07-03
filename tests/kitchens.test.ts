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

  it("preserves omitted fields when partially updating a kitchen", async () => {
    await withTestDb(async (db) => {
      const created = await createKitchen(
        {
          name: "OO식당 Kitchen",
          description: "매장용 레시피북",
          type: "STORE",
          visibility: "SHARED"
        },
        db
      );

      const updated = await updateKitchen(created.id, { name: "Renamed" }, db);

      expect(updated.name).toBe("Renamed");
      expect(updated.description).toBe("매장용 레시피북");
      expect(updated.type).toBe("STORE");
      expect(updated.visibility).toBe("SHARED");
    });
  });

  it("accepts saved upload URLs and rejects unsupported kitchen cover images", async () => {
    await withTestDb(async (db) => {
      const created = await createKitchen(
        {
          name: "이미지 주방",
          coverImage:
            "https://abc123.public.blob.vercel-storage.com/uploads/kitchen.webp"
        },
        db
      );

      expect(created.coverImage).toBe(
        "https://abc123.public.blob.vercel-storage.com/uploads/kitchen.webp"
      );

      await expect(
        updateKitchen(
          created.id,
          {
            coverImage: "javascript:alert(1)"
          },
          db
        )
      ).rejects.toThrow("Cover image must be a saved upload URL");
    });
  });
});
