export const paths = {
  kitchens: () => "/kitchens",
  kitchen: (kitchenId: string) => `/kitchens/${kitchenId}`,
  newRecipe: (kitchenId: string) => `/kitchens/${kitchenId}/recipes/new`,
  recipe: (kitchenId: string, recipeId: string) =>
    `/kitchens/${kitchenId}/recipes/${recipeId}`,
  ingredients: (kitchenId?: string) =>
    kitchenId ? `/ingredients?kitchenId=${kitchenId}` : "/ingredients",
  ingredient: (ingredientId: string) => `/ingredients/${ingredientId}`,
  shared: (token: string) => `/shared/${token}`
};
