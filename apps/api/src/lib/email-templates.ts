/**
 * Gabarits d'e-mails transactionnels — texte brut, liens réels, aucun contenu
 * factice. Le transport (SMTP ou dev-outbox) est décidé par lib/mailer.ts.
 */
import type { PlanId } from '@charbon/shared';

export interface EmailTemplate {
  subject: string;
  text: string;
}

export function welcomeEmail(name: string, appBaseUrl: string): EmailTemplate {
  return {
    subject: 'Bienvenue sur Charbon 🔥',
    text: [
      `Bonjour ${name},`,
      '',
      'Votre compte Charbon est créé. La règle du jeu est simple :',
      'une petite action, chaque jour, devient une grande constance.',
      '',
      `Ouvrez votre application : ${appBaseUrl}`,
      '',
      'Trois conseils pour démarrer :',
      '1. Choisissez UNE habitude minuscule (2 minutes suffisent).',
      '2. Validez-la aujourd’hui, même tard, même mal.',
      '3. Revenez demain : la flamme fait le reste.',
      '',
      '— L’équipe Charbon',
    ].join('\n'),
  };
}

export function subscriptionConfirmedEmail(name: string, plan: PlanId, periodEnd: string | null): EmailTemplate {
  return {
    subject: 'Votre abonnement Charbon Premium est actif',
    text: [
      `Bonjour ${name},`,
      '',
      `Le plan ${plan === 'premium' ? 'Premium' : plan} vient d’être activé sur votre compte.`,
      periodEnd ? `Période en cours jusqu’au : ${new Date(periodEnd).toLocaleDateString('fr-FR')}.` : '',
      '',
      'Vous débloquez : statistiques 90 j / 365 j et historique approfondi.',
      'Le cœur de Charbon reste identique : votre discipline, vos données.',
      '',
      '— L’équipe Charbon',
    ]
      .filter(Boolean)
      .join('\n'),
  };
}

export function subscriptionCanceledEmail(name: string, accessUntil: string | null): EmailTemplate {
  return {
    subject: 'Confirmation : abonnement Charbon Premium résilié',
    text: [
      `Bonjour ${name},`,
      '',
      accessUntil
        ? `Votre résiliation est confirmée. Vous conservez l’accès Premium jusqu’au ${new Date(accessUntil).toLocaleDateString('fr-FR')}.`
        : 'Votre résiliation est confirmée et effective immédiatement.',
      'Votre compte repassera/est repassé au plan Free : toutes vos données restent intactes.',
      '',
      '— L’équipe Charbon',
    ].join('\n'),
  };
}

export function paymentFailedEmail(name: string): EmailTemplate {
  return {
    subject: 'Paiement Charbon Premium : échec — action requise',
    text: [
      `Bonjour ${name},`,
      '',
      'Nous n’avons pas pu prélever le montant de votre abonnement Premium.',
      'Votre abonnement passe en statut « impayé » : mettez à jour votre moyen de',
      'paiement depuis l’application (Profil → Abonnement) pour rétablir l’accès.',
      '',
      'Aucune donnée ne sera supprimée, quel que soit le statut.',
      '',
      '— L’équipe Charbon',
    ].join('\n'),
  };
}
