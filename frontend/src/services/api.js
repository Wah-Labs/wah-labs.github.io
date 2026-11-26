
const API_ORIGIN = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const API_BASE_URL = `${API_ORIGIN}/api`;

export async function apiRequest(endpoint, options = {}) {
    const {
        method = 'GET',
        body,
        headers = {}
    } = options;

    const isFormData = body instanceof FormData;

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method,
        credentials: 'include',
        headers: {
            ...(
                body !== undefined && !isFormData
                    ? { 'Content-Type': 'application/json' }
                    : {}
            ),
            ...headers
        },
        body: body === undefined
            ? undefined
            : isFormData
                ? body
                : JSON.stringify(body)
    });

    const contentType = response.headers.get('content-type');

    const data = contentType?.includes('application/json')
        ? await response.json()
        : await response.text();

    if (!response.ok) {
        throw new Error(
            data?.message || data || `Erro HTTP: ${response.status}`
        );
    }

    return data;
}

export function registerUser(name, email, password) {
    return apiRequest('/users/register', {
        method: 'POST',
        body: { name, email, password }
    });
}

export async function searchPortfolios(query) {
    const data = await apiRequest(
        `/users/search?q=${encodeURIComponent(query)}`
    );

    return data.portfolios;
}

export function deleteSenaiProject(id) {
    return apiRequest(`/senai/${id}`, {
        method: 'DELETE'
    });
}

export async function getProjectAttachments(projectId) {
    const data = await apiRequest(`/senai/${projectId}/attachments`);
    return data.attachments;
}

export function uploadProjectAttachment(projectId, file) {
    const formData = new FormData();
    formData.append('arquivo', file);

    return apiRequest(`/senai/${projectId}/attachments`, {
        method: 'POST',
        body: formData
    });
}

export function updateSenaiProject(id, project) {
    return apiRequest(`/senai/${id}`, {
        method: 'PUT',
        body: project
    });
}

export function createSenaiProject(project) {
    return apiRequest('/senai', {
        method: 'POST',
        body: project
    });
}

export function loginUser(email, password) {
    return apiRequest('/auth/login', {
        method: 'POST',
        body: { email, password }
    });
}

export function getCurrentUser() {
    return apiRequest('/auth/me');
}

export function logoutUser() {
    return apiRequest('/auth/logout', {
        method: 'POST'
    });
}

export async function getPortfolio(id) {
    const data = await apiRequest(`/portfolio/${id}`);
    return data.portfolio;
}

export function getImageUrl(imagePath) {
    if (!imagePath) return null;

    return `${API_ORIGIN}${imagePath}`;
}

export function updateAboutMe(information) {
    return apiRequest('/portfolio/sobre-mim', {
        method: 'PUT',
        body: information
    });
}

export async function getMyPortfolio() {
    const data = await apiRequest('/portfolio/');
    return data.portfolio;
}

export function uploadProfilePicture(file) {
    const formData = new FormData();
    formData.append('foto', file);

    return apiRequest('/portfolio/sobre-mim/foto', {
        method: 'POST',
        body: formData
    });
}
