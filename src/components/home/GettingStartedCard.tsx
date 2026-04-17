import { useNavigate } from 'react-router-dom';

interface Action {
  icon: string;
  title: string;
  sub: string;
  onClick: () => void;
  done?: boolean;
}

interface Props {
  onWeighIn: () => void;
  hasWeight: boolean;
  hasMeal: boolean;
}

export default function GettingStartedCard({
  onWeighIn,
  hasWeight,
  hasMeal,
}: Props) {
  const navigate = useNavigate();

  const checkedCount = Number(hasWeight) + Number(hasMeal);

  const actions: Action[] = [
    {
      icon: 'monitor_weight',
      title: 'Me peser',
      sub: hasWeight
        ? 'Pesée enregistrée \u2014 bien joué'
        : 'Lance le suivi avec une première pesée',
      onClick: onWeighIn,
      done: hasWeight,
    },
    {
      icon: 'restaurant',
      title: 'Ajouter un repas',
      sub: hasMeal
        ? 'Premier repas logué \u2014 parfait'
        : 'Log ton premier plat ou aliment',
      onClick: () => navigate('/meals'),
      done: hasMeal,
    },
    {
      icon: 'monitoring',
      title: 'Voir mes stats',
      sub: 'Découvre les graphes disponibles',
      onClick: () => navigate('/stats'),
    },
  ];

  return (
    <section className="getstart">
      <div className="getstart-h">
        <span className="material-symbols-outlined getstart-ico">
          rocket_launch
        </span>
        <div className="getstart-head-text">
          <h2 className="getstart-t">Premiers pas</h2>
          <p className="getstart-s">
            {checkedCount === 0 && 'Choisis une action pour démarrer'}
            {checkedCount === 1 && 'Une étape sur deux \u2014 continue !'}
            {checkedCount === 2 && 'Tout est prêt, bienvenue \u{1F389}'}
          </p>
        </div>
        <span
          className="getstart-progress"
          aria-label={`${checkedCount} sur 2`}
        >
          {checkedCount}/2
        </span>
      </div>
      <ul className="getstart-list">
        {actions.map((a) => {
          const isCheckable = a.done !== undefined;
          const leftIcon = a.done
            ? 'check_circle'
            : isCheckable
              ? 'radio_button_unchecked'
              : a.icon;
          return (
            <li key={a.title}>
              <button
                type="button"
                className={`getstart-item${a.done ? ' done' : ''}${isCheckable ? ' checkable' : ''}`}
                onClick={a.onClick}
                aria-pressed={a.done || undefined}
              >
                <span className="material-symbols-outlined getstart-item-ico">
                  {leftIcon}
                </span>
                <span className="getstart-item-text">
                  <span className="getstart-item-t">{a.title}</span>
                  <span className="getstart-item-s">{a.sub}</span>
                </span>
                <span className="material-symbols-outlined getstart-item-chev">
                  chevron_right
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
