import type { SessionTemplate } from '@/types';

interface Props {
  templates: SessionTemplate[];
  onPickTemplate: (template: SessionTemplate) => void;
  onPickFree: () => void;
  onCancel: () => void;
}

export default function SessionPicker({
  templates,
  onPickTemplate,
  onPickFree,
  onCancel,
}: Props) {
  return (
    <section className="kl-pick">
      <div className="kl-sport-section-lbl kl-sport-section-inline">
        <span className="kl-sport-section-bar" aria-hidden />
        QUELLE SÉANCE ?
      </div>

      <div className="kl-pick-list">
        {templates.map((t) => (
          <button
            key={t.id}
            type="button"
            className="kl-pick-tpl"
            onClick={() => onPickTemplate(t)}
          >
            <span
              className="material-symbols-outlined kl-pick-tpl-ico"
              aria-hidden
            >
              fitness_center
            </span>
            <span className="kl-pick-tpl-body">
              <span className="kl-pick-tpl-name">{t.name}</span>
              <span className="kl-pick-tpl-sub">
                {t.exercises.length} exercice{t.exercises.length > 1 ? 's' : ''}
              </span>
            </span>
            <span
              className="material-symbols-outlined kl-pick-tpl-arrow"
              aria-hidden
            >
              chevron_right
            </span>
          </button>
        ))}

        <button type="button" className="kl-pick-free" onClick={onPickFree}>
          <span
            className="material-symbols-outlined kl-pick-tpl-ico"
            aria-hidden
          >
            sports_gymnastics
          </span>
          <span className="kl-pick-tpl-body">
            <span className="kl-pick-tpl-name">Séance libre</span>
            <span className="kl-pick-tpl-sub">
              Street workout, changement de programme, imprévu…
            </span>
          </span>
          <span
            className="material-symbols-outlined kl-pick-tpl-arrow"
            aria-hidden
          >
            chevron_right
          </span>
        </button>
      </div>

      <button
        type="button"
        className="btn btn-o kl-pick-cancel"
        onClick={onCancel}
      >
        Annuler
      </button>
    </section>
  );
}
