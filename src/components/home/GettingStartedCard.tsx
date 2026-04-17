import { useNavigate } from 'react-router-dom';

interface Action {
  icon: string;
  title: string;
  sub: string;
  onClick: () => void;
}

interface Props {
  onWeighIn: () => void;
}

export default function GettingStartedCard({ onWeighIn }: Props) {
  const navigate = useNavigate();

  const actions: Action[] = [
    {
      icon: 'monitor_weight',
      title: 'Me peser aujourd\u2019hui',
      sub: 'Lance le suivi — une pesée suffit',
      onClick: onWeighIn,
    },
    {
      icon: 'restaurant',
      title: 'Ajouter un repas',
      sub: 'Log ton premier plat ou aliment',
      onClick: () => navigate('/meals'),
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
        <div>
          <h2 className="getstart-t">Premiers pas</h2>
          <p className="getstart-s">Choisis une action pour démarrer</p>
        </div>
      </div>
      <div className="getstart-list">
        {actions.map((a) => (
          <button
            key={a.title}
            type="button"
            className="getstart-item"
            onClick={a.onClick}
          >
            <span className="material-symbols-outlined getstart-item-ico">
              {a.icon}
            </span>
            <span className="getstart-item-text">
              <span className="getstart-item-t">{a.title}</span>
              <span className="getstart-item-s">{a.sub}</span>
            </span>
            <span className="material-symbols-outlined getstart-item-chev">
              chevron_right
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
