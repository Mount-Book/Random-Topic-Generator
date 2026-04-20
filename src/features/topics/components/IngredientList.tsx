type IngredientListProps = {
  ingredients: string[]
  topicId: number
}

export const IngredientList = ({ ingredients, topicId }: IngredientListProps) => (
  <ul className="ingredient-list" aria-label="使用ワード">
    {ingredients.map((ingredient) => (
      <li key={`${topicId}-${ingredient}`}>{ingredient}</li>
    ))}
  </ul>
)
