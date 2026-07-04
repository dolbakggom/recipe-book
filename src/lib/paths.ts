export const paths = {
  kitchens: () => "/kitchens",
  kitchen: (kitchenId: string) => `/kitchens/${kitchenId}`,
  newRecipe: (kitchenId: string) => `/kitchens/${kitchenId}/recipes/new`,
  recipe: (kitchenId: string, recipeId: string) =>
    `/kitchens/${kitchenId}/recipes/${recipeId}`,
  shared: (token: string) => `/shared/${token}`,
  sharedKitchenRecipe: (token: string, recipeId: string) =>
    `/shared/${token}/recipes/${recipeId}`,
  newKitchen: () => "/kitchens/new"
};
