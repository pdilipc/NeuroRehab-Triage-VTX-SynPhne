declare namespace fhir {
  interface Bundle {
    resourceType: 'Bundle';
    type: string;
    total?: number;
    entry?: Array<{
      resource?: Resource;
      fullUrl?: string;
    }>;
  }

  interface Resource {
    resourceType: string;
    id?: string;
    meta?: {
      versionId?: string;
      lastUpdated?: string;
    };
  }

  interface Patient extends Resource {
    resourceType: 'Patient';
    identifier?: Array<{
      system?: string;
      value?: string;
    }>;
    name?: Array<{
      use?: string;
      text?: string;
      family?: string;
      given?: string[];
      prefix?: string[];
    }>;
    gender?: 'male' | 'female' | 'other' | 'unknown';
    birthDate?: string;
    address?: Array<{
      use?: string;
      type?: string;
      text?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      country?: string;
    }>;
    telecom?: Array<{
      system?: string;
      value?: string;
      use?: string;
    }>;
  }

  interface Observation extends Resource {
    resourceType: 'Observation';
    status: 'registered' | 'preliminary' | 'final' | 'amended' | 'corrected' | 'cancelled' | 'entered-in-error' | 'unknown';
    category?: Array<{
      coding?: Array<{
        system?: string;
        code?: string;
        display?: string;
      }>;
    }>;
    code: {
      coding?: Array<{
        system?: string;
        code?: string;
        display?: string;
      }>;
      text?: string;
    };
    subject?: {
      reference?: string;
      display?: string;
    };
    effectiveDateTime?: string;
    effectivePeriod?: {
      start?: string;
      end?: string;
    };
    valueQuantity?: {
      value?: number;
      unit?: string;
      system?: string;
      code?: string;
    };
    valueString?: string;
    valueBoolean?: boolean;
    valueInteger?: number;
    component?: Array<{
      code?: {
        coding?: Array<{
          system?: string;
          code?: string;
          display?: string;
        }>;
      };
      valueQuantity?: {
        value?: number;
        unit?: string;
      };
    }>;
  }

  interface Condition extends Resource {
    resourceType: 'Condition';
    clinicalStatus?: {
      coding?: Array<{
        code?: string;
      }>;
    };
    verificationStatus?: {
      coding?: Array<{
        code?: string;
      }>;
    };
    category?: Array<{
      coding?: Array<{
        system?: string;
        code?: string;
        display?: string;
      }>;
    }>;
    severity?: {
      coding?: Array<{
        system?: string;
        code?: string;
        display?: string;
      }>;
    };
    code?: {
      coding?: Array<{
        system?: string;
        code?: string;
        display?: string;
      }>;
      text?: string;
    };
    subject?: {
      reference?: string;
      display?: string;
    };
    onsetDateTime?: string;
    abatementDateTime?: string;
  }

  interface MedicationRequest extends Resource {
    resourceType: 'MedicationRequest';
    status: 'active' | 'on-hold' | 'cancelled' | 'completed' | 'entered-in-error' | 'stopped' | 'draft' | 'unknown';
    intent: 'proposal' | 'plan' | 'order' | 'original-order' | 'reflex-order' | 'filler-order' | 'instance-order' | 'option';
    medicationCodeableConcept?: {
      coding?: Array<{
        system?: string;
        code?: string;
        display?: string;
      }>;
      text?: string;
    };
    subject?: {
      reference?: string;
      display?: string;
    };
    authoredOn?: string;
    dosageInstruction?: Array<{
      text?: string;
      timing?: {
        repeat?: {
          frequency?: number;
          period?: number;
          periodUnit?: string;
        };
      };
    }>;
  }

  interface Encounter extends Resource {
    resourceType: 'Encounter';
    status: 'planned' | 'arrived' | 'triaged' | 'in-progress' | 'onleave' | 'finished' | 'cancelled' | 'entered-in-error' | 'unknown';
    class?: {
      system?: string;
      code?: string;
      display?: string;
    };
    type?: Array<{
      coding?: Array<{
        system?: string;
        code?: string;
        display?: string;
      }>;
      text?: string;
    }>;
    subject?: {
      reference?: string;
      display?: string;
    };
    period?: {
      start?: string;
      end?: string;
    };
  }

  interface Procedure extends Resource {
    resourceType: 'Procedure';
    status: 'preparation' | 'in-progress' | 'not-done' | 'on-hold' | 'stopped' | 'completed' | 'entered-in-error' | 'unknown';
    category?: {
      coding?: Array<{
        system?: string;
        code?: string;
        display?: string;
      }>;
    };
    code?: {
      coding?: Array<{
        system?: string;
        code?: string;
        display?: string;
      }>;
      text?: string;
    };
    subject?: {
      reference?: string;
      display?: string;
    };
    performedDateTime?: string;
    performedPeriod?: {
      start?: string;
      end?: string;
    };
    outcome?: {
      coding?: Array<{
        system?: string;
        code?: string;
        display?: string;
      }>;
      text?: string;
    };
  }

  interface QuestionnaireResponse extends Resource {
    resourceType: 'QuestionnaireResponse';
    questionnaire?: string;
    status: 'in-progress' | 'completed' | 'amended' | 'entered-in-error' | 'stopped';
    subject?: {
      reference?: string;
      display?: string;
    };
    authored?: string;
    item?: Array<{
      linkId: string;
      text?: string;
      answer?: Array<{
        valueString?: string;
        valueInteger?: number;
        valueBoolean?: boolean;
        valueDecimal?: number;
      }>;
    }>;
  }

  interface DiagnosticReport extends Resource {
    resourceType: 'DiagnosticReport';
    status: 'registered' | 'partial' | 'preliminary' | 'final' | 'amended' | 'corrected' | 'appended' | 'cancelled' | 'entered-in-error' | 'unknown';
    category?: Array<{
      coding?: Array<{ system?: string; code?: string; display?: string }>;
    }>;
    code: {
      coding?: Array<{ system?: string; code?: string; display?: string }>;
      text?: string;
    };
    subject?: { reference?: string; display?: string };
    effectiveDateTime?: string;
    issued?: string;
    result?: Array<{ reference?: string; display?: string }>;
    presentedForm?: Array<{
      contentType?: string;
      url?: string;
      data?: string;
      title?: string;
    }>;
    conclusion?: string;
  }

  interface DocumentReference extends Resource {
    resourceType: 'DocumentReference';
    status: 'current' | 'superseded' | 'entered-in-error';
    type?: {
      coding?: Array<{ system?: string; code?: string; display?: string }>;
      text?: string;
    };
    subject?: { reference?: string; display?: string };
    date?: string;
    description?: string;
    content: Array<{
      attachment: {
        contentType?: string;
        url?: string;
        data?: string;
        title?: string;
        creation?: string;
      };
    }>;
    context?: {
      related?: Array<{ reference?: string }>;
    };
  }

  interface CarePlan extends Resource {
    resourceType: 'CarePlan';
    status: 'draft' | 'active' | 'on-hold' | 'revoked' | 'completed' | 'entered-in-error' | 'unknown';
    intent: 'proposal' | 'plan' | 'order' | 'option';
    title?: string;
    subject?: {
      reference?: string;
      display?: string;
    };
    period?: {
      start?: string;
      end?: string;
    };
    goal?: Array<{
      reference?: string;
      display?: string;
    }>;
    activity?: Array<{
      detail?: {
        code?: {
          coding?: Array<{
            system?: string;
            code?: string;
            display?: string;
          }>;
          text?: string;
        };
        status?: string;
      };
    }>;
  }
}

