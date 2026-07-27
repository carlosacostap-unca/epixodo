export const ownerRule = '@request.auth.id != "" && owner = @request.auth.id';
export const createRule = '@request.auth.id != "" && @request.body.owner = @request.auth.id';

const common = {
  owner: { type: "relation", required: true, target: "users" },
  client_id: { type: "text", required: true },
  client_created_at: { type: "date", required: false },
  client_updated_at: { type: "date", required: false },
};

const fields = (specific) => ({ ...common, ...specific });
const relation = (target, required = true) => ({ type: "relation", required, target });
const text = (required = false) => ({ type: "text", required });
const number = (required = true) => ({ type: "number", required });
const date = (required = false) => ({ type: "date", required });
const select = (required = true) => ({ type: "select", required });
const json = () => ({ type: "json", required: false });
const bool = () => ({ type: "bool", required: false });
const editor = (required = false) => ({ type: "editor", required });

export const normalizedSchema = {
  subjects: { fields: fields({ name: text(true), horizon: select(), parent: relation("subjects", false) }) },
  subject_phases: { fields: fields({ subject: relation("subjects"), name: text(true), planned_start: text(), executed_start: text(), planned_end: text(), executed_end: text(), position: number(false) }) },
  subject_events: { fields: fields({ subject: relation("subjects"), phase: relation("subject_phases", false), kind: select(), description: text(true), event_date: text(true) }) },
  tasks: { fields: fields({ title: text(true), notes: editor(), status: select(), phase: relation("subject_phases", false), parent: relation("tasks", false), do_on: text(), due_on: text(), priority: select(), completed_at: date() }) },
  task_subjects: { fields: fields({ task: relation("tasks"), subject: relation("subjects") }) },
  finance_accounts: { fields: fields({ name: text(true), account_type: select(), currency: text(true), opening_balance_minor: number() }) },
  finance_entries: { fields: fields({ account: relation("finance_accounts"), entry_kind: select(), entry_date: text(true), description: text(true), amount_minor: number(), category: text() }) },
  finance_due_payments: { fields: fields({ account: relation("finance_accounts"), description: text(true), amount_minor: number(), due_date: text(true), category: text(), payment_status: select(), paid_at: date() }) },
  nutrition_profiles: { fields: fields({ energy_goal_kcal_milli: number(false), protein_goal_grams_milli: number(false), carbs_goal_grams_milli: number(false), fat_goal_grams_milli: number(false), fiber_goal_grams_milli: number(false), water_goal_ml: number(false), preferences: json(), allergies: json(), intolerances: json() }) },
  nutrition_foods: { fields: fields({ name: text(true), reference_quantity_milli: number(), unit: select(), energy_kcal_milli: number(), protein_grams_milli: number(), carbs_grams_milli: number(), fat_grams_milli: number(), fiber_grams_milli: number() }) },
  nutrition_recipes: { fields: fields({ name: text(true), servings_milli: number() }) },
  nutrition_recipe_ingredients: { fields: fields({ recipe: relation("nutrition_recipes"), food: relation("nutrition_foods"), quantity_milli: number(), position: number(false) }) },
  nutrition_plan_items: { fields: fields({ plan_date: text(true), meal_type: select(), food: relation("nutrition_foods", false), recipe: relation("nutrition_recipes", false), servings_milli: number() }) },
  nutrition_intake_entries: { fields: fields({ intake_date: text(true), meal_type: select(), description: text(true), quantity_milli: number(), unit_label: text(true), energy_kcal_milli: number(), protein_grams_milli: number(), carbs_grams_milli: number(), fat_grams_milli: number(), fiber_grams_milli: number(), food: relation("nutrition_foods", false), recipe: relation("nutrition_recipes", false), plan_item: relation("nutrition_plan_items", false) }) },
  nutrition_hydration_entries: { fields: fields({ entry_date: text(true), amount_ml: number() }) },
  nutrition_shopping_lists: { fields: fields({ name: text(true), start_date: text(true), end_date: text(true) }) },
  nutrition_shopping_items: { fields: fields({ shopping_list: relation("nutrition_shopping_lists"), food: relation("nutrition_foods", false), label: text(true), quantity_milli: number(), unit: select(), checked: bool(), manual: bool(), position: number(false) }) },
  location_entries: { fields: fields({ entry_date: text(true), start_time: text(true), end_time: text(true), planned_location: text(true), actual_location: text(), notes: text() }) },
  companion_conversations: { fields: fields({ title: text(true) }) },
  companion_messages: { fields: fields({ conversation: relation("companion_conversations"), role: select(), content: editor(true) }) },
  workspace_migrations: { fields: fields({ legacy_key: text(true), legacy_sha256: text(true), migration_status: select(), bucket_counts: json(), migrated_at: date(true) }) },
};

for (const [name, definition] of Object.entries(normalizedSchema)) {
  definition.requiredIndexFragments = ["owner", "client"];
  if (name === "nutrition_profiles" || name === "workspace_migrations") {
    definition.requiredIndexFragments.push("owner");
  }
}
