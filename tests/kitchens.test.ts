import { describe, expect, it } from "vitest";
import {
  createKitchen,
  deleteKitchenForOwner,
  deleteKitchen,
  listKitchens,
  listKitchensForOwner,
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

  it("lists only kitchens owned by the current anonymous admin", async () => {
    await withTestDb(async (db) => {
      await createKitchen(
        {
          name: "내 주방",
          ownerTokenHash: "owner-a"
        },
        db
      );
      await createKitchen(
        {
          name: "다른 사람 주방",
          ownerTokenHash: "owner-b"
        },
        db
      );
      await createKitchen(
        {
          name: "소유자 없는 이전 주방"
        },
        db
      );

      const owned = await listKitchensForOwner("owner-a", db);

      expect(owned.map((kitchen) => kitchen.name)).toEqual(["내 주방"]);
    });
  });

  it("deletes a kitchen only when the anonymous admin token matches", async () => {
    await withTestDb(async (db) => {
      const kitchen = await createKitchen(
        {
          name: "삭제 가능한 주방",
          ownerTokenHash: "owner-a"
        },
        db
      );

      await expect(
        deleteKitchenForOwner(kitchen.id, "owner-b", db)
      ).rejects.toThrow("Kitchen admin permission is required");
      await expect(
        db.kitchen.findUnique({ where: { id: kitchen.id } })
      ).resolves.not.toBeNull();

      await deleteKitchenForOwner(kitchen.id, "owner-a", db);

      await expect(
        db.kitchen.findUnique({ where: { id: kitchen.id } })
      ).resolves.toBeNull();
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
