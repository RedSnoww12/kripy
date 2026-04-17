import { useNutritionStore } from '@/store/useNutritionStore';
import { toast } from '@/components/ui/toastStore';
import type { FoodTuple } from '@/types';

interface Props {
  onEdit: (name: string, tuple: FoodTuple) => void;
}

export default function RecipeList({ onEdit }: Props) {
  const recipes = useNutritionStore((s) => s.recipes);
  const setRecipes = useNutritionStore((s) => s.setRecipes);

  const names = Object.keys(recipes);

  const handleDelete = (name: string) => {
    const next = { ...recipes };
    delete next[name];
    setRecipes(next);
    toast(`${name} supprimée`, 'info');
  };

  if (names.length === 0) {
    return (
      <section className="rcp-list-wrap">
        <div className="rcp-list-head">
          <h3 className="rcp-list-l">Vos créations</h3>
          <span className="rcp-list-count">0 RECETTE</span>
        </div>
        <div className="rcp-empty">
          <div className="rcp-empty-ico">
            <span className="material-symbols-outlined">menu_book</span>
          </div>
          <h4>Aucune recette encore</h4>
          <p>Commence à construire ta base de données personnalisée.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="rcp-list-wrap">
      <div className="rcp-list-head">
        <h3 className="rcp-list-l">Vos créations</h3>
        <span className="rcp-list-count">
          {names.length} {names.length === 1 ? 'RECETTE' : 'RECETTES'}
        </span>
      </div>
      <div id="rcList">
        {names.map((name) => {
          const tuple = recipes[name];
          const [kcal, p, g, l, f] = tuple;
          return (
            <div key={name} className="rc-item">
              <div
                className="rc-body"
                onClick={() => onEdit(name, tuple)}
                style={{ cursor: 'pointer' }}
              >
                <div className="rc-h">
                  <h4 className="rc-name">{name}</h4>
                  <span className="rc-kcal">{kcal} kcal</span>
                </div>
                <div className="rc-macs">
                  <div className="rc-m">
                    <span className="rc-l">Prot</span>
                    <span className="rc-v rc-v-p">{p}g</span>
                  </div>
                  <div className="rc-m">
                    <span className="rc-l">Gluc</span>
                    <span className="rc-v rc-v-g">{g}g</span>
                  </div>
                  <div className="rc-m">
                    <span className="rc-l">Lip</span>
                    <span className="rc-v rc-v-l">{l}g</span>
                  </div>
                  <div className="rc-m">
                    <span className="rc-l">Fib</span>
                    <span className="rc-v rc-v-f">{f}g</span>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <button
                  type="button"
                  className="rc-del"
                  aria-label={`Modifier ${name}`}
                  onClick={() => onEdit(name, tuple)}
                  style={{ color: 'var(--acc)' }}
                >
                  <span className="material-symbols-outlined">edit</span>
                </button>
                <button
                  type="button"
                  className="rc-del"
                  aria-label={`Supprimer ${name}`}
                  onClick={() => handleDelete(name)}
                >
                  <span className="material-symbols-outlined">delete</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
