import { useState } from 'react';
import RecipeForm from '@/components/recipes/RecipeForm';
import RecipeList from '@/components/recipes/RecipeList';
import PublicRecipeBrowser from '@/components/recipes/PublicRecipeBrowser';
import type { FoodTuple } from '@/types';
import styles from './RecipesPage.module.css';

export interface EditingRecipe {
  name: string;
  tuple: FoodTuple;
}

type Tab = 'mine' | 'public';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'mine', label: 'Mes recettes', icon: 'menu_book' },
  { id: 'public', label: 'Publiques', icon: 'public' },
];

export default function RecipesPage() {
  const [editing, setEditing] = useState<EditingRecipe | null>(null);
  const [tab, setTab] = useState<Tab>('mine');

  const openForEdit = (name: string, tuple: FoodTuple) => {
    setTab('mine');
    setEditing({ name, tuple });
  };

  return (
    <div className="tp active">
      <section className="rcp-head">
        <h1 className="rcp-title">Recettes</h1>
        <p className="rcp-sub">
          Gère ta bibliothèque nutritionnelle de précision et pioche dans celle
          de la communauté. Les recettes apparaissent dans la recherche des
          repas.
        </p>
      </section>

      <div className={styles.tabs} role="tablist">
        {TABS.map((t) => {
          const active = t.id === tab;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={active}
              className={`${styles.tab}${active ? ` ${styles.active}` : ''}`}
              onClick={() => setTab(t.id)}
            >
              <span className="material-symbols-outlined" aria-hidden>
                {t.icon}
              </span>
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'mine' ? (
        <>
          <RecipeForm editing={editing} onDone={() => setEditing(null)} />
          <RecipeList onEdit={openForEdit} />
        </>
      ) : (
        <PublicRecipeBrowser />
      )}
    </div>
  );
}
