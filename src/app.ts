const yearDisplay = document.querySelector<HTMLSpanElement>('#year');
const supportForm = document.querySelector<HTMLFormElement>('#support-form');
const placementForm = document.querySelector<HTMLFormElement>('#placement-form');

const PLACEHOLDER_SUPPORT_EMAIL = '';
// TODO: Replace PLACEHOLDER_SUPPORT_EMAIL with your actual support inbox before deploying.

interface FormState {
  name: string;
  email: string;
  location: string;
  message: string;
}

interface FormConfig {
  subject: (state: FormState) => string;
  bodyIntro: string;
  messageError: string;
  emailEmptyError: string;
  successMessage: string;
}

const isValidEmail = (value: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
};

const updateYear = (): void => {
  if (yearDisplay) {
    yearDisplay.textContent = String(new Date().getFullYear());
  }
};

const showError = (
  form: HTMLFormElement,
  field: HTMLInputElement | HTMLTextAreaElement,
  message: string
): void => {
  const errorContainer = field.id
    ? form.querySelector<HTMLElement>(`.form__error[data-error-for="${field.id}"]`)
    : null;
  if (errorContainer) {
    errorContainer.textContent = message;
  }
  if (message.length > 0) {
    field.setAttribute('aria-invalid', 'true');
  } else {
    field.removeAttribute('aria-invalid');
  }
};

const clearErrors = (form: HTMLFormElement): void => {
  form.querySelectorAll<HTMLElement>('.form__error').forEach((element) => {
    element.textContent = '';
  });
  form
    .querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('[aria-invalid="true"]')
    .forEach((element) => element.removeAttribute('aria-invalid'));
};

const getFormState = (form: HTMLFormElement): FormState => {
  const formData = new FormData(form);
  return {
    name: String(formData.get('name') ?? '').trim(),
    email: String(formData.get('email') ?? '').trim(),
    location: String(formData.get('location') ?? '').trim(),
    message: String(formData.get('message') ?? '').trim(),
  };
};

const buildMailtoLink = (state: FormState, config: FormConfig): string => {
  const params = new URLSearchParams({
    subject: config.subject(state),
    body: `Name: ${state.name}\nEmail: ${state.email}\nLocation: ${state.location || 'Not provided'}\n\n${config.bodyIntro}:\n${state.message}`,
  });
  return `mailto:${PLACEHOLDER_SUPPORT_EMAIL}?${params.toString()}`;
};

const displaySuccessMessage = (form: HTMLFormElement, message: string): void => {
  const successElement = form.querySelector<HTMLParagraphElement>('.form__success');
  if (successElement) {
    successElement.textContent = message;
  }
};

const getField = <T extends HTMLInputElement | HTMLTextAreaElement>(
  form: HTMLFormElement,
  name: keyof FormState
): T | null => {
  return form.querySelector<T>(`[name="${name}"]`);
};

const validateForm = (form: HTMLFormElement, config: FormConfig): FormState | null => {
  clearErrors(form);
  const state = getFormState(form);
  let isValid = true;

  const nameField = getField<HTMLInputElement>(form, 'name');
  if (nameField && state.name.length === 0) {
    showError(form, nameField, 'Please share your name so we know who to contact.');
    isValid = false;
  }

  const emailField = getField<HTMLInputElement>(form, 'email');
  if (emailField) {
    if (state.email.length === 0) {
      showError(form, emailField, config.emailEmptyError);
      isValid = false;
    } else if (!isValidEmail(state.email)) {
      showError(form, emailField, "That doesn't look like a valid email address.");
      isValid = false;
    }
  }

  const messageField = getField<HTMLTextAreaElement>(form, 'message');
  if (messageField && state.message.length === 0) {
    showError(form, messageField, config.messageError);
    isValid = false;
  }

  return isValid ? state : null;
};

const handleSubmit = (event: SubmitEvent, config: FormConfig): void => {
  event.preventDefault();
  const form = event.currentTarget as HTMLFormElement | null;
  if (!form) {
    return;
  }

  const state = validateForm(form, config);
  if (!state) {
    displaySuccessMessage(form, '');
    return;
  }

  if (!PLACEHOLDER_SUPPORT_EMAIL) {
    displaySuccessMessage(form, 'Update the support email address before sending messages.');
    return;
  }

  const mailtoLink = buildMailtoLink(state, config);
  window.location.href = mailtoLink;
  displaySuccessMessage(form, config.successMessage);
  form.reset();
};

const init = (): void => {
  updateYear();
  const formConfigurations: Array<[HTMLFormElement | null, FormConfig]> = [
    [
      supportForm,
      {
        subject: (state) => `Support request from ${state.name || 'Pandora client'}`,
        bodyIntro: 'Issue',
        messageError: "Please describe what's happening with your machine.",
        emailEmptyError: 'We need an email to send updates to.',
        successMessage: 'Launching your email app with the details.',
      },
    ],
    [
      placementForm,
      {
        subject: (state) => `Placement inquiry from ${state.name || 'Future partner'}`,
        bodyIntro: 'Placement details',
        messageError: 'Please share details about your location and what you need.',
        emailEmptyError: 'We need a business email to connect with you.',
        successMessage: 'Launching your email app with the details.',
      },
    ],
  ];

  formConfigurations.forEach(([form, config]) => {
    if (form) {
      form.addEventListener('submit', (event) => handleSubmit(event, config));
    }
  });
};

init();
