import LegalLayout from '@/components/legal/LegalLayout';

const UPDATED = '14 avril 2026';

export default function PrivacyPage() {
  return (
    <LegalLayout
      title="Politique de Confidentialité"
      updatedAt={UPDATED}
      alternateLink={{
        to: '/terms',
        label: "Conditions Générales d'Utilisation",
      }}
    >
      <section>
        <h2>1. Introduction</h2>
        <p>
          La présente Politique de Confidentialité décrit comment l'application{' '}
          <strong>Kripy — Precision Lab</strong> (ci-après
          «&nbsp;l'Application&nbsp;») collecte, utilise et protège les données
          personnelles de ses utilisateurs, conformément au Règlement (UE)
          2016/679 du 27 avril 2016 relatif à la protection des données à
          caractère personnel (RGPD) et à la loi Informatique et Libertés
          modifiée.
        </p>
        <p>
          En utilisant l'Application, vous reconnaissez avoir pris connaissance
          de la présente politique et accepter le traitement de vos données dans
          les conditions décrites ci-dessous.
        </p>
      </section>

      <section>
        <h2>2. Responsable du traitement</h2>
        <p>
          Le responsable du traitement des données collectées via l'Application
          est l'éditeur du projet Kripy. Pour toute question relative à la
          protection de vos données, vous pouvez nous contacter via le dépôt
          public du projet.
        </p>
      </section>

      <section>
        <h2>3. Données collectées</h2>
        <p>
          L'Application est conçue selon le principe de{' '}
          <strong>minimisation des données</strong>. Les données traitées sont
          uniquement celles que vous saisissez volontairement :
        </p>
        <ul>
          <li>
            <strong>Données de profil</strong> : taille, poids, poids cible,
            niveau d'activité, phase nutritionnelle en cours.
          </li>
          <li>
            <strong>Données de suivi</strong> : historique de poids, repas et
            aliments consommés, séances sportives, pas quotidiens, consommation
            d'eau.
          </li>
          <li>
            <strong>Données de compte (optionnel)</strong> : si vous choisissez
            de vous connecter via Google, nous recevons votre adresse e-mail,
            votre nom affiché et votre photo de profil publique via Firebase
            Authentication.
          </li>
          <li>
            <strong>Paramètres techniques</strong> : préférences de thème
            (sombre/clair), clé API Groq (si vous l'avez renseignée pour
            l'analyse par photo).
          </li>
        </ul>
        <p>
          L'Application{' '}
          <strong>
            ne collecte aucune donnée de géolocalisation, aucun identifiant
            publicitaire, et n'utilise aucun tracker tiers
          </strong>
          .
        </p>
      </section>

      <section>
        <h2>4. Stockage des données</h2>
        <p>
          Par défaut,{' '}
          <strong>toutes vos données sont stockées localement</strong> dans le{' '}
          <code>localStorage</code> de votre navigateur, sur votre appareil.
          Aucune donnée ne quitte votre terminal tant que vous n'activez pas
          explicitement la synchronisation cloud.
        </p>
        <p>Si vous choisissez de vous connecter avec un compte Google :</p>
        <ul>
          <li>
            L'authentification est gérée par{' '}
            <strong>Google Firebase Authentication</strong>.
          </li>
          <li>
            Vos données d'application sont sauvegardées dans{' '}
            <strong>Google Cloud Firestore</strong>, sous un identifiant unique
            (UID) lié à votre compte Google.
          </li>
          <li>
            Les serveurs Firebase sont hébergés par Google LLC dans l'Union
            européenne (région europe-west).
          </li>
        </ul>
      </section>

      <section>
        <h2>5. Finalités et bases légales du traitement</h2>
        <p>Les données sont traitées pour les finalités suivantes :</p>
        <ul>
          <li>
            <strong>Fourniture du service</strong> de suivi nutritionnel et
            sportif — base légale : exécution du contrat (article 6.1.b du
            RGPD).
          </li>
          <li>
            <strong>Synchronisation multi-appareils</strong> via Firebase
            (optionnelle) — base légale : consentement (article 6.1.a du RGPD).
          </li>
          <li>
            <strong>Analyse de repas par intelligence artificielle</strong> via
            l'API Groq (optionnelle) — base légale : consentement explicite.
          </li>
          <li>
            <strong>Recherche de produits</strong> via l'API OpenFoodFacts lors
            du scan de code-barres — base légale : consentement.
          </li>
        </ul>
      </section>

      <section>
        <h2>6. Destinataires et sous-traitants</h2>
        <p>
          Vos données ne sont jamais vendues, louées ou cédées à des tiers à des
          fins commerciales. Les seuls destinataires techniques sont les
          sous-traitants suivants, uniquement si vous activez les
          fonctionnalités concernées :
        </p>
        <ul>
          <li>
            <strong>Google Firebase</strong> (Google Ireland Limited) —
            authentification et stockage cloud, uniquement si vous vous
            connectez avec un compte Google.
          </li>
          <li>
            <strong>Groq, Inc.</strong> (États-Unis) — analyse d'image par IA,
            uniquement si vous utilisez la fonctionnalité «&nbsp;analyse
            photo&nbsp;» avec votre propre clé API. Un transfert hors UE est
            encadré par les Clauses Contractuelles Types de la Commission
            européenne.
          </li>
          <li>
            <strong>OpenFoodFacts</strong> (association française à but non
            lucratif) — recherche de produits alimentaires lors du scan de
            code-barres.
          </li>
        </ul>
      </section>

      <section>
        <h2>7. Durée de conservation</h2>
        <p>
          Vos données sont conservées tant que vous utilisez l'Application. Vous
          pouvez à tout moment :
        </p>
        <ul>
          <li>
            Effacer l'ensemble de vos données locales via le bouton{' '}
            <strong>«&nbsp;Réinitialiser&nbsp;»</strong> dans l'onglet Réglages.
          </li>
          <li>
            Vider le <code>localStorage</code> de votre navigateur pour
            supprimer toute trace locale.
          </li>
          <li>
            Demander la suppression de vos données cloud en nous contactant
            (voir section 9).
          </li>
        </ul>
      </section>

      <section>
        <h2>8. Sécurité</h2>
        <p>
          Les communications avec les serveurs Firebase et les API tierces sont
          chiffrées via HTTPS/TLS. Les données stockées dans Firestore sont
          protégées par les règles de sécurité Firebase, qui limitent l'accès à
          votre seul compte authentifié. Toutefois, aucune méthode de
          transmission ou de stockage n'est totalement infaillible ; nous ne
          pouvons garantir une sécurité absolue.
        </p>
      </section>

      <section>
        <h2>9. Vos droits RGPD</h2>
        <p>
          Conformément au RGPD, vous disposez des droits suivants sur vos
          données personnelles :
        </p>
        <ul>
          <li>
            <strong>Droit d'accès</strong> : obtenir une copie de vos données.
          </li>
          <li>
            <strong>Droit de rectification</strong> : corriger des données
            inexactes (directement dans l'Application).
          </li>
          <li>
            <strong>Droit à l'effacement</strong> (droit à l'oubli) : supprimer
            vos données.
          </li>
          <li>
            <strong>Droit à la portabilité</strong> : exporter vos données au
            format JSON via le bouton «&nbsp;Exporter JSON&nbsp;».
          </li>
          <li>
            <strong>Droit d'opposition</strong> : vous opposer au traitement de
            vos données.
          </li>
          <li>
            <strong>Droit de limitation</strong> du traitement.
          </li>
          <li>
            <strong>Droit de retirer votre consentement</strong> à tout moment,
            sans affecter la licéité du traitement antérieur.
          </li>
        </ul>
        <p>
          Vous pouvez exercer ces droits directement depuis l'application
          (export JSON, réinitialisation) ou en ouvrant une issue sur le dépôt
          public du projet. Si vous estimez que vos droits ne sont pas
          respectés, vous avez le droit d'introduire une réclamation auprès de
          la <strong>CNIL</strong> (Commission Nationale de l'Informatique et
          des Libertés) —{' '}
          <a
            href="https://www.cnil.fr"
            target="_blank"
            rel="noopener noreferrer"
          >
            www.cnil.fr
          </a>
          .
        </p>
      </section>

      <section>
        <h2>10. Cookies et technologies similaires</h2>
        <p>
          L'Application{' '}
          <strong>n'utilise aucun cookie publicitaire ni traceur</strong>. Elle
          utilise uniquement le <code>localStorage</code> du navigateur, qui est
          un mécanisme de stockage technique indispensable au fonctionnement du
          service et ne nécessite pas de consentement préalable (article 82 de
          la loi Informatique et Libertés).
        </p>
      </section>

      <section>
        <h2>11. Mineurs</h2>
        <p>
          L'Application n'est pas destinée aux personnes de moins de 15 ans. Si
          vous avez moins de 15 ans, vous devez obtenir l'accord d'un parent ou
          titulaire de l'autorité parentale avant d'utiliser le service.
        </p>
      </section>

      <section>
        <h2>12. Modifications</h2>
        <p>
          La présente politique peut être mise à jour à tout moment. La date de
          dernière mise à jour figure en haut de ce document. Les modifications
          substantielles seront signalées dans l'Application.
        </p>
      </section>
    </LegalLayout>
  );
}
