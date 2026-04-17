import LegalLayout from '@/components/legal/LegalLayout';

const UPDATED = '14 avril 2026';

export default function TermsPage() {
  return (
    <LegalLayout
      title="Conditions Générales d'Utilisation"
      updatedAt={UPDATED}
      alternateLink={{ to: '/privacy', label: 'Politique de Confidentialité' }}
    >
      <section>
        <h2>1. Objet</h2>
        <p>
          Les présentes Conditions Générales d'Utilisation (ci-après
          «&nbsp;CGU&nbsp;») ont pour objet de définir les modalités et
          conditions d'utilisation de l'application{' '}
          <strong>Kripy — Precision Lab</strong> (ci-après
          «&nbsp;l'Application&nbsp;»), ainsi que les droits et obligations de
          l'éditeur et de l'utilisateur.
        </p>
        <p>
          L'utilisation de l'Application implique l'acceptation pleine et
          entière des présentes CGU. Si vous n'acceptez pas ces conditions, vous
          devez cesser immédiatement d'utiliser l'Application.
        </p>
      </section>

      <section>
        <h2>2. Description du service</h2>
        <p>
          Kripy est une application web de suivi nutritionnel, pondéral et
          sportif. Elle permet notamment :
        </p>
        <ul>
          <li>d'enregistrer ses repas, calories et macronutriments ;</li>
          <li>de suivre son poids, son hydratation et ses pas quotidiens ;</li>
          <li>de planifier et consigner ses séances sportives ;</li>
          <li>
            d'analyser l'évolution de son poids via des courbes de tendance ;
          </li>
          <li>
            d'utiliser, en option, des fonctionnalités assistées par
            intelligence artificielle (analyse de photo de repas, scan de
            code-barres).
          </li>
        </ul>
        <p>
          L'Application est accessible gratuitement. L'éditeur se réserve le
          droit de modifier, suspendre ou interrompre tout ou partie du service
          à tout moment, sans préavis.
        </p>
      </section>

      <section>
        <h2>3. Accès au service</h2>
        <p>
          L'Application est accessible depuis tout navigateur web moderne
          compatible. L'utilisation en mode «&nbsp;invité&nbsp;» (sans compte)
          est possible et fonctionne entièrement en local. La création d'un
          compte via Google est optionnelle et permet uniquement la
          synchronisation des données entre plusieurs appareils.
        </p>
        <p>
          L'utilisateur est responsable de son matériel, de sa connexion
          internet et de la confidentialité de ses identifiants de compte
          Google.
        </p>
      </section>

      <section>
        <h2>4. Avertissement santé</h2>
        <p>
          <strong>Kripy n'est pas un dispositif médical.</strong> L'Application
          ne fournit pas de conseils médicaux, diététiques ou sportifs
          personnalisés. Les informations, calculs et recommandations (TDEE,
          macros, analyses de tendance, suggestions de phase) sont fournis à
          titre <strong>purement informatif et éducatif</strong>.
        </p>
        <p>
          Avant d'entreprendre un régime alimentaire, un programme sportif ou
          toute modification significative de votre hygiène de vie,{' '}
          <strong>consultez un professionnel de santé qualifié</strong>{' '}
          (médecin, diététicien, nutritionniste, coach sportif diplômé).
          L'éditeur décline toute responsabilité en cas d'utilisation de
          l'Application sans avis médical préalable.
        </p>
        <p>
          L'Application n'est pas adaptée aux personnes souffrant de troubles du
          comportement alimentaire (TCA), aux femmes enceintes ou allaitantes,
          aux mineurs, ou aux personnes présentant des pathologies chroniques
          nécessitant un suivi médical strict.
        </p>
      </section>

      <section>
        <h2>5. Obligations de l'utilisateur</h2>
        <p>L'utilisateur s'engage à :</p>
        <ul>
          <li>
            utiliser l'Application conformément à sa destination et aux lois en
            vigueur ;
          </li>
          <li>
            ne pas tenter de contourner les mesures de sécurité de l'Application
            ;
          </li>
          <li>
            ne pas utiliser l'Application à des fins frauduleuses, illégales ou
            malveillantes ;
          </li>
          <li>
            fournir des informations exactes lors de la saisie de ses données
            personnelles ;
          </li>
          <li>
            respecter les droits de propriété intellectuelle de l'éditeur et des
            tiers.
          </li>
        </ul>
      </section>

      <section>
        <h2>6. Propriété intellectuelle</h2>
        <p>
          L'Application, son code source, son interface, ses graphismes, sa
          marque, sa base d'aliments embarquée et tout contenu associé sont la
          propriété exclusive de l'éditeur et sont protégés par le droit
          d'auteur et le droit des marques.
        </p>
        <p>
          Aucune autorisation n'est accordée à l'utilisateur pour copier,
          reproduire, modifier, distribuer, vendre ou exploiter commercialement
          tout ou partie de l'Application, sauf accord écrit préalable de
          l'éditeur.
        </p>
        <p>
          Les données que vous saisissez dans l'Application (poids, repas,
          séances…) vous appartiennent entièrement. Vous pouvez les exporter à
          tout moment au format JSON via l'onglet Réglages.
        </p>
      </section>

      <section>
        <h2>7. Services tiers</h2>
        <p>L'Application intègre des services tiers optionnels :</p>
        <ul>
          <li>
            <strong>Google Firebase</strong> pour l'authentification et la
            synchronisation cloud ;
          </li>
          <li>
            <strong>Groq</strong> pour l'analyse d'image par intelligence
            artificielle (clé API personnelle) ;
          </li>
          <li>
            <strong>OpenFoodFacts</strong> pour la recherche de produits via
            code-barres ;
          </li>
          <li>
            <strong>Chart.js</strong> pour l'affichage des courbes et
            graphiques.
          </li>
        </ul>
        <p>
          Ces services sont soumis à leurs propres conditions d'utilisation, que
          l'utilisateur accepte implicitement en utilisant les fonctionnalités
          correspondantes.
        </p>
      </section>

      <section>
        <h2>8. Données personnelles</h2>
        <p>
          Le traitement des données personnelles est décrit dans notre{' '}
          <a href="/privacy">Politique de Confidentialité</a>, qui fait partie
          intégrante des présentes CGU.
        </p>
      </section>

      <section>
        <h2>9. Responsabilité</h2>
        <p>
          L'Application est fournie <strong>«&nbsp;en l'état&nbsp;»</strong>,
          sans garantie d'aucune sorte, expresse ou implicite. L'éditeur ne
          garantit pas que l'Application sera exempte d'erreurs, de bugs ou
          d'interruptions.
        </p>
        <p>
          L'éditeur ne pourra en aucun cas être tenu responsable des dommages
          directs ou indirects résultant :
        </p>
        <ul>
          <li>
            de l'utilisation ou de l'impossibilité d'utiliser l'Application ;
          </li>
          <li>d'une perte de données (locale ou cloud) ;</li>
          <li>
            de l'inexactitude des calculs ou estimations fournis (notamment par
            l'IA) ;
          </li>
          <li>
            de décisions prises sur la base des informations affichées par
            l'Application ;
          </li>
          <li>
            de dysfonctionnements des services tiers intégrés (Firebase, Groq,
            OpenFoodFacts).
          </li>
        </ul>
        <p>
          Il appartient à l'utilisateur de sauvegarder régulièrement ses données
          via la fonction d'export JSON.
        </p>
      </section>

      <section>
        <h2>10. Suppression du compte et des données</h2>
        <p>L'utilisateur peut à tout moment :</p>
        <ul>
          <li>
            Réinitialiser l'ensemble de ses données locales via le bouton{' '}
            <strong>«&nbsp;Réinitialiser&nbsp;»</strong> dans l'onglet Réglages
            ;
          </li>
          <li>Se déconnecter de son compte Google ;</li>
          <li>
            Demander la suppression complète de ses données cloud en ouvrant une
            issue sur le dépôt public du projet.
          </li>
        </ul>
      </section>

      <section>
        <h2>11. Modification des CGU</h2>
        <p>
          L'éditeur se réserve le droit de modifier à tout moment les présentes
          CGU. Les modifications entrent en vigueur dès leur publication.
          L'utilisateur est invité à consulter régulièrement cette page.
          L'utilisation continue de l'Application après modification vaut
          acceptation des nouvelles CGU.
        </p>
      </section>

      <section>
        <h2>12. Droit applicable et juridiction compétente</h2>
        <p>
          Les présentes CGU sont régies par le droit français. Tout litige
          relatif à leur interprétation ou à leur exécution relèvera de la
          compétence exclusive des tribunaux français, sous réserve des
          dispositions légales impératives en matière de consommation.
        </p>
      </section>
    </LegalLayout>
  );
}
