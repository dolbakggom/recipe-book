# Recipe Book Local MVP Design

## Context

The current workspace contains the product plan in `develop-plan.md` and no application code yet. The first implementation target is a local, single-user MVP for a recipe book web app centered on Kitchens, Recipes, and reusable Ingredient blocks.

The MVP should validate the product's core behavior before adding hosted services, authentication, team collaboration, or external storage.

## Decisions

- Build a local single-user MVP first.
- Use Next.js App Router, TypeScript, Prisma, SQLite, and server actions or route handlers.
- Store uploaded representative images in `public/uploads`.
- Store image paths in the database as `/uploads/...`.
- Keep upload handling behind a helper or server action so the app can later swap to S3, Supabase Storage, or another external service.
- Defer authentication, collaboration, edit permissions, hosted database setup, and external object storage until the core features are working.

## Application Structure

The app will use `src/app` for routing and page composition.

Required routes:

- `/` redirects to or renders the Kitchen list.
- `/kitchens` lists Kitchens and supports creating a Kitchen.
- `/kitchens/[id]` shows the selected Kitchen's recipe gallery.
- `/kitchens/[id]/recipes/[recipeId]` shows and edits one Recipe.
- `/ingredients` manages Ingredient blocks across the local app, with Kitchen filtering as the default view.
- `/ingredients/[id]` shows one Ingredient and the Recipes that use it.
- `/shared/[shareId]` renders a read-only shared Recipe or Kitchen.

Shared infrastructure:

- `src/lib/db.ts` exposes the Prisma client.
- Domain-specific server actions or route handlers handle Kitchen, Recipe, Ingredient, RecipeIngredient, RecipeStep, ShareLink, and upload operations.
- Components should be small and domain-oriented so later visual styling work can replace CSS without rewriting data behavior.
- MVP styling should be mobile-first, restrained, and functional.

## Data Model

The Prisma schema should reflect the plan's core entities.

`Kitchen`

- `id`
- `name`
- `description`
- `coverImage`
- `type`
- `visibility`
- `createdAt`
- `updatedAt`
- has many `Recipe`
- has many `Ingredient`

`Recipe`

- `id`
- `kitchenId`
- `title`
- `description`
- `coverImage`
- `markdownContent`
- `createdAt`
- `updatedAt`
- belongs to `Kitchen`
- has many `RecipeIngredient`
- has many `RecipeStep`

`Ingredient`

- `id`
- `kitchenId`
- `name`
- `category`
- `defaultUnit`
- `description`
- `allergenInfo`
- `createdAt`
- `updatedAt`
- belongs to `Kitchen`
- has many `RecipeIngredient`

`RecipeIngredient`

- `id`
- `recipeId`
- `ingredientId`
- `amount`
- `unit`
- `note`
- `order`
- belongs to `Recipe`
- belongs to `Ingredient`

`RecipeStep`

- `id`
- `recipeId`
- `title`
- `description`
- `order`
- belongs to `Recipe`

`ShareLink`

- `id`
- `type`
- `targetId`
- `token`
- `permission`
- `expiresAt`
- `createdAt`

`ShareLink.type` starts with `RECIPE` and `KITCHEN`. `ShareLink.permission` starts with view-only access.

## Core Flows

Kitchen flow:

1. Create, edit, and delete Kitchens.
2. Show Kitchens as mobile-first cards.
3. Enter a Kitchen to view its recipe gallery.

Recipe flow:

1. Create, edit, and delete Recipes within a Kitchen.
2. Attach or change a representative image.
3. Edit title, description, Markdown content, Ingredient blocks, and cooking steps.
4. Render a recipe detail page that supports viewing and editing the same core data.

Ingredient flow:

1. Create, edit, and delete Ingredients within a Kitchen.
2. Add existing Ingredients to a Recipe as ordered RecipeIngredient rows.
3. Store recipe-specific amount, unit, and note on RecipeIngredient.
4. Link every Ingredient block in a Recipe to `/ingredients/[id]`.
5. On `/ingredients/[id]`, show the Ingredient details and all Recipes using it.
6. The main Ingredient list defaults to the active or selected Kitchen while still allowing all-Kitchen search in the local MVP.

Sharing flow:

1. Generate a view-only Recipe share link.
2. Generate a view-only Kitchen share link.
3. Resolve `/shared/[shareId]` by token or share id.
4. Render shared content read-only.
5. Show a clear message for expired or missing ShareLinks.

## Editing UX

The MVP editor should be useful without becoming a complex block editor.

- Recipe editing happens on one page.
- Basic fields, Ingredient blocks, Recipe steps, and Markdown content are editable together.
- Ingredient search or selection should support adding existing Ingredient blocks.
- A new Ingredient can be created when the needed block does not exist.
- RecipeIngredient rows support amount, unit, note, and order.
- Ordering can start with up/down controls if drag and drop adds too much implementation weight.
- The Markdown editor can start as a textarea plus rendered preview, then later move to a richer editor.

## Error Handling

- Required field errors are shown near the relevant form.
- Missing Kitchen, Recipe, Ingredient, or ShareLink records use `notFound()` or a clear fallback screen.
- Expired share links render a dedicated expired-link message.
- Delete actions require a confirmation step.
- Upload failures should keep the form usable and report the problem clearly.

## Testing And Verification

Verification should focus on the core product path:

1. Validate the Prisma schema.
2. Run linting.
3. Test domain actions for create, update, delete, and relationship queries where practical.
4. Verify the main browser flow: create Kitchen, create Recipe, create or add Ingredient, confirm Ingredient detail shows connected Recipes, create share link, and view shared content.

## Out Of Scope For This MVP

- User accounts and login.
- Team invitations.
- Collaborative editing.
- Edit permissions on shared links.
- Password-protected shares.
- External database hosting.
- External image storage.
- Version history.
- Recipe change logs.
- Cost calculation.
- Inventory management.
- PDF export.
- Native app packaging.

## Handoff Notes

Antigravity can later focus on visual polish and responsive CSS after Codex has built the working data model, routes, server actions, and functional MVP screens.
