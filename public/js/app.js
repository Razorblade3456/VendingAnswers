"use strict";
const supportForm = document.querySelector('#support-form');
const yearDisplay = document.querySelector('#year');
const PLACEHOLDER_SUPPORT_EMAIL = '';
const isValidEmail = (value) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
};
const updateYear = () => {
    if (yearDisplay) {
        yearDisplay.textContent = String(new Date().getFullYear());
    }
};
const showError = (field, message) => {
    const errorContainer = document.querySelector(`.form__error[data-error-for="${field.id}"]`);
    if (errorContainer) {
        errorContainer.textContent = message;
    }
    field.setAttribute('aria-invalid', String(message.length > 0));
};
const clearErrors = () => {
    document.querySelectorAll('.form__error').forEach((element) => {
        element.textContent = '';
    });
    document
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
const buildMailtoLink = (state) => {
    const params = new URLSearchParams({
        subject: `Support request from ${state.name || 'Pandora client'}`,
        body: `Name: ${state.name}\nEmail: ${state.email}\nLocation: ${state.location || 'Not provided'}\n\nIssue:\n${state.message}`,
    });
    return `mailto:${PLACEHOLDER_SUPPORT_EMAIL}?${params.toString()}`;
};
const displaySuccessMessage = (message) => {
    const successElement = document.querySelector('.form__success');
    if (successElement) {
        successElement.textContent = message;
    }
};
const validateForm = (form) => {
    clearErrors();
    const state = getFormState(form);
    let isValid = true;
    const nameField = form.querySelector('#name');
    if (nameField && state.name.length === 0) {
        showError(nameField, 'Please share your name so we know who to call back.');
        isValid = false;
    }
    const emailField = form.querySelector('#email');
    if (emailField) {
        if (state.email.length === 0) {
            showError(emailField, 'We need an email to send updates to.');
            isValid = false;
        }
        else if (!isValidEmail(state.email)) {
            showError(emailField, 'That doesn\'t look like a valid email address.');
            isValid = false;
        }
    }
    const messageField = form.querySelector('#message');
    if (messageField && state.message.length === 0) {
        showError(messageField, 'Please describe what\'s happening with your machine.');
        isValid = false;
    }
    return isValid ? state : null;
};
const handleSubmit = (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form) {
        return;
    }
    const state = validateForm(form);
    if (!state) {
        displaySuccessMessage('');
        return;
    }
    if (!PLACEHOLDER_SUPPORT_EMAIL) {
        displaySuccessMessage('Update the support email address before sending messages.');
        return;
    }
    const mailtoLink = buildMailtoLink(state);
    window.location.href = mailtoLink;
    displaySuccessMessage('Launching your email app with the details.');
    form.reset();
};
const init = () => {
    updateYear();
    if (supportForm) {
        supportForm.addEventListener('submit', handleSubmit);
    }
};
init();
