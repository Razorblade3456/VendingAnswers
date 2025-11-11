"use strict";
const yearDisplay = document.querySelector('#year');
const supportForm = document.querySelector('#support-form');
const placementForm = document.querySelector('#placement-form');
const PLACEHOLDER_SUPPORT_EMAIL = 'johnny.leyva182@gmail.com';
const isValidEmail = (value) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
};
const updateYear = () => {
    if (yearDisplay) {
        yearDisplay.textContent = String(new Date().getFullYear());
    }
};
const showError = (form, field, message) => {
    const errorContainer = field.id
        ? form.querySelector(`.form__error[data-error-for="${field.id}"]`)
        : null;
    if (errorContainer) {
        errorContainer.textContent = message;
    }
    if (message.length > 0) {
        field.setAttribute('aria-invalid', 'true');
    }
    else {
        field.removeAttribute('aria-invalid');
    }
};
const clearErrors = (form) => {
    form.querySelectorAll('.form__error').forEach((element) => {
        element.textContent = '';
    });
    form
        .querySelectorAll('[aria-invalid="true"]')
        .forEach((element) => element.removeAttribute('aria-invalid'));
};
const getFormState = (form) => {
    const formData = new FormData(form);
    return {
        name: String(formData.get('name') ?? '').trim(),
        email: String(formData.get('email') ?? '').trim(),
        location: String(formData.get('location') ?? '').trim(),
        message: String(formData.get('message') ?? '').trim(),
    };
};
const buildMailtoLink = (state, config) => {
    const params = new URLSearchParams({
        subject: config.subject(state),
        body: `Name: ${state.name}\nEmail: ${state.email}\nLocation: ${state.location || 'Not provided'}\n\n${config.bodyIntro}:\n${state.message}`,
    });
    return `mailto:${PLACEHOLDER_SUPPORT_EMAIL}?${params.toString()}`;
};
const displaySuccessMessage = (form, message) => {
    const successElement = form.querySelector('.form__success');
    if (successElement) {
        successElement.textContent = message;
    }
};
const getField = (form, name) => {
    return form.querySelector(`[name="${name}"]`);
};
const validateForm = (form, config) => {
    clearErrors(form);
    const state = getFormState(form);
    let isValid = true;
    const nameField = getField(form, 'name');
    if (nameField && state.name.length === 0) {
        showError(form, nameField, 'Add your name.');
        isValid = false;
    }
    const emailField = getField(form, 'email');
    if (emailField) {
        if (state.email.length === 0) {
            showError(form, emailField, config.emailEmptyError);
            isValid = false;
        }
        else if (!isValidEmail(state.email)) {
            showError(form, emailField, 'Use a valid email.');
            isValid = false;
        }
    }
    const messageField = getField(form, 'message');
    if (messageField && state.message.length === 0) {
        showError(form, messageField, config.messageError);
        isValid = false;
    }
    return isValid ? state : null;
};
const handleSubmit = (event, config) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form) {
        return;
    }
    const state = validateForm(form, config);
    if (!state) {
        displaySuccessMessage(form, '');
        return;
    }
    if (!PLACEHOLDER_SUPPORT_EMAIL) {
        displaySuccessMessage(form, 'Set the support email in src/app.ts first.');
        return;
    }
    const mailtoLink = buildMailtoLink(state, config);
    window.location.href = mailtoLink;
    displaySuccessMessage(form, config.successMessage);
    form.reset();
};
const init = () => {
    updateYear();
    const formConfigurations = [
        [
            supportForm,
            {
                subject: (state) => `Support for ${state.name || 'Pandora client'}`,
                bodyIntro: 'Issue',
                messageError: 'Tell us what is happening.',
                emailEmptyError: 'Email is required.',
                successMessage: 'Email draft ready to send.',
            },
        ],
        [
            placementForm,
            {
                subject: (state) => `Placement from ${state.name || 'Future host'}`,
                bodyIntro: 'Placement details',
                messageError: 'Share your idea for the space.',
                emailEmptyError: 'Business email is required.',
                successMessage: 'Email draft ready to send.',
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
